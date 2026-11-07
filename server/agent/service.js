import {createHash,randomUUID} from 'node:crypto';
import {agentConfig} from './config.js';
import {DemoAgentStore,problem} from './demo-store.js';
import {operationSchemas,validateJsonSchema} from './schemas.js';
import {MockAgentProvider} from './providers/mock-provider.js';
import {DeepSeekProvider} from './providers/deepseek-provider.js';
import {isHighRisk} from '../../src/domain.js';

const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const safeLog=(event,fields={})=>console.info(JSON.stringify({scope:'memory-garden-agent',event,at:new Date().toISOString(),...fields}));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

export class AgentService{
  constructor({config=agentConfig(),store=new DemoAgentStore(),provider}={}){
    this.config=config;this.store=store;this.provider=provider||(config.provider==='deepseek'?new DeepSeekProvider(config):new MockAgentProvider());this.idempotency=new Map();this.cache=new Map();
  }
  authenticate(headers){
    const actorId=headers['x-demo-actor-id']||headers['X-Demo-Actor-Id'];
    if(actorId)return actorId;
    if(headers.authorization?.startsWith('Bearer '))throw problem('UNAUTHENTICATED','正式 Bearer Token 校验尚未接入。');
    throw problem('UNAUTHENTICATED','请提供认证身份。');
  }
  assertBody(operation,body){
    if(!body||typeof body!=='object'||Array.isArray(body))throw problem('VALIDATION_ERROR','请求体必须为 JSON 对象。');
    if(typeof body.relationId!=='string'||!body.relationId)throw problem('VALIDATION_ERROR','relationId 是必填项。');
    if(typeof body.content==='string'&&body.content.length>this.config.maxInputChars)throw problem('VALIDATION_ERROR',`输入不能超过 ${this.config.maxInputChars} 个字符。`);
    if(['preprocess','safetyCheck'].includes(operation)&&typeof body.content!=='string')throw problem('VALIDATION_ERROR','content 是必填项。');
  }
  deterministicInput(operation,body,actorId){
    const {relationId,recordId,alignmentId}=body;
    this.store.assertMember(relationId,actorId);
    if(operation==='safetyCheck'||operation==='preprocess')return {content:body.content,purpose:body.purpose,summary:body.summary};
    if(operation==='translateMemory'){
      const record=this.store.getOwnedDraft(relationId,recordId,actorId);return {summary:record.summary||record.title};
    }
    if(operation==='mapImagery'){
      const record=this.store.getMappableRecord(relationId,recordId,actorId);const imageryType=record.mappingType||(record.kind==='image'?'flower':record.kind==='audio'?'record':record.purpose==='plan'?'branch':'plant');return {imageryType};
    }
    if(operation==='recordNarration'){
      const record=this.store.getAudioRecord(relationId,recordId,actorId);return {summary:record.summary||record.title};
    }
    if(operation==='alignmentSummary'){
      const alignment=this.store.getConfirmedAlignment(relationId,alignmentId,actorId);return {mismatches:(alignment.mismatches||[]).map(value=>({意图错位:'intent',情绪感知错位:'emotion-perception',事实认知差异:'fact-perception',期待未表达:'unspoken-expectation',语义歧义:'semantic-ambiguity'}[value]||value)).filter(value=>operationSchemas.alignmentSummary.properties.mismatches.items.enum.includes(value)),neutralSummary:alignment.neutralSummary};
    }
    throw problem('VALIDATION_ERROR','未知 Agent 操作。');
  }
  async execute(operation,body,headers={}){
    if(!operationSchemas[operation])throw problem('NOT_FOUND','不存在的 Agent 接口。');
    this.assertBody(operation,body);const actorId=this.authenticate(headers);const input=this.deterministicInput(operation,body,actorId);
    const key=headers['idempotency-key']||headers['Idempotency-Key'];
    if(typeof key!=='string'||key.length<16||key.length>128)throw problem('VALIDATION_ERROR','Idempotency-Key 必须为 16—128 个字符。');
    const fingerprint=digest({operation,actorId,body});
    if(key){const existing=this.idempotency.get(`${actorId}:${operation}:${key}`);if(existing){if(existing.fingerprint!==fingerprint)throw problem('IDEMPOTENCY_CONFLICT','幂等键不能用于不同请求。');return existing.response;}}
    if(['preprocess','safetyCheck'].includes(operation)&&isHighRisk(body.content)){
      const response=operation==='preprocess'?{safetyStatus:'paused',safe:false,requiresUserConfirmation:false,resourceStatus:'UNCONFIGURED',message:'普通流程已暂停；正式援助资源需由可验证地区配置提供。',requestId:randomUUID(),provider:'deterministic'}:{safetyStatus:'paused',safe:false,resourceStatus:'UNCONFIGURED',message:'普通流程已暂停；正式援助资源需由可验证地区配置提供。',requestId:randomUUID(),provider:'deterministic'};
      safeLog('safety.paused',{operation,actorId,relationId:body.relationId});if(key)this.idempotency.set(`${actorId}:${operation}:${key}`,{fingerprint,response});return response;
    }
    const cacheKey=digest({operation,actorId,relationId:body.relationId,recordId:body.recordId,alignmentId:body.alignmentId,input});const cached=this.cache.get(cacheKey);
    if(cached&&cached.expiresAt>Date.now()){this.idempotency.set(`${actorId}:${operation}:${key}`,{fingerprint,response:cached.response});return cached.response}
    let lastError;
    for(let attempt=0;attempt<=this.config.maxRetries;attempt++){
      try{
        const output=await this.provider.run(operation,input,operationSchemas[operation]);
        const errors=validateJsonSchema(operationSchemas[operation],output);
        if(errors.length)throw Object.assign(new Error('Provider JSON 不符合契约。'),{code:'PROVIDER_INVALID_OUTPUT',details:{fields:errors}});
        const response={...output,requestId:randomUUID(),provider:this.config.provider==='mock'?'mock':undefined};
        this.cache.set(cacheKey,{response,expiresAt:Date.now()+this.config.cacheTtlMs});if(key)this.idempotency.set(`${actorId}:${operation}:${key}`,{fingerprint,response});
        safeLog('agent.completed',{operation,actorId,relationId:body.relationId,recordId:body.recordId||null,alignmentId:body.alignmentId||null,provider:this.config.provider,attempt});return response;
      }catch(error){lastError=error;safeLog('agent.retryable_failure',{operation,actorId,relationId:body.relationId,provider:this.config.provider,code:error.code||'UNKNOWN',attempt});if(attempt<this.config.maxRetries&&['PROVIDER_TIMEOUT','PROVIDER_UNAVAILABLE','PROVIDER_INVALID_OUTPUT'].includes(error.code))await sleep(100*(attempt+1));else break;}
    }
    throw problem(lastError?.code||'PROVIDER_UNAVAILABLE','Agent 当前不可用，请稍后再试。');
  }
}
