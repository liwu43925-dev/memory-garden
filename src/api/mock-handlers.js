// Contract-shaped local handlers. They are deliberately explicit about actor
// and relationId so a real HTTP client can replace this module without UI rewrites.
 import {pageResult,problem,requireRelationId} from './shared-schema.js';
import {canProjectAlignment,coolingMs,transition,visibleTo,toSceneProjection,toMonumentProjection} from '../domain.js';

const assertMember=(state,relationId,actorId)=>{
  const group=state.groups.find(item=>item.id===relationId);
  if(!group)throw problem('NOT_FOUND','关系组不存在。');
  if(!group.memberIds.includes(actorId))throw problem('FORBIDDEN','当前身份无权访问此关系组。');
  return group;
};
// Page A never receives a reusable upload/playback URL. In production an
// authorized short-lived token is issued separately; Mock keeps only a clearly
// non-network placeholder for an eligible image preview.
const safeSceneProjection=(record)=>{
  const projection=toSceneProjection(record);
  if(!projection)return null;
  const {mediaUrl,imageUrl,audioUrl,structured,...safe}=projection;
  return {...safe,imageMediaToken:imageUrl?'mock://authorized-image-preview':null};
};

export function createMockHandlers(stateProvider){
  const state=()=>stateProvider();
  return {
    async listRelations({actorId}){return pageResult(state().groups.filter(group=>group.memberIds.includes(actorId)).map(({id,label,territoryState})=>({relationId:id,label,territoryState})));},
    async listMembers({relationId,actorId}){const group=assertMember(state(),relationId,actorId);return group.memberIds.map(memberId=>({memberId,displayName:memberId,role:'member'}));},
    async getTerritory({relationId,actorId}){const group=assertMember(state(),relationId,actorId);return {relationId,state:group.territoryState||'active',veilEnabled:false,version:`demo-${state().revision||1}`};},
    async listRecords({relationId,actorId,query={}}){requireRelationId(relationId);assertMember(state(),relationId,actorId);const rows=state().records.filter(record=>visibleTo(record,relationId,actorId)).filter(record=>!query.kind||record.kind===query.kind).filter(record=>!query.visibility||record.visibility===query.visibility).filter(record=>!query.status||record.status===query.status);return pageResult(rows.slice(0,Math.min(Number(query.limit)||50,100)));},
    async getRecord({relationId,recordId,actorId}){assertMember(state(),relationId,actorId);const record=state().records.find(item=>item.id===recordId&&item.groupId===relationId);if(!record||!visibleTo(record,relationId,actorId))throw problem('NOT_FOUND','记录不存在或不可查看。');return record;},
    async createRecord({relationId,actorId,body}){assertMember(state(),relationId,actorId);const record={id:crypto.randomUUID(),groupId:relationId,authorId:actorId,kind:body.kind,purpose:body.purpose,visibility:body.visibility,status:'draft',title:body.title||'未命名记录',summary:body.summary||'',privateText:body.rawText||'',plan:body.plan||null,createdAt:new Date().toISOString(),version:'demo-1',source:'contract-mock'};state().records.unshift(record);return record;},
    async confirmRecord({relationId,recordId,actorId,choice}){const record=await this.getRecord({relationId,recordId,actorId});if(record.authorId!==actorId)throw problem('FORBIDDEN','只有提交人可以确认该记录。');const serverNow=new Date().toISOString();if(record.purpose==='emotion'&&choice!=='abandon'){record.status='cooling';record.finalChoice=choice;record.coolingEndsAt=new Date(Date.now()+coolingMs).toISOString();record.serverNow=serverNow;return record;}record.status=choice==='abandon'?'abandoned':'archived';record.finalChoice=choice;record.serverNow=serverNow;return record;},
    async transitionRecord({relationId,recordId,actorId,to}){const record=await this.getRecord({relationId,recordId,actorId});if(record.authorId!==actorId)throw problem('FORBIDDEN','只有提交人可以变更该记录。');return Object.assign(record,transition(record,to));},
    async deleteRecord({relationId,recordId,actorId}){const record=await this.getRecord({relationId,recordId,actorId});if(record.authorId!==actorId)throw problem('FORBIDDEN','只有提交人可以删除该记录。');record.status='deleted';record.deletedAt=new Date().toISOString();return undefined;},
    async sceneSnapshot({relationId,scene,actorId}){assertMember(state(),relationId,actorId);const imagery=state().records.filter(record=>record.groupId===relationId).map(safeSceneProjection).filter(Boolean).filter(item=>item.scene===scene);const alignment=state().alignment?.groupId===relationId?toMonumentProjection(state().alignment):null;return {relationId,scene,imagery,monument:alignment,generatedAt:new Date().toISOString()};},
    async playbackToken({relationId,recordId,actorId}){const record=await this.getRecord({relationId,recordId,actorId});if(record.kind!=='audio'||record.playbackPermission!==true)throw problem('FORBIDDEN','当前音频不可播放。');return {url:'mock://authorized-audio',expiresAt:new Date(Date.now()+5*60e3).toISOString()};},
    async preprocess({relationId,actorId,purpose,content}){assertMember(state(),relationId,actorId);if(/自杀|轻生|不想活|伤害自己|自伤|严重创伤/.test(content||''))return {safetyStatus:'paused',safe:false,resourceStatus:'UNCONFIGURED',message:'普通流程已暂停；正式援助资源需由可验证地区配置提供。'};return {safetyStatus:'clear',safe:true,suggestedPurpose:purpose,requestId:crypto.randomUUID(),expiresAt:new Date(Date.now()+10*60e3).toISOString()};},
    async memoryTranslation({relationId,recordId,actorId}){const record=await this.getRecord({relationId,recordId,actorId});return {proposalId:crypto.randomUUID(),recordId:record.id,safetyStatus:'clear',requiresUserConfirmation:true,neutralSummary:record.summary||record.title||'等待本人确认的记忆整理。'};},
    async imageryMapping({relationId,recordId,actorId}){const record=await this.getRecord({relationId,recordId,actorId});const imageryType=record.kind==='image'?'flower':record.kind==='audio'?'record':record.purpose==='plan'?'branch':'plant';return {proposalId:crypto.randomUUID(),recordId:record.id,imageryType,requiresUserConfirmation:true,explanation:'这是等待用户确认的演示映射建议。'};},
    async recordNarration({relationId,recordId,actorId}){const record=await this.getRecord({relationId,recordId,actorId});if(record.kind!=='audio')throw problem('VALIDATION_ERROR','只有音频记录可生成唱片叙事建议。');return {proposalId:crypto.randomUUID(),recordId:record.id,safetyStatus:'clear',requiresUserConfirmation:true,neutralSummary:record.summary||'等待本人确认的音频记忆叙事。'};},
    async alignmentSummary({relationId,alignmentId,actorId}){assertMember(state(),relationId,actorId);const alignment=state().alignment;if(!alignment||alignment.id!==alignmentId||alignment.groupId!==relationId)throw problem('NOT_FOUND','对齐会话不存在。');if(!canProjectAlignment(alignment))return {alignmentId,ready:false,mismatches:[],neutralSummary:null};return {alignmentId,ready:true,mismatches:alignment.mismatches||[],neutralSummary:alignment.neutralSummary};},
    async createUpload({relationId,actorId,mediaKind,file}){assertMember(state(),relationId,actorId);return {uploadId:crypto.randomUUID(),relationId,mediaKind,status:'pending',uploadUrl:'mock://local-upload',expiresAt:new Date(Date.now()+5*60e3).toISOString(),fileName:file?.name||null};}
  };
}
