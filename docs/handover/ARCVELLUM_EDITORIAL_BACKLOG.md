# ArcVellum 技术文章分层清单

更新时间：2026-08-29  
依据：ArcVellum 本地工程 README、架构 ADR、模块目录、边界文档、12 份 Engine 模块说明、94 份阶段实现记录、发布/验证日志、空间星仪路线与前端源码。  
原则：一个模块可以形成一篇文章；“已有文档”不等于“博客文章已完成”，必须重新组织真实开发问题、证据和边界。

## 已发布的总览与开发叙事

| 层级 | 文章 | 状态 | 主要证据 |
|---|---|---|---|
| 产品 | 三万字闭环之后，我才敢把它叫作产品 | 已发布 | README、v0.99.0/0.99.1、E2E 记录 |
| 空间前端 | 星仪不是一次设计成的 | 已发布并扩充 | 活字天穹评审、W1 星仪审计、100/300/1000 场景验收 |
| 文学内核 | 我为什么不断把权力从 Agent 手里拿回来 | 已发布 | Workflow State、候选/晋升、Gate |
| Runtime | 一次昂贵任务怎样被反复救回来 | 已发布 | Runner、双工作区、租约、恢复 |
| 交付 | 安装包不是最后一步 | 已发布 | Tauri、FastAPI、sidecar、Updater |
| 长篇 | 六个场景、几十次失败 | 已发布 | 30,080 字正式闭环执行记录 |
| 工程 | 功能完成之后，代码为什么还要继续拆 | 已发布 | module catalog、architecture ratchet |
| 证据 | Beta 不等于免责声明 | 已发布 | 发布验证、已知债务 |
| 导航 | 把一百多份开发记录整理成文章地图 | 本轮新增 | 本清单、模块目录、路线图 |
| 空间前端 | 星仪看到的不是数据库，而是一份只读宇宙 | 本轮新增 | ADR-002、Projection v3/v4、Orrery feature |
| 文学内核 | Agent 写之前，系统怎样证明它读过 | 本轮新增 | Context Broker、Prompt Registry |
| 文学内核 | 文件已经生成，为什么流程仍然不算完成 | 本轮新增 | Workflow State Machine、Review CI |

## A. 产品与使用层

| 优先级 | 候选文章 | 核心问题 | 主要来源 | 状态 |
|---|---|---|---|---|
| P1 | 从空目录到第一段正式正文 | 普通用户真正经历哪些动作，哪些只属于维护者 | README、MVP、onboarding、E2E | 待写 |
| P1 | 正文阅读器为什么只读已晋升内容 | 候选、审查痕迹与正式正文如何分离 | reader manifest、Reader 组件、release docs | 待写 |
| P1 | 全自动不是“不要人” | full_auto 如何保留阻断、审查与人工决定 | Autopilot、workflow contracts、v0.99 E2E | 待写 |
| P2 | 项目顾问能做什么、不能做什么 | 对话、建议、工具调用与正式写回的边界 | advisor docs、application ports | 待写 |
| P2 | Beta 版本的兼容承诺 | 哪些格式、版本、Provider 与桌面路径已验证 | release verification、compatibility manifest | 待写 |

## B. 文学内核层

| 优先级 | 候选文章 | 模块 | 主要来源 | 状态 |
|---|---|---|---|---|
| P1 | Canon 不是“背景设定文件夹” | Canon / Candidate Promotion | canon schemas、route gates | 待写 |
| P1 | 人物为什么要有状态补丁 | Character Engine | `character-engine.md`、state patch schemas | 待写 |
| P1 | 一场戏从目标走到状态变化 | Plot & Scene Engine | `plot-scene-engine.md`、scene contracts | 待写 |
| P1 | 写十万字之前先证明库存够用 | Longform Word Budget | `longform-word-budget.md`、phase 65+ | 待写 |
| P1 | 读者问题也需要合同 | Reader Experience Contract | `reader-experience-contract.md`、chapter obligations | 待写 |
| P1 | 文风不是提示词的一段形容词 | Style Compiler / Style Skill | `style-compiler.md`、phase 58-80 | 待写 |
| P2 | 新角色为何不能在正文里凭空转正 | New Character Register | `new-character-register.md` | 待写 |
| P2 | 从旧稿反推项目文件 | Source Ingest Engine | `source-ingest-engine.md`、phase 64 | 待写 |
| P2 | 中文字符口径怎样改变长篇验收 | Counting Policy | workflow state / body stats / phase 67-89 | 待写 |

## C. Agent 与正式工作流层

