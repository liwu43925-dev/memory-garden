export const coolingMs=60000;
export function canMap(record){return ['archived','mapped'].includes(record.status)&&record.visibility==='group'&&record.safe!==false&&!!record.mappingId}
export function transition(record,next,now=Date.now()){
 const allowed={draft:['pending-ai','abandoned'],'pending-ai':['pending-user','abandoned'],'pending-user':['cooling','archived','private','abandoned'],cooling:['archived','abandoned'],archived:['mapped','private','deleted'],mapped:['private','deleted'],private:['deleted']};
 if(!allowed[record.status]?.includes(next))throw new Error(`不允许的状态变化：${record.status} → ${next}`);
 const updated={...record,status:next,updatedAt:now};if(next==='cooling')updated.coolingEndsAt=now+coolingMs;return updated;
}
 export function visibleTo(record,groupId,memberId){return record.groupId===groupId&&(record.visibility==='group'||(record.visibility==='self'&&record.authorId===memberId))&&record.status!=='deleted'&&record.status!=='abandoned'}
export function toSceneProjection(record){if(!canMap(record))return null;const {id,groupId,mappingId,mappingType,scene,date,place}=record;const sensitive=record.purpose==='emotion'||record.purpose==='alignment';return {id:mappingId||`map-${id}`,groupId,sourceId:id,type:mappingType||'leaf',scene:scene||'garden',title:sensitive?'已确认的情绪意象':record.title,date,place:sensitive?undefined:place,summary:sensitive?'由已确认记录转译的中性意象。':record.summary,note:sensitive?undefined:record.note,explanation:'该意象来自当前关系组一条已确认、已归档且可共享的记录。'}}
export function isHighRisk(text){return /自杀|轻生|不想活|伤害自己|自伤|严重创伤/.test(text)}
export function buildCandidate(text){const clean=text.trim();return `我想认真表达：${clean.replace(/[！!]+/g,'。')} 我也希望我们能找个合适的时间沟通。`}
