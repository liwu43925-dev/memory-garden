// Future real-service adapter. It intentionally follows openapi.memory-garden.yaml
// instead of the legacy UI-oriented repository method names. The app remains in
// Mock mode until an approved authenticated transport is supplied.
const encode=encodeURIComponent;
const agentPaths={preprocess:'preprocess',translateMemory:'translate-memory',mapImagery:'map-imagery',recordNarration:'record-narration',alignmentSummary:'alignment-summary',safetyCheck:'safety-check'};

export class ContractHttpAdapter{
  constructor({request,actorId}){this.request=request;this.actorId=actorId}
  call(method,path,{body,query,version,idempotencyKey}={}){
    const headers={};
    if(version)headers['If-Match']=version;
    if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
    return this.request({method,path,body,query,headers});
  }
  listRelations(){return this.call('GET','/relations')}
  listMembers(relationId){return this.call('GET',`/relations/${encode(relationId)}/members`)}
  getTerritory(relationId){return this.call('GET',`/relations/${encode(relationId)}/territory`)}
  updateTerritory(relationId,body,{version,idempotencyKey}){return this.call('PATCH',`/relations/${encode(relationId)}/territory`,{body,version,idempotencyKey})}
  listRecords(relationId,query){return this.call('GET',`/relations/${encode(relationId)}/records`,{query})}
  getRecord(relationId,recordId){return this.call('GET',`/relations/${encode(relationId)}/records/${encode(recordId)}`)}
  createRecord(relationId,body,idempotencyKey){return this.call('POST',`/relations/${encode(relationId)}/records`,{body,idempotencyKey})}
  confirmRecord(relationId,recordId,body,idempotencyKey){return this.call('POST',`/relations/${encode(relationId)}/records/${encode(recordId)}/confirm`,{body,idempotencyKey})}
  transitionRecord(relationId,recordId,to,{version,idempotencyKey}){return this.call('POST',`/relations/${encode(relationId)}/records/${encode(recordId)}/transition`,{body:{to},version,idempotencyKey})}
  sceneSnapshot(relationId,scene){return this.call('GET',`/relations/${encode(relationId)}/scene-snapshots/${encode(scene)}`)}
  createUpload(relationId,body,idempotencyKey){return this.call('POST',`/relations/${encode(relationId)}/uploads`,{body,idempotencyKey})}
  completeUpload(relationId,uploadId,idempotencyKey){return this.call('POST',`/relations/${encode(relationId)}/uploads/${encode(uploadId)}/complete`,{idempotencyKey})}
  playbackToken(relationId,recordId){return this.call('POST',`/relations/${encode(relationId)}/audio/${encode(recordId)}/playback-token`)}
  createAlignment(relationId,body,idempotencyKey){return this.call('POST',`/relations/${encode(relationId)}/alignments`,{body,idempotencyKey})}
  alignmentSummary(relationId,alignmentId){return this.call('GET',`/relations/${encode(relationId)}/alignments/${encode(alignmentId)}/summary`)}
  agentProposal(relationId,operation,body,idempotencyKey){const path=agentPaths[operation];if(!path)throw new Error(`未知 Agent operation：${operation}`);return this.call('POST',`/api/agent/${path}`,{body:{...body,relationId},idempotencyKey})}
}
