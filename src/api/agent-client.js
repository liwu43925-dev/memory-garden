const paths={preprocess:'preprocess',translateMemory:'translate-memory',mapImagery:'map-imagery',recordNarration:'record-narration',alignmentSummary:'alignment-summary',safetyCheck:'safety-check'};
export class AgentApiError extends Error{constructor(problem,status){super(problem?.message||'Agent 请求失败');this.name='AgentApiError';this.code=problem?.code||'NETWORK_ERROR';this.status=status;this.problem=problem}}
export class AgentClient{
  constructor({baseUrl='',actorId=()=>null,fetchImpl=fetch}={}){this.baseUrl=baseUrl;this.actorId=actorId;this.fetchImpl=fetchImpl}
  async call(operation,body,{idempotencyKey=crypto.randomUUID()}={}){
    const path=paths[operation];if(!path)throw new AgentApiError({code:'VALIDATION_ERROR',message:`未知 Agent operation：${operation}`},400);
    let response;
    try{response=await this.fetchImpl(`${this.baseUrl}/api/agent/${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Actor-Id':this.actorId()||'','Idempotency-Key':idempotencyKey},body:JSON.stringify(body)})}
    catch{throw new AgentApiError({code:'NETWORK_ERROR',message:'无法连接 Agent 后端，请检查本地服务。'},0)}
    let payload;try{payload=await response.json()}catch{payload={code:'INVALID_RESPONSE',message:'Agent 后端返回了无效响应。'}}
    if(!response.ok)throw new AgentApiError(payload,response.status);return payload;
  }
  preprocess(body,options){return this.call('preprocess',body,options)}
}
