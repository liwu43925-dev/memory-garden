import assert from 'node:assert/strict';
import {DEMO_ALIGNMENT,DEMO_GROUPS,DEMO_RECORDS} from '../src/data/fixtures.js';
import {createMockHandlers} from '../src/api/mock-handlers.js';
import {AgentClient} from '../src/api/agent-client.js';
import {planMissingFields,toMonumentProjection,toSceneProjection} from '../src/domain.js';
import {AgentService} from '../server/agent/service.js';
import {DemoAgentStore} from '../server/agent/demo-store.js';

const state={groups:structuredClone(DEMO_GROUPS),records:structuredClone(DEMO_RECORDS),alignment:structuredClone(DEMO_ALIGNMENT),revision:3};
const api=createMockHandlers(()=>state);const actorId='member-a',relationId='group-home';

// Create → preprocess → confirm → cooling cancellation.
const agent=new AgentService();
const prep=await agent.execute('preprocess',{relationId,purpose:'emotion',content:'希望计划变化时能更早沟通'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-prep-01'});
assert.equal(prep.requiresUserConfirmation,true);
const emotion=await api.createRecord({relationId,actorId,body:{kind:'text',purpose:'emotion',visibility:'group',rawText:'仅供页面 B 审计'}});
await api.transitionRecord({relationId,recordId:emotion.id,actorId,to:'pending-ai'});await api.transitionRecord({relationId,recordId:emotion.id,actorId,to:'pending-user'});
const cooling=await api.confirmRecord({relationId,recordId:emotion.id,actorId,choice:'candidate'});
assert.equal(cooling.status,'cooling');assert(Number.isFinite(Date.parse(cooling.coolingEndsAt)));assert(Number.isFinite(Date.parse(cooling.serverNow)));
assert.equal(toSceneProjection(cooling),null);await api.transitionRecord({relationId,recordId:emotion.id,actorId,to:'abandoned'});assert.equal(toSceneProjection(emotion),null);

// Cooling expiry is a server transition; archive/map only after the deadline path.
const expiring=await api.createRecord({relationId,actorId,body:{kind:'text',purpose:'emotion',visibility:'group',rawText:'到期测试'}});
await api.transitionRecord({relationId,recordId:expiring.id,actorId,to:'pending-ai'});await api.transitionRecord({relationId,recordId:expiring.id,actorId,to:'pending-user'});await api.confirmRecord({relationId,recordId:expiring.id,actorId,choice:'original'});
await api.transitionRecord({relationId,recordId:expiring.id,actorId,to:'archived'});Object.assign(expiring,{mappingId:`map-${expiring.id}`,mappingType:'plant',scene:'garden',summary:'经确认的中性环境变化'});await api.transitionRecord({relationId,recordId:expiring.id,actorId,to:'mapped'});
assert(toSceneProjection(expiring));

// Image mapping and deletion synchronize with the safe scene projection.
const image=await api.createRecord({relationId,actorId,body:{kind:'image',purpose:'memory',visibility:'group',title:'联调图片'}});
await api.transitionRecord({relationId,recordId:image.id,actorId,to:'pending-ai'});await api.transitionRecord({relationId,recordId:image.id,actorId,to:'pending-user'});await api.confirmRecord({relationId,recordId:image.id,actorId,choice:'confirm'});Object.assign(image,{mappingId:`map-${image.id}`,mappingType:'leaf',scene:'garden',safe:true});await api.transitionRecord({relationId,recordId:image.id,actorId,to:'mapped'});
let snapshot=await api.sceneSnapshot({relationId,scene:'garden',actorId});assert(snapshot.imagery.some(item=>item.sourceRecordId===image.id));assert(!JSON.stringify(snapshot).includes('仅供页面 B 审计'));
await api.deleteRecord({relationId,recordId:image.id,actorId});snapshot=await api.sceneSnapshot({relationId,scene:'garden',actorId});assert(!snapshot.imagery.some(item=>item.sourceRecordId===image.id));

// Image/audio/plan rules.
const photoProposal=await agent.execute('mapImagery',{relationId,recordId:'rec-photo-1'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-photo-01'});assert(['flower','petal','leaf'].includes(photoProposal.imageryType));
const audioProposal=await agent.execute('recordNarration',{relationId,recordId:'rec-audio-1'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-audio-01'});assert.equal(audioProposal.requiresUserConfirmation,true);
assert.deepEqual(planMissingFields({date:'2026-11-09',time:'18:30',place:'家中',action:'一起做饭',timeMeaning:'arrival'}),[]);assert(planMissingFields({date:'2026-11-09'}).length>0);
const upload=await api.createUpload({relationId,actorId,mediaKind:'image',file:{name:'demo.png'}});assert.equal(upload.status,'pending');

// Alignment isolation/gates and neutral shared result.
const unfinished=structuredClone(DEMO_ALIGNMENT);unfinished.participants[1].reviewed=false;assert.equal(toMonumentProjection(unfinished),null);
const unfinishedStore=new DemoAgentStore();unfinishedStore.alignment=unfinished;const unfinishedAgent=new AgentService({store:unfinishedStore});
await assert.rejects(unfinishedAgent.execute('alignmentSummary',{relationId,alignmentId:'align-demo-1'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-align-00'}),error=>error.code==='STATE_CONFLICT');
const common=await agent.execute('alignmentSummary',{relationId,alignmentId:'align-demo-1'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-align-01'});assert.equal(common.ready,true);assert(!('participants' in common)&&!('fields' in common));

// Safety, relation isolation, refresh recovery and network failure.
const paused=await agent.execute('safetyCheck',{relationId,content:'模拟高危关键词：不想活'},{'x-demo-actor-id':actorId,'idempotency-key':'integration-safe-01'});assert.equal(paused.safetyStatus,'paused');
await assert.rejects(agent.execute('preprocess',{relationId,content:'越权测试'},{'x-demo-actor-id':'member-c','idempotency-key':'integration-deny-01'}),error=>error.code==='FORBIDDEN');
const refreshedApi=createMockHandlers(()=>state);const recovered=await refreshedApi.getRecord({relationId,recordId:expiring.id,actorId});assert.equal(recovered.status,'mapped');
const offlineClient=new AgentClient({actorId:()=>actorId,fetchImpl:async()=>{throw new Error('offline')}});await assert.rejects(offlineClient.preprocess({relationId,content:'网络错误'},{idempotencyKey:'integration-offline'}),error=>error.code==='NETWORK_ERROR');

// A/B deep-link routes are served by the same SPA; source IDs remain in the URL.
const base=process.env.INTEGRATION_BASE_URL||'http://127.0.0.1:4173';
for(const path of [`/r/${relationId}/workspace/archive/rec-photo-1`,`/r/${relationId}/space/home?object=map-photo-1`]){const response=await fetch(base+path);assert.equal(response.status,200);const html=await response.text();assert(html.includes('id="app"'))}

console.log('Memory Garden integration: MOCK PASS (DeepSeek real: NOT RUN)');
