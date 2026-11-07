import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {AgentService} from '../server/agent/service.js';
import {DemoAgentStore} from '../server/agent/demo-store.js';
import {createAgentHttpHandler} from '../server/agent/http.js';

const headers={'x-demo-actor-id':'member-a','idempotency-key':'test-key-00000001'};
const service=new AgentService();

const preprocess=await service.execute('preprocess',{relationId:'group-home',purpose:'emotion',content:'我希望更早沟通计划变化'},headers);
assert.equal(preprocess.safetyStatus,'clear');assert.equal(preprocess.requiresUserConfirmation,true);
const repeated=await service.execute('preprocess',{relationId:'group-home',purpose:'emotion',content:'我希望更早沟通计划变化'},headers);
assert.equal(repeated.requestId,preprocess.requestId,'same idempotency key must replay first response');
await assert.rejects(service.execute('preprocess',{relationId:'group-home',purpose:'memory',content:'不同请求'},headers),error=>error.code==='IDEMPOTENCY_CONFLICT');

const translated=await service.execute('translateMemory',{relationId:'group-home',recordId:'rec-emotion-1'},{...headers,'idempotency-key':'test-key-00000002'});
assert.equal(translated.requiresUserConfirmation,true);
const mapped=await service.execute('mapImagery',{relationId:'group-home',recordId:'rec-photo-1'},{...headers,'idempotency-key':'test-key-00000003'});
assert.equal(mapped.imageryType,'flower');
const narration=await service.execute('recordNarration',{relationId:'group-home',recordId:'rec-audio-1'},{...headers,'idempotency-key':'test-key-00000004'});
assert.equal(narration.safetyStatus,'clear');
const alignment=await service.execute('alignmentSummary',{relationId:'group-home',alignmentId:'align-demo-1'},{...headers,'idempotency-key':'test-key-00000005'});
assert.equal(alignment.ready,true);assert(!('participants' in alignment));
const safe=await service.execute('safetyCheck',{relationId:'group-home',content:'普通演示内容'},{...headers,'idempotency-key':'test-key-00000006'});
assert.equal(safe.safetyStatus,'clear');

let providerCalls=0;
const forbiddenProvider={run(){providerCalls++;throw new Error('must not be called')}};
const safetyService=new AgentService({provider:forbiddenProvider});
const paused=await safetyService.execute('safetyCheck',{relationId:'group-home',content:'模拟高危关键词：不想活'},{...headers,'idempotency-key':'test-key-00000007'});
assert.equal(paused.safetyStatus,'paused');assert.equal(providerCalls,0,'deterministic safety pause must precede provider');

await assert.rejects(service.execute('mapImagery',{relationId:'group-home',recordId:'rec-private-1'},{'x-demo-actor-id':'member-b','idempotency-key':'test-key-00000008'}),error=>error.code==='NOT_FOUND');
await assert.rejects(service.execute('preprocess',{relationId:'group-home',content:'无权访问'},{'x-demo-actor-id':'member-c','idempotency-key':'test-key-00000009'}),error=>error.code==='FORBIDDEN');
await assert.rejects(service.execute('preprocess',{relationId:'group-home',content:'x'.repeat(4001)},{...headers,'idempotency-key':'test-key-00000010'}),error=>error.code==='VALIDATION_ERROR');

const coolingStore=new DemoAgentStore();coolingStore.records.push({id:'cooling-test',groupId:'group-home',authorId:'member-a',kind:'image',purpose:'memory',status:'cooling',visibility:'group',safe:true,mappingId:'map-cooling'});
const coolingService=new AgentService({store:coolingStore});
await assert.rejects(coolingService.execute('mapImagery',{relationId:'group-home',recordId:'cooling-test'},{...headers,'idempotency-key':'test-key-00000011'}),error=>error.code==='STATE_CONFLICT');

let invalidCalls=0;const invalidProvider={async run(){invalidCalls++;return {freeText:'invalid'}}};
const invalidService=new AgentService({provider:invalidProvider,config:{...service.config,maxRetries:1,provider:'mock'}});
await assert.rejects(invalidService.execute('translateMemory',{relationId:'group-home',recordId:'rec-emotion-1'},{...headers,'idempotency-key':'test-key-00000012'}),error=>error.code==='PROVIDER_INVALID_OUTPUT');
assert.equal(invalidCalls,2,'invalid model output gets only the configured retry');

const handler=createAgentHttpHandler({service:new AgentService()});
const httpServer=createServer(async(req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(!await handler(req,res,pathname))res.writeHead(404).end()});
await new Promise(resolve=>httpServer.listen(0,'127.0.0.1',resolve));
try{
  const port=httpServer.address().port;
  const response=await fetch(`http://127.0.0.1:${port}/api/agent/map-imagery`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Actor-Id':'member-a','Idempotency-Key':'http-test-0000001'},body:JSON.stringify({relationId:'group-home',recordId:'rec-photo-1'})});
  assert.equal(response.status,200);const body=await response.json();assert.equal(body.imageryType,'flower');
}finally{await new Promise(resolve=>httpServer.close(resolve))}

console.log('Agent backend tests: PASS (DeepSeek real call: NOT RUN)');