| 优先级 | 候选文章 | 模块 | 主要来源 | 状态 |
|---|---|---|---|---|
| P1 | CLI 中介为什么不是“把 Agent 变笨” | CLI-mediated workflow | `cli-mediated-agent-workflow.md` | 待写 |
| P1 | Task Package 怎样限制一次创作任务 | Tasking | task schemas、artifact contracts | 待写 |
| P1 | Prompt Registry 如何让要求可版本化 | Prompt Registry | `prompt-registry.md`、57 assets / 72 ids | 已合入文 11，可独立扩写 |
| P1 | Context Trace 如何证明 Agent 读过 | Context Broker | `context-broker.md`、trace schema | 已合入文 11，可独立扩写 |
| P1 | `pass_with_notes` 为什么不是通过 | Review CI | `review-ci.md`、review schemas | 已合入文 12，可独立扩写 |
| P1 | 一项任务如何从 issued 到 completed | Workflow State Machine | `workflow-state-machine.md`、event ledger | 已合入文 12，可独立扩写 |
| P2 | Provider、Runner 与文学内核如何解耦 | Provider / Runtime Ports | runtime ports、provider gateway | 待写 |
| P2 | Agent JSON 失败后的修复循环 | Agent output repair | schemas、phase 28、tests | 待写 |
| P2 | 多 Agent 审稿委员会有没有制造假共识 | Committee Review | phase 33、review contracts | 待写 |
| P2 | 平台 Agent 与旧 Director Chat 的权力交接 | Project-type Skill architecture | ADR、project-type-skill.md | 待写 |

## D. 叙事投影与空间前端层

| 优先级 | 候选文章 | 模块 | 主要来源 | 状态 |
|---|---|---|---|---|
| P1 | Narrative Projection v4 的只读宇宙 | Projection | ADR-002、projection v2/v3/v4 | 本轮新增文 10 |
| P1 | 六种空间语法如何共享同一身份 | Layout Engine | grammar/curve/layout engine + tests | 待写 |
| P1 | 章节为什么是星核，场景为什么成簇 | Constellation Layout | curve profiles、golden-angle route | 待写 |
| P1 | 主脉 / 全部：信息完整不等于视觉全显 | Signal Hierarchy | v0.99 signal hierarchy review | 待写 |
| P1 | 2.5D 星仪如何避免第二套产品状态 | Orrery Workbench | feature client、store、composition registry | 待写 |
| P1 | 关系线如何退居叙事主脉之后 | Relation Renderer | relation families、spine layer | 待写 |
| P1 | 从星仪节点跳到正文，再从正文返回 | Reader Navigation | W1 navigation/reader link reviews | 待写 |
| P2 | 浮动仪器窗为何不是绝对定位拼盘 | Spatial Windows | window layer、dock/restore contracts | 待写 |
| P2 | 活字天穹的取舍 | Visual Language | typographic celestial field review | 已部分覆盖文 02 |
| P2 | 1000 场景为什么首帧仍慢 | Performance | scale tests、v0.99 modular audit | 待写 |
| P2 | 星仪的无障碍列表不是降级版 | Accessible View | StoryTrace / accessible contracts | 待写 |
| P2 | Patch、revision 与 SSE 怎样避免整图重排 | Projection Transport | revision、patches、stream tests | 待写 |

## E. 工程、持久化与交付层

| 优先级 | 候选文章 | 模块 | 主要来源 | 状态 |
|---|---|---|---|---|
| P1 | 一个需求应该从哪个模块入口开始 | Module Catalog | module catalog / interface standard | 已部分覆盖文 07、09 |
| P1 | 唯一组合根如何阻止 service locator 复生 | Composition | application container、infrastructure composition | 待写 |
| P1 | Engine 为什么不能反向依赖 Studio | Dependency Direction | module boundaries、architecture audit | 待写 |
| P1 | 事件、SQLite 与缓存为什么都先有 Port | Persistence | application ports / adapters | 待写 |
| P1 | HTTP/SSE Router 为什么只能做适配 | API | routers、read models、services | 待写 |
| P1 | Tauri、Python sidecar 与签名更新链 | Desktop Delivery | desktop/release/updater docs | 已部分覆盖文 05 |
| P2 | 架构棘轮怎样允许历史债务只减不增 | Architecture Audit | generated map、baseline、v0.99 audit | 待写 |
| P2 | 接口合同变化为何要拆成三次迁移 | Contract Migration | module catalog / change packet | 待写 |
| P2 | Windows 路径、隐藏子进程与普通用户权限 | Desktop Reliability | release verification | 待写 |
| P2 | 从一千多项 Python 测试到视觉像素门禁 | Verification | E2E log、Playwright、release verification | 待写 |

## 编写规则

1. 每篇文章先写实际出现过的问题，再写模块设计；禁止把目录树改写成营销介绍。
2. 所有数字注明对应版本和来源；不能把一次成功闭环外推为任意题材证明。
3. 真实截图优先，图注说明版本、页面和证据含义；演示数据必须明确标识。
4. 文章至少包含：模块边界、输入/输出、失败模式、关键取舍、验证证据、仍存债务。
5. 改 DTO、TaskPackage、Projection 或 public API 的文章必须同时写迁移与回滚单位。
6. 清单中的“待写”不能出现在正式文章导航中；只有形成可读正文并通过内容审计后才加入 `arcDocs`。

