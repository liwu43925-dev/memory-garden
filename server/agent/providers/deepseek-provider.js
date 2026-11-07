const systemPrompt=(operation)=>`你是 Memory Garden 的受限结构化服务。任务：${operation}。只输出符合给定 JSON Schema 的 JSON 对象，不输出 Markdown、解释或额外字段。不得诊断、高危内容不得浪漫化；不得声称已发送、公开、修复关系或代表用户做决定。`;

export class DeepSeekProvider{
  constructor(config){this.config=config}
  async run(operation,input,schema){
    if(!this.config.deepseekApiKey)throw Object.assign(new Error('DeepSeek Provider 未配置服务端密钥。'),{code:'PROVIDER_UNAVAILABLE'});
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),this.config.timeoutMs);
    try{
      const response=await fetch(`${this.config.deepseekBaseUrl}/chat/completions`,{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${this.config.deepseekApiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:this.config.deepseekModel,temperature:0,response_format:{type:'json_object'},messages:[{role:'system',content:systemPrompt(operation)},{role:'user',content:JSON.stringify({input,jsonSchema:schema})}]})});
      if(!response.ok)throw Object.assign(new Error(`Provider HTTP ${response.status}`),{code:'PROVIDER_UNAVAILABLE'});
      const payload=await response.json();const content=payload?.choices?.[0]?.message?.content;
      if(typeof content!=='string')throw Object.assign(new Error('Provider 未返回 JSON 内容。'),{code:'PROVIDER_INVALID_OUTPUT'});
      try{return JSON.parse(content)}catch{throw Object.assign(new Error('Provider 返回的不是 JSON。'),{code:'PROVIDER_INVALID_OUTPUT'})}
    }catch(error){if(error.name==='AbortError')throw Object.assign(new Error('Provider 请求超时。'),{code:'PROVIDER_TIMEOUT'});throw error}
    finally{clearTimeout(timeout)}
  }
}
