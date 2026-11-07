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
