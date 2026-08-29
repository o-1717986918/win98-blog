export const arcDocs = [
  { id: 'arcvellum-release', no: '01', group: 'PRODUCT', label: 'PRODUCT', title: '三万字闭环之后，我才敢把它叫作产品', note: '起点、正式路线、v0.99 证据与 Beta 边界' },
  { id: 'arcvellum-orrery-frontend', no: '02', group: 'SPATIAL FRONTEND', label: 'FRONTEND', title: '星仪不是一次设计成的', note: '从按钮星图到活字天穹，以及 1000 场景的性能债' },
  { id: 'arcvellum-policy-kernel', no: '03', group: 'LITERARY KERNEL', label: 'KERNEL', title: '我为什么不断把权力从 Agent 手里拿回来', note: '状态机、候选/事实分层、审查与晋升门禁' },
  { id: 'arcvellum-agent-runtime', no: '04', group: 'RUNTIME & DELIVERY', label: 'RUNTIME', title: '一次昂贵任务怎样被反复救回来', note: '双工作区、最小权限、预检、修复与恢复' },
  { id: 'arcvellum-engineering-delivery', no: '05', group: 'RUNTIME & DELIVERY', label: 'DELIVERY', title: '安装包不是最后一步', note: 'Tauri、FastAPI、sidecar、更新链与 Windows 发布后的缝' },
  { id: 'arcvellum-longform-debugging', no: '06', group: 'PRODUCT', label: 'LONGFORM', title: '六个场景、几十次失败', note: '一条三万字正式闭环的调试日记' },
  { id: 'arcvellum-modularization', no: '07', group: 'RUNTIME & DELIVERY', label: 'MODULES', title: '功能完成之后，代码为什么还要继续拆', note: '模块图、composition root、facade 与只进不退的债务基线' },
  { id: 'arcvellum-beta-ledger', no: '08', group: 'PRODUCT', label: 'EVIDENCE', title: 'Beta 不等于免责声明', note: '已验证、未验证、已知债务与下一次发布门禁' },
  { id: 'arcvellum-module-atlas', no: '09', group: 'MODULE ATLAS', label: 'ATLAS', title: '把一百多份开发记录整理成文章地图', note: '模块所有权、五层内容谱系与后续文章清单' },
  { id: 'arcvellum-narrative-projection', no: '10', group: 'SPATIAL FRONTEND', label: 'PROJECTION', title: '星仪看到的不是数据库，而是一份只读宇宙', note: 'Projection v4、语义焦点、空间语法与动作端口' },
  { id: 'arcvellum-context-prompt', no: '11', group: 'LITERARY KERNEL', label: 'CONTEXT', title: 'Agent 写之前，系统怎样证明它读过', note: 'Context Trace、Prompt Registry 与任务包来源证明' },
  { id: 'arcvellum-workflow-review', no: '12', group: 'LITERARY KERNEL', label: 'WORKFLOW', title: '文件已经生成，为什么流程仍然不算完成', note: '状态机、任务账本、Review CI 与晋升门禁' },
] as const;

export const arcDocGroups = ['PRODUCT', 'LITERARY KERNEL', 'SPATIAL FRONTEND', 'RUNTIME & DELIVERY', 'MODULE ATLAS'] as const;
