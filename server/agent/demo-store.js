import {DEMO_ALIGNMENT,DEMO_GROUPS,DEMO_RECORDS} from '../../src/data/fixtures.js';
import {canProjectAlignment,visibleTo} from '../../src/domain.js';

const clone=value=>structuredClone(value);
export class DemoAgentStore{
  constructor(){this.groups=clone(DEMO_GROUPS);this.records=clone(DEMO_RECORDS);this.alignment=clone(DEMO_ALIGNMENT)}
  assertMember(relationId,actorId){const group=this.groups.find(item=>item.id===relationId);if(!group)throw problem('NOT_FOUND','关系组不存在。');if(!group.memberIds.includes(actorId))throw problem('FORBIDDEN','当前身份无权访问此关系组。');return group}
  getRecord(relationId,recordId,actorId){this.assertMember(relationId,actorId);const record=this.records.find(item=>item.id===recordId&&item.groupId===relationId);if(!record||!visibleTo(record,relationId,actorId))throw problem('NOT_FOUND','记录不存在或不可查看。');return record}
  getOwnedDraft(relationId,recordId,actorId){const record=this.getRecord(relationId,recordId,actorId);if(record.authorId!==actorId)throw problem('FORBIDDEN','只有提交人可以请求该记录的 Agent 处理。');if(['abandoned','deleted'].includes(record.status)||record.safetyStatus==='paused')throw problem('STATE_CONFLICT','该记录当前不可处理。');return record}
  getMappableRecord(relationId,recordId,actorId){const record=this.getOwnedDraft(relationId,recordId,actorId);const eligible=['archived','mapped'].includes(record.status)&&record.visibility==='group'&&record.safe!==false&&record.safetyStatus!=='paused'&&!record.deletedAt;if(!eligible)throw problem('STATE_CONFLICT','记录尚未确认、归档或允许关系组查看，不能映射。');return record}
  getAudioRecord(relationId,recordId,actorId){const record=this.getMappableRecord(relationId,recordId,actorId);if(record.kind!=='audio'||record.playbackPermission===false)throw problem('FORBIDDEN','该音频当前不可生成唱片叙事。');return record}
  getConfirmedAlignment(relationId,alignmentId,actorId){this.assertMember(relationId,actorId);const alignment=this.alignment;if(!alignment||alignment.id!==alignmentId||alignment.groupId!==relationId)throw problem('NOT_FOUND','对齐会话不存在。');if(!canProjectAlignment(alignment))throw problem('STATE_CONFLICT','双方本人核验与确认保存完成前，不能生成对齐摘要。');return alignment}
}
export const problem=(code,message,statusMap={VALIDATION_ERROR:400,UNAUTHENTICATED:401,FORBIDDEN:403,NOT_FOUND:404,STATE_CONFLICT:409,IDEMPOTENCY_CONFLICT:409,SAFETY_PAUSED:422,PROVIDER_TIMEOUT:504,PROVIDER_UNAVAILABLE:503,PROVIDER_INVALID_OUTPUT:502})=>Object.assign(new Error(message),{code,status:statusMap[code]||500});
