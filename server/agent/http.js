import {AgentService} from './service.js';

const operations={
  '/api/agent/preprocess':'preprocess',
  '/api/agent/translate-memory':'translateMemory',
  '/api/agent/map-imagery':'mapImagery',
  '/api/agent/record-narration':'recordNarration',
  '/api/agent/alignment-summary':'alignmentSummary',
  '/api/agent/safety-check':'safetyCheck'
};
const json=(res,status,payload,type='application/json; charset=utf-8')=>res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(JSON.stringify(payload));
const headersObject=headers=>Object.fromEntries(Object.entries(headers).map(([key,value])=>[key,String(value||'')]));
async function readJson(req,maxBytes=16*1024){
  if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))throw Object.assign(new Error('Content-Type 必须为 application/json。'),{code:'VALIDATION_ERROR',status:400});
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw Object.assign(new Error('请求体过大。'),{code:'VALIDATION_ERROR',status:413});chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(new Error('请求体不是有效 JSON。'),{code:'VALIDATION_ERROR',status:400})}
}
const problemBody=(error,requestId)=>({type:`https://memory-garden.local/problems/${String(error.code||'INTERNAL_ERROR').toLowerCase()}`,title:error.code||'INTERNAL_ERROR',status:error.status||500,code:error.code||'INTERNAL_ERROR',message:error.status&&error.status<500?error.message:'服务暂时不可用。',requestId,details:error.details});

export function createAgentHttpHandler({service=new AgentService()}={}){
  return async function handleAgent(req,res,pathname){
    const operation=operations[pathname];if(!operation)return false;
    const requestId=String(req.headers['x-request-id']||crypto.randomUUID());
    if(req.method!=='POST'){json(res,405,{code:'METHOD_NOT_ALLOWED',message:'仅支持 POST。',requestId},'application/problem+json; charset=utf-8');return true}
    try{const body=await readJson(req);const result=await service.execute(operation,body,headersObject(req.headers));json(res,200,{...result,requestId:result.requestId||requestId});}
    catch(error){json(res,error.status||500,problemBody(error,requestId),'application/problem+json; charset=utf-8')}
    return true;
  };
}
