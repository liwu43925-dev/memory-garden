import assert from 'node:assert/strict';
import {DEMO_ALIGNMENT,DEMO_GROUPS,DEMO_RECORDS} from '../src/data/fixtures.js';
import {createMockHandlers} from '../src/api/mock-handlers.js';

const state={groups:structuredClone(DEMO_GROUPS),records:structuredClone(DEMO_RECORDS),alignment:structuredClone(DEMO_ALIGNMENT),revision:2};
const api=createMockHandlers(()=>state);
const actorId='member-a';
const relationId='group-home';

const relations=await api.listRelations({actorId});
assert(relations.items.some(item=>item.relationId===relationId));

const snapshot=await api.sceneSnapshot({relationId,scene:'home',actorId});
assert(snapshot.imagery.length>0,'scene projection should contain eligible demo imagery');
const forbiddenKeys=['privateText','rawText','transcript','candidate','fields','participants','mediaUrl','imageUrl','audioUrl','structured'];
for(const projection of [...snapshot.imagery,snapshot.monument].filter(Boolean)){
  for(const key of forbiddenKeys)assert(!(key in projection),`Page A projection leaked ${key}`);
}

await assert.rejects(
  api.getRecord({relationId:'group-home',recordId:'rec-private-1',actorId:'member-b'}),
  error=>error.code==='NOT_FOUND'
);

const safe=await api.preprocess({relationId,actorId,purpose:'emotion',content:'这是一个演示输入'});
assert.equal(safe.safetyStatus,'clear');
const paused=await api.preprocess({relationId,actorId,purpose:'emotion',content:'这是模拟高危关键词：不想活'});
assert.equal(paused.safetyStatus,'paused');

const mapping=await api.imageryMapping({relationId,recordId:'rec-photo-1',actorId});
assert.equal(mapping.imageryType,'flower');
assert.equal(mapping.requiresUserConfirmation,true);
const summary=await api.alignmentSummary({relationId,alignmentId:'align-demo-1',actorId});
assert.equal(summary.ready,true);

const created=await api.createRecord({relationId,actorId,body:{kind:'text',purpose:'emotion',visibility:'group',rawText:'仅供 B 页演示的输入'}});
const cooling=await api.confirmRecord({relationId,recordId:created.id,actorId,choice:'candidate'});
assert.equal(cooling.status,'cooling');
assert(Date.parse(cooling.coolingEndsAt)>Date.parse(cooling.serverNow),'cooling must use an absolute server time');
const afterCreate=await api.sceneSnapshot({relationId,scene:'garden',actorId});
assert(!afterCreate.imagery.some(item=>item.sourceRecordId===created.id),'cooling records must not map into Page A');

console.log('API contract mock smoke: PASS');
