export const operationSchemas={
  preprocess:{type:'object',required:['safetyStatus','safe','requiresUserConfirmation'],additionalProperties:false,properties:{safetyStatus:{type:'string',enum:['clear','paused']},safe:{type:'boolean'},requiresUserConfirmation:{type:'boolean'},suggestedPurpose:{type:'string',enum:['memory','emotion','plan','alignment']},candidateText:{type:'string',maxLength:1200},changes:{type:'array',maxItems:6,items:{type:'string',maxLength:240}},message:{type:'string',maxLength:300},resourceStatus:{type:'string',enum:['UNCONFIGURED','CONFIGURED']}}},
  translateMemory:{type:'object',required:['safetyStatus','requiresUserConfirmation','neutralSummary'],additionalProperties:false,properties:{safetyStatus:{type:'string',enum:['clear']},requiresUserConfirmation:{const:true},neutralSummary:{type:'string',minLength:1,maxLength:500},changes:{type:'array',maxItems:6,items:{type:'string',maxLength:240}}}},
  mapImagery:{type:'object',required:['requiresUserConfirmation','imageryType','explanation'],additionalProperties:false,properties:{requiresUserConfirmation:{const:true},imageryType:{type:'string',enum:['flower','petal','leaf','branch','record','plant']},explanation:{type:'string',minLength:1,maxLength:300}}},
  recordNarration:{type:'object',required:['safetyStatus','requiresUserConfirmation','neutralSummary'],additionalProperties:false,properties:{safetyStatus:{type:'string',enum:['clear']},requiresUserConfirmation:{const:true},neutralSummary:{type:'string',minLength:1,maxLength:500}}},
  alignmentSummary:{type:'object',required:['ready','mismatches','neutralSummary'],additionalProperties:false,properties:{ready:{const:true},mismatches:{type:'array',maxItems:5,items:{type:'string',enum:['intent','emotion-perception','fact-perception','unspoken-expectation','semantic-ambiguity']}},neutralSummary:{type:'string',minLength:1,maxLength:600}}},
  safetyCheck:{type:'object',required:['safetyStatus','safe','resourceStatus','message'],additionalProperties:false,properties:{safetyStatus:{type:'string',enum:['clear','paused']},safe:{type:'boolean'},resourceStatus:{type:'string',enum:['UNCONFIGURED','CONFIGURED']},message:{type:'string',minLength:1,maxLength:300}}}
};

// A deliberately small JSON Schema validator: model output accepts no fields
// outside the operation schema and never reaches the browser as free text.
export function validateJsonSchema(schema,value,path='$'){
  if(schema.const!==undefined&&value!==schema.const)return [`${path} 必须等于常量值。`];
  if(schema.type==='object'){
    if(!value||Array.isArray(value)||typeof value!=='object')return [`${path} 必须为对象。`];
    const errors=[];
    for(const key of schema.required||[])if(!(key in value))errors.push(`${path}.${key} 是必填项。`);
    if(schema.additionalProperties===false)for(const key of Object.keys(value))if(!schema.properties?.[key])errors.push(`${path}.${key} 不允许。`);
    for(const [key,child] of Object.entries(schema.properties||{}))if(key in value)errors.push(...validateJsonSchema(child,value[key],`${path}.${key}`));
    return errors;
  }
  if(schema.type==='array'){
    if(!Array.isArray(value))return [`${path} 必须为数组。`];
    const errors=[];if(schema.maxItems!==undefined&&value.length>schema.maxItems)errors.push(`${path} 项数过多。`);
    value.forEach((item,index)=>errors.push(...validateJsonSchema(schema.items,item,`${path}[${index}]`)));return errors;
  }
  if(schema.type==='string'){
    if(typeof value!=='string')return [`${path} 必须为字符串。`];
    if(schema.minLength!==undefined&&value.length<schema.minLength)return [`${path} 过短。`];
    if(schema.maxLength!==undefined&&value.length>schema.maxLength)return [`${path} 过长。`];
    if(schema.enum&&!schema.enum.includes(value))return [`${path} 不在允许值中。`];
  }
  if(schema.type==='boolean'&&typeof value!=='boolean')return [`${path} 必须为布尔值。`];
  return [];
}
