export const arcDocs = [
  { id: 'arcvellum-release', group: '系统总览', label: 'SYSTEM', note: '目标函数、项目状态、权力边界与完整技术拓扑' },
  { id: 'arcvellum-module-atlas', group: '系统总览', label: 'PROJECT MODEL', note: 'Canon、人物、场景、账本、候选、正文与交付物的数据边界' },
  { id: 'arcvellum-beta-ledger', group: '文学求解内核', label: 'LONGFORM PLAN', note: '字数预算、事件密度、章节义务、节奏曲线与滚动规划' },
  { id: 'arcvellum-longform-debugging', group: '文学求解内核', label: 'SCENE SOLVER', note: '上下文、角色推演、分支、编剧态、正文与状态演化闭环' },
  { id: 'arcvellum-context-prompt', group: '文学求解内核', label: 'CONTEXT', note: 'Context Trace、Prompt v3、证据分层、按需读取与预算控制' },
  { id: 'arcvellum-policy-kernel', group: '文学求解内核', label: 'POLICY KERNEL', note: 'CLI 状态机、任务账本、内容身份、Canon 与唯一权威' },
  { id: 'arcvellum-workflow-review', group: '文学求解内核', label: 'REVIEW CI', note: '语义审查、确定性 Lint、修订、复核、晋升与写回' },
  { id: 'arcvellum-style-system', group: '文学求解内核', label: 'STYLE', note: '来源登记、风格抽象、隔离评测、版本化挂载与生成优先级' },
  { id: 'arcvellum-agent-runtime', group: 'Agent 执行层', label: 'PI WORKER', note: 'TaskPackage、双工作区、白名单工具、预检、修复与成本边界' },
  { id: 'arcvellum-narrative-projection', group: '空间读模型', label: 'PROJECTION', note: '只读 Projection、稳定身份、关系语义、增量更新与空间坐标' },
  { id: 'arcvellum-orrery-frontend', group: '空间读模型', label: 'ORRERY', note: '2.5D 摄像机、布局语法、语义缩放、窗口系统与动作端口' },
  { id: 'arcvellum-engineering-delivery', group: '产品工作面', label: 'STUDIO', note: '阅读器、档案 IDE、顾问、模型配置、DOCX 与桌面安装包' },
  { id: 'arcvellum-modularization', group: '工程与验证', label: 'MODULES', note: 'Engine/Studio/Runtime/Client 分层、端口适配器与架构棘轮' },
  { id: 'arcvellum-verification', group: '工程与验证', label: 'EVIDENCE', note: '单元、合同、连续端到端、Prompt A/B、安装包与诚实边界' },
] as const;

export const arcDocGroups = ['系统总览', '文学求解内核', 'Agent 执行层', '空间读模型', '产品工作面', '工程与验证'] as const;
