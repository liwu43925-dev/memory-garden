// Shared API vocabulary. Both the in-browser Mock handlers and a future HTTP
// adapter import these values; no UI rule should invent a status string.
export const API_VERSION='2026-11-06';
export const RecordStatus=['draft','pending-ai','pending-user','cooling','archived','mapped','abandoned','private','deleted'];
export const Visibility=['self','group'];
export const RecordKind=['text','voice','image','audio'];
export const Purpose=['memory','emotion','plan','alignment'];
export const ImageryType=['flower','petal','leaf','branch','record','plant'];
export const AlignmentState=['draft','collecting','reviewing','saved','paused','ended','deleted'];
export const SafetyStatus=['clear','paused'];
export const TerritoryState=['active','archived','destroy-cooling','deleted'];
export const MismatchType=['intent','emotion-perception','fact-perception','unspoken-expectation','semantic-ambiguity'];

export const isEnum=(list,value)=>list.includes(value);
export const requireRelationId=(value)=>{if(!value||typeof value!=='string')throw Object.assign(new Error('relationId is required'),{code:'VALIDATION_ERROR'});return value};
export const pageResult=(items,{cursor=null,limit=50,total=items.length}={})=>({items,nextCursor:cursor,limit,total});
export const problem=(code,message,details)=>({type:`https://memory-garden.local/problems/${code.toLowerCase()}`,title:code,status:code==='FORBIDDEN'?403:code==='NOT_FOUND'?404:code==='CONFLICT'?409:400,code,message,details});
