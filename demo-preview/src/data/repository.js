import {DEMO_GROUPS,DEMO_RECORDS,DEMO_ALIGNMENT} from './fixtures.js';
import {readState,writeState,clearState} from './storage.js';
import {transition,visibleTo,toSceneProjection} from '../domain.js';
const clone=x=>structuredClone(x);
export class MockRepository{
 constructor(){this.state=null;this.ready=this.init()}
 async init(){this.state=await readState()||{groups:clone(DEMO_GROUPS),records:clone(DEMO_RECORDS),alignment:clone(DEMO_ALIGNMENT),revision:1};await this.persist()}
 async persist(){await writeState(this.state)} async ensure(){await this.ready}
 async groups(){await this.ensure();return clone(this.state.groups)}
 async getRecords(groupId,memberId,filters={}){await this.ensure();return clone(this.state.records.filter(r=>visibleTo(r,groupId,memberId)&&(!filters.kind||r.kind===filters.kind)&&(!filters.status||r.status===filters.status)&&(!filters.visibility||r.visibility===filters.visibility)&&(!filters.q||`${r.title} ${r.summary}`.includes(filters.q))))}
 async getRecord(groupId,id,memberId){await this.ensure();const r=this.state.records.find(x=>x.id===id&&x.groupId===groupId);if(!r||!visibleTo(r,groupId,memberId))return null;return clone(r)}
 async scene(groupId,scene){await this.ensure();return clone(this.state.records.filter(r=>r.groupId===groupId&&r.scene===scene).map(toSceneProjection).filter(Boolean))}
 async create(record){await this.ensure();this.state.records.unshift({...record,id:crypto.randomUUID(),status:'draft',createdAt:Date.now(),groupId:record.groupId});this.state.revision++;await this.persist();return clone(this.state.records[0])}
 async update(id,fn){await this.ensure();const i=this.state.records.findIndex(r=>r.id===id);if(i<0)throw new Error('记录不可用');this.state.records[i]=fn(this.state.records[i]);this.state.revision++;await this.persist();return clone(this.state.records[i])}
 async changeStatus(id,next){return this.update(id,r=>{let updated=transition(r,next);if(next==='archived'&&r.kind==='audio'&&r.visibility==='group'){updated=transition({...updated,mappingId:`map-${r.id}`,mappingType:'record',scene:r.scene||'garden'},'mapped')}return updated})}
 async delete(id){return this.update(id,r=>transition(r,'deleted'))}
 async alignment(groupId){await this.ensure();if(groupId!==this.state.alignment.groupId)return null;return clone(this.state.alignment)}
 async saveAlignment(){await this.ensure();this.state.alignment.state='saved';await this.persist()}
 async updateAlignment(fn){await this.ensure();fn(this.state.alignment);await this.persist();return clone(this.state.alignment)}
 async reset(){await clearState();this.state={groups:clone(DEMO_GROUPS),records:clone(DEMO_RECORDS),alignment:clone(DEMO_ALIGNMENT),revision:1};await this.persist()}
}
// Real API adapter boundary. Implement methods against an approved service contract; UI depends only on this interface.
export class ApiRepository{constructor(client){this.client=client}async groups(){return this.client.get('/groups')}async getRecords(g,m,f){return this.client.get(`/groups/${g}/records`,{member:m,filters:f})}async getRecord(g,id,m){return this.client.get(`/groups/${g}/records/${id}`,{member:m})}async scene(g,s){return this.client.get(`/groups/${g}/scene/${s}`)}async create(record){return this.client.post('/records',record)}async update(id,patch){return this.client.patch(`/records/${id}`,patch)}async changeStatus(id,status){return this.client.post(`/records/${id}/transition`,{status})}async delete(id){return this.client.delete(`/records/${id}`)}async alignment(g){return this.client.get(`/groups/${g}/alignment`)}async updateAlignment(id,payload){return this.client.patch(`/alignment/${id}`,payload)}async saveAlignment(id,payload){return this.client.post(`/alignment/${id}/save`,payload)}async reset(){throw new Error('正式 API 不提供 Demo 重置')}}
