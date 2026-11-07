export const coolingMs=60000;
export function canMap(record){return ['archived','mapped'].includes(record.status)&&record.visibility==='group'&&record.safe!==false&&record.safetyStatus!=='paused'&&!record.deletedAt&&!!record.mappingId}
export function transition(record,next,now=Date.now()){
 const allowed={draft:['pending-ai','abandoned'],'pending-ai':['pending-user','abandoned'],'pending-user':['cooling','archived','private','abandoned'],cooling:['archived','abandoned'],archived:['mapped','private','deleted'],mapped:['private','deleted'],private:['deleted']};
 if(!allowed[record.status]?.includes(next))throw new Error(`不允许的状态变化：${record.status} → ${next}`);
 const updated={...record,status:next,updatedAt:now};if(next==='cooling')updated.coolingEndsAt=now+coolingMs;return updated;
}
 export function visibleTo(record,groupId,memberId){return record.groupId===groupId&&(record.visibility==='group'||(record.visibility==='self'&&record.authorId===memberId))&&record.status!=='deleted'&&record.status!=='abandoned'}
const positionFor=(id,type)=>{let hash=0;for(const char of id)hash=(hash*31+char.charCodeAt(0))>>>0;const slots=type==='record'?[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}]:type==='branch'?[{x:39,y:30},{x:49,y:29},{x:31,y:37},{x:55,y:40}]:[{x:33,y:31},{x:42,y:24},{x:50,y:36},{x:27,y:43},{x:57,y:28},{x:38,y:42}];return slots[hash%slots.length]};
export function toSceneProjection(record){
 if(!canMap(record))return null;
 const {id,groupId,mappingId,scene,date,place}=record;
 const type=record.kind==='image'&&['flower','petal','leaf'].includes(record.mappingType)?record.mappingType:record.purpose==='plan'?'branch':record.kind==='audio'?'record':record.purpose==='emotion'||record.kind==='text'?'plant':null;
 if(!type)return null;
 const sensitive=record.purpose==='emotion'||record.purpose==='alignment';
 const imageryId=mappingId,sourceRecordId=id,relationId=groupId;
 return {id:imageryId,imageryId,sourceId:sourceRecordId,sourceRecordId,groupId:relationId,relationId,type,imageryType:type,scene:scene||'garden',position:record.mappingPosition||positionFor(id,type),createdAt:record.createdAt||record.date||null,visibility:record.visibility,status:record.status,title:sensitive?'已确认的情绪意象':record.title,eventName:sensitive?'已确认的情绪意象':record.title,date,occurredAt:date,place:sensitive?undefined:place,location:sensitive?undefined:place,summary:sensitive?'由已确认记录转译的中性意象。':record.summary,note:sensitive?undefined:record.note,mediaUrl:record.kind==='image'||record.kind==='audio'?record.mediaUrl||null:null,imageUrl:record.kind==='image'?record.mediaUrl||null:null,audioUrl:record.kind==='audio'?record.mediaUrl||null:null,audioType:record.audioType||null,playbackPermission:record.playbackPermission!==false,recordDiscId:type==='record'?`disc-${id}`:null,structured:type==='branch'?record.structured||null:null,emotionTag:record.confirmedEmotionTag||null,confirmedEmotionTag:record.confirmedEmotionTag||null,explanation:'该意象来自当前关系组一条已确认、已归档且可共享的记录。'};
}
export function canProjectAlignment(alignment){
 return !!alignment&&alignment.userInitiated===true&&alignment.state==='saved'&&alignment.resultConfirmed===true&&alignment.visibility==='group'&&alignment.safe!==false&&alignment.safetyStatus!=='paused'&&!alignment.deletedAt&&alignment.participants?.length===2&&alignment.participants.every(p=>p.submitted===true&&p.reviewed===true&&p.analysisConfirmed===true);
}
export function toMonumentProjection(alignment){
 if(!canProjectAlignment(alignment))return null;
 const confirmedAt=alignment.confirmedAt||alignment.updatedAt||alignment.createdAt;
 return {monumentId:`monument-${alignment.groupId}`,relationId:alignment.groupId,confirmedAlignmentCount:1,marks:[{alignmentId:alignment.id,confirmedAt,markType:'light',status:'active'}],latestAlignmentId:alignment.id,confirmedAt,summary:alignment.neutralSummary||'存在过一次被双方确认的理解整理。',isDemo:alignment.isDemo===true};
}
export function isHighRisk(text){return /自杀|轻生|不想活|伤害自己|自伤|严重创伤/.test(text)}
export function buildCandidate(text){const clean=text.trim();return `我想认真表达：${clean.replace(/[！!]+/g,'。')} 我也希望我们能找个合适的时间沟通。`}
export const requiredPlanFields=['date','time','place','action','timeMeaning'];
export function planMissingFields(plan={}){return requiredPlanFields.filter(field=>!String(plan[field]??'').trim())}
