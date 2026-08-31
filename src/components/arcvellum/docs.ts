export const arcDocs = [
  { id: 'arcvellum-release', no: '01', group: '系统总览', label: 'SYSTEM', title: 'ArcVellum 如何把长篇写作变成可持续求解的问题', note: '目标函数、项目状态、权力边界与完整技术拓扑' },
  { id: 'arcvellum-module-atlas', no: '02', group: '系统总览', label: 'PROJECT MODEL', title: '一部作品在系统里由哪些事实构成', note: 'Canon、人物、场景、账本、候选、正文与交付物的数据边界' },
  { id: 'arcvellum-beta-ledger', no: '03', group: '文学求解内核', label: 'LONGFORM PLAN', title: '五十万字如何被拆成可兑现的剧情库存', note: '字数预算、事件密度、章节义务、节奏曲线与滚动规划' },
  { id: 'arcvellum-longform-debugging', no: '04', group: '文学求解内核', label: 'SCENE SOLVER', title: '一个场景如何从问题状态求解成正式正文', note: '上下文、角色推演、分支、编剧态、正文与状态演化闭环' },
  { id: 'arcvellum-context-prompt', no: '05', group: '文学求解内核', label: 'CONTEXT', title: '模型下笔前如何获得恰好够用的作品事实', note: 'Context Trace、Prompt v3、证据分层、按需读取与预算控制' },
  { id: 'arcvellum-policy-kernel', no: '06', group: '文学求解内核', label: 'POLICY KERNEL', title: '候选怎样获得成为作品事实的资格', note: 'CLI 状态机、任务账本、内容身份、Canon 与唯一权威' },
  { id: 'arcvellum-workflow-review', no: '07', group: '文学求解内核', label: 'REVIEW CI', title: '文学审查如何成为可执行的质量闭环', note: '语义审查、确定性 Lint、修订、复核、晋升与写回' },
  { id: 'arcvellum-style-system', no: '08', group: '文学求解内核', label: 'STYLE', title: '文风怎样从语料证据编译成生成约束', note: '来源登记、风格抽象、隔离评测、版本化挂载与生成优先级' },
  { id: 'arcvellum-agent-runtime', no: '09', group: 'Agent 执行层', label: 'PI WORKER', title: 'Pi Worker 如何在受控边界内完成文学任务', note: 'TaskPackage、双工作区、白名单工具、预检、修复与成本边界' },
  { id: 'arcvellum-narrative-projection', no: '10', group: '空间读模型', label: 'PROJECTION', title: '复杂作品怎样被投影成稳定的叙事宇宙', note: '只读 Projection、稳定身份、关系语义、增量更新与空间坐标' },
  { id: 'arcvellum-orrery-frontend', no: '11', group: '空间读模型', label: 'ORRERY', title: '叙事星仪如何把结构、节奏与任务变成交互场', note: '2.5D 摄像机、布局语法、语义缩放、窗口系统与动作端口' },
  { id: 'arcvellum-engineering-delivery', no: '12', group: '产品工作面', label: 'STUDIO', title: '从作品档案到干净交付的产品工作面', note: '阅读器、档案 IDE、顾问、模型配置、DOCX 与桌面安装包' },
  { id: 'arcvellum-modularization', no: '13', group: '工程与验证', label: 'MODULES', title: '大型文学系统怎样保持模块边界清晰', note: 'Engine/Studio/Runtime/Client 分层、端口适配器与架构棘轮' },
  { id: 'arcvellum-verification', no: '14', group: '工程与验证', label: 'EVIDENCE', title: '怎样证明一次创作闭环真的成立', note: '单元、合同、连续端到端、Prompt A/B、安装包与诚实边界' },
] as const;

export const arcDocGroups = ['系统总览', '文学求解内核', 'Agent 执行层', '空间读模型', '产品工作面', '工程与验证'] as const;
