// 可替换的界面文案。仅集中当前页面标题、导航与场景提示；
// src/app.js 中流程表单的长文案仍需后续逐步迁移，改文案不应改状态机。
export const CONTENT = {
  brand: '记忆花园',
  archiveEntry: '查看文字档案与对齐记录',
  pages: {new:'新建记录',archive:'普通档案',alignment:'认知对齐',settings:'关系设置'},
  scenes: {garden:'花园',home:'老屋庭院'},
  emptyScene:'当前关系组暂无已映射意象。添加并确认记录后，场景才会生长。',
  whyChanged:'为什么出现这个变化？'
};

// 页面 B 的可替换 Demo 文案与选项。业务状态、权限和映射仍由 domain.js 决定。
export const WORKSPACE_COPY={
  demoLabel:'演示数据',
  safetyBoundary:'本地 Demo 只暂停普通流程，不提供诊断；正式援助资源需由后端按地区接入可验证来源。',
  purposes:{memory:'普通记忆',emotion:'情绪表达',plan:'计划 / 心愿',alignment:'发起认知对齐'},
  imageryTypes:{flower:'花朵',petal:'花瓣',leaf:'树叶'},
  audioTypes:['喜欢的音乐','用户录音','语音回忆','演唱片段'],
  visibility:{self:'仅自己可见（不生成共享意象）',group:'关系组可见'},
  planFields:{date:'日期',time:'时间',timezone:'时区',place:'地点',participants:'参与人',action:'动作',timeMeaning:'出发 / 到达语义',reminder:'提醒方式'}
};
