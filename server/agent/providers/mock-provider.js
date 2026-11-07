const highRisk=/自杀|轻生|不想活|伤害自己|自伤|严重创伤/;
const neutral=(text,fallback)=>String(text||'').trim().replace(/\s+/g,' ').slice(0,120)||fallback;

export class MockAgentProvider{
  async run(operation,input){
    if(operation==='safetyCheck'||operation==='preprocess'){
      const paused=highRisk.test(input.content||'');
      if(paused)return {safetyStatus:'paused',safe:false,requiresUserConfirmation:false,resourceStatus:'UNCONFIGURED',message:'普通流程已暂停；正式援助资源需由可验证地区配置提供。'};
      if(operation==='safetyCheck')return {safetyStatus:'clear',safe:true,resourceStatus:'UNCONFIGURED',message:'未触发演示安全暂停。'};
      return {safetyStatus:'clear',safe:true,requiresUserConfirmation:true,suggestedPurpose:input.purpose||'memory',candidateText:`我想认真表达：${neutral(input.content,'这段记忆')}。`,changes:['保留原意，使用更温和、可沟通的表达。']};
    }
    if(operation==='translateMemory')return {safetyStatus:'clear',requiresUserConfirmation:true,neutralSummary:input.summary||'等待本人确认的记忆整理。',changes:['这是演示建议，尚未公开或映射。']};
    if(operation==='mapImagery')return {requiresUserConfirmation:true,imageryType:input.imageryType||'plant',explanation:'演示建议：确认后才会成为场景意象。'};
    if(operation==='recordNarration')return {safetyStatus:'clear',requiresUserConfirmation:true,neutralSummary:input.summary||'等待本人确认的音频记忆叙事。'};
    if(operation==='alignmentSummary')return {ready:true,mismatches:input.mismatches||[],neutralSummary:input.neutralSummary||'双方完成了一次经过本人核验的理解整理。'};
    throw Object.assign(new Error('未知 Agent 操作。'),{code:'VALIDATION_ERROR'});
  }
}
