const integer=(value,fallback,min,max)=>{
  const parsed=Number.parseInt(value??'',10);
  return Number.isFinite(parsed)?Math.max(min,Math.min(max,parsed)):fallback;
};

export function agentConfig(env=process.env){
  loadLocalEnv();
  const provider=(env.AGENT_PROVIDER||'mock').toLowerCase();
  if(!['mock','deepseek'].includes(provider))throw Object.assign(new Error('AGENT_PROVIDER 必须为 mock 或 deepseek。'),{code:'CONFIG_ERROR'});
  return {
    provider,
    deepseekApiKey:env.DEEPSEEK_API_KEY||'',
    deepseekBaseUrl:(env.DEEPSEEK_BASE_URL||'https://api.deepseek.com').replace(/\/+$/,''),
    deepseekModel:env.DEEPSEEK_MODEL||'deepseek-chat',
    timeoutMs:integer(env.AGENT_REQUEST_TIMEOUT_MS,30000,1000,60000),
    maxRetries:integer(env.AGENT_MAX_RETRIES,1,0,2),
    maxInputChars:4000,
    cacheTtlMs:5*60*1000
  };
}
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const allowedEnv=new Set(['DEEPSEEK_API_KEY','DEEPSEEK_BASE_URL','DEEPSEEK_MODEL','AGENT_PROVIDER','AGENT_REQUEST_TIMEOUT_MS','AGENT_MAX_RETRIES']);
let loaded=false;
function loadLocalEnv(){
  if(loaded)return;loaded=true;
  for(const name of ['.env.local','.env']){
    const file=resolve(process.cwd(),name);if(!existsSync(file))continue;
    for(const line of readFileSync(file,'utf8').split(/\r?\n/)){
      const match=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(!match||!allowedEnv.has(match[1])||process.env[match[1]]!==undefined)continue;
      const value=match[2].replace(/^(['"])(.*)\1$/,'$2');process.env[match[1]]=value;
    }
  }
}

