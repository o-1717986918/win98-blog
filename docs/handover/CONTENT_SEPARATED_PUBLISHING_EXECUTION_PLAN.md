# 程序镜像与内容分离：轻量实施计划

> 状态：备选方案，尚未实施。2026-09-19 保留为“独立内容仓库 + 服务器 builder”路线快照；不作为当前默认施工主线。
> 目标：普通文章和公开学习笔记可以只更新内容，不重建 GHCR 程序镜像；保留 Astro 静态站、现有视觉、主题与可信特殊页面，以及简单回滚。
> 决策记录：docs/decisions/0020-content-separated-static-publishing.md。

本文件保留原 P0–P4 实施细节，供以后确需“服务器主动拉取并构建”时选用。当前主线已经选择 ADR-0021 和 `STATIC_ARTIFACT_PUBLISHING_EXECUTION_PLAN.md`：Actions 构建完整 `dist`，服务器只验收并切换。不得把本备选描述为已上线能力。

## 1. 先定复杂度预算

本站目前是单作者、几十篇内容的静态个人门户。实施不能为了未来可能出现的多人协作，把一次内容发布变成一套自建平台。

首期只新增三个运行要素：

1. 一个独立的公开内容 Git 仓库，首期只保存普通文章、公开学习笔记及其媒体；
2. 一个固定 digest 的 builder 镜像，含 Astro 程序、依赖和可信特殊页面；
3. 一条由站主手动运行的发布命令：固定内容 commit → 临时构建 → 检查 → 切换静态目录。

运行中的 Web 仍是非 root、只读 Nginx。宝塔只负责 HTTPS 和反向代理。每次内容更新仍需完整 Astro build 和 Pagefind；“不重建镜像”不等于“无需构建网页”。当前整站 GHCR 镜像保留为救援路径。

首期明确不做：常驻 publisher/content-sync 服务、任务队列、任务状态数据库、Webhook、公网管理后台、Docker Socket API、Payload、通用插件系统、自动清理器、专用监控系统、通用 Content Source Adapter 框架。只有实际需求或测量结果证明必要，才另立小任务增加。

核心安全约束仍保留：内容不能覆盖程序文件或执行任意 MDX/Astro/JS；Web 容器不持有 Git 凭据、Node、Docker Socket 或写权限；失败构建不得改变正在服务的版本。

## 2. 当前事实与笔记范围

### 2.1 当前代码

- src/content.config.ts 的 posts、columns、notes 均在构建期加载；普通文章和主题由 src/integrations/content-routes.mjs 分派到六个 chrome 入口。
- 学习笔记是独立 notes 集合，不是 posts 的一种。src/pages/notes/[...slug].astro 仅为 publish: true 且非 draft 的笔记生成 URL；笔记首页、首页卡片和关系图也只读取这些公开笔记。
- 公开笔记进入 sitemap 和 Pagefind 正文搜索；src/pages/rss.xml.ts 目前只收录 posts。内容发布能力应覆盖 notes，但不擅自把笔记加入文章 RSS。
- tools/blog-studio/sync-notes.mjs 已支持 --output、附件复制和 Wiki 链接转换，但默认输出仍是程序仓库的 src/content/notes；它目前把 publish: false 的笔记也写入输出目录。
- scripts/check-content.mjs 已校验笔记元数据、公开关系和 Wiki 链接；src/lib/note-graph.ts 在构建时生成双向关系。

所以，旧计划虽然把“公开笔记”写进 managed 内容，**实际独立发布链路尚未接好**。本计划将公开学习笔记与普通文章一起列为首期完成条件，而不是以后再补。

### 2.2 内容边界

| 类别 | 内容仓库可直接发布 | 程序发布 |
| --- | --- | --- |
| 普通文章 | Markdown、frontmatter、受控图片/附件 | 新组件、MDX import、脚本 |
| 主题 | 首期不迁移，避免改变现有新增主题与共置组件契约 | 仍按现有 index.mdx/程序发布；以后有明确需求再评估纯数据主题 |
| 公开学习笔记 | Markdown、附件、aliases/tags/maturity/relations、Wiki 链接 | 笔记页面布局、关系图算法 |
| 特殊文章/主题 | 仅未来已注册模板的声明式数据包 | 粒子场、求解器、ArcVellum 等行为代码 |

一个 collection + slug 只能有一个事实源。初期可信 MDX 与共置代码继续留在程序镜像；不要为了目录统一而迁移它们。Markdown 扩展名也不是安全证明：内容检查要拒绝可执行原始 HTML、危险 URL 协议和越界文件。

## 3. 最小运行架构

~~~text
程序代码改动 → 程序 CI → builder 镜像 digest

普通文章/公开笔记改动 → 内容 Git commit
  → 站主运行一次发布命令
  → 在固定 builder 容器中装配并构建完整静态站
  → 现有内容/链接/产物检查 + Pagefind
  → 新 release 验证成功后原子切换 current
  → Nginx 继续只读提供页面
~~~

服务器上只需要一个专用根目录，例如：

~~~text
/opt/win98-publisher/
├── content/             # 内容仓库，只由宿主机运维命令拉取
├── releases/
│   ├── current -> 2026.../
│   ├── previous -> 2026.../
│   └── 2026.../
│       ├── site/
│       └── release.json
├── work/                # 本次构建暂存；不对外服务
├── logs/                # 每次发布的一份文本日志
└── publish.lock         # flock 单发布锁
~~~

发布命令固定允许的内容 remote、builder image digest、工作目录和输出目录；只接受完整 commit SHA。Git 只运行在宿主机的运维上下文，builder 只读已固定的内容快照且没有 Git 凭据，Web 只读挂载整个 releases 根目录。生产目录和清理目标必须经绝对路径校验，不对宽泛目录递归删除。

首期保留 current、previous 和至少一个额外成功版本；清理由站主明确指定旧 release 手工执行，不先开发自动清理和 pin 系统。release.json 仅记录 builder digest、content commit、SITE_URL、构建时间与通过的检查；日志按 release 命名。不建任务数据库和逐状态审计事件。

旧 HTML 可能在切换后继续请求旧的哈希资源；切换前须保留上一版仍引用的 /_astro/ 资产，或经测试采用同等简单的共享静态资产目录。HTML 不长期缓存，Pagefind 使用短缓存。Nginx 挂载整个 releases 根，而不是只挂载启动时解析的 current 目标。

## 4. 实施模块：只保留真正需要的边界

### A. 内容装配与检查

在现有 src/content.config.ts、scripts/check-content.mjs 和构建检查上补缺口，不创建新 workspace package 或第二套 Schema。

- 从固定内容 commit 读取 posts、notes；与 builder 内原有 columns 和可信内容装配到临时 src/content 中；
- 拒绝绝对路径、..、软链接、执行文件、同 slug 冲突和对程序目录的覆盖；
- 只迁移没有 import/共置脚本的 managed Markdown；trusted 内容由镜像提供；
- 复用 Astro Schema、现有链接/封面/产物检查；新增少量针对内容仓库边界的测试；
- 笔记必须是公开投影：内容仓库中的 notes 只允许 publish: true、draft: false，不接收私人或草稿 Vault 条目。

### B. Builder 镜像

在现有 Dockerfile 增加一个 builder target，固定依赖，包含现有可信 MDX、组件、字体和构建工具。代码变化时按现有 CI 构建并发布；纯内容变化时只复用 digest。无需单独的 publisher 镜像。临时容器无公网入口、不带 deploy key，限制构建资源，输出只写 work 目录。

### C. 单次发布与回滚命令

先实现一个宿主机运维脚本，而不是可远程调用的发布服务。脚本负责获取 flock、固定 commit、启动 builder、运行构建检查、写 release.json、同文件系统原子替换 current、记录日志。失败直接退出且 current 不变。回滚脚本只选择已验收的历史 release 并切换指针，不重新构建。

输入固定为 commit SHA 与预先配置的 builder digest；不接受任意镜像、宿主机路径或 shell 参数。发布命令同步完成即可，单作者不需要排队、任务 ID、取消和幂等状态机。

### D. 本地编辑桥接

Blog Studio 首期继续只在本机运行，逐步改为编辑内容仓库 worktree。写作、预览、diff、commit/push 可以分步完成；不要求一次完成“前端在线发布”。服务器只从指定内容 commit 发布。

学习笔记的本地 Vault 仍是私人资料的原始来源。笔记同步改为“只导出公开投影”模式：使用现有 --output 指向内容 worktree 的 notes 目录，只复制 publish: true 且非 draft 的笔记及其被引用附件；未公开内容、正文、文件名和附件均不得进入远端仓库、构建输入或最终 dist。现有本地同步默认行为可保留供兼容，但发布入口必须显式启用公开模式。

同步器只删除自己在 .sync-manifest.json 中登记的旧公开 slug，不触碰人工维护的笔记；撤回公开时移除该投影，构建前检查其他公开笔记的关系和链接是否仍有效。预演报告要列出新增、修改、撤回和附件变化，实际写入前供站主确认。

## 5. 发布流程与验收

### 5.1 日常操作

~~~text
本地编辑普通文章，或从 Vault 导出公开笔记
→ 内容检查与本地预览
→ 查看 Git diff，commit/push
→ 服务器发布固定 commit
→ Astro 完整构建 + Pagefind + 已有检查
→ 对新/改 URL 冒烟
→ 切换 current
~~~

笔记仅编辑或新增时也走同一条链，不重建 GHCR 镜像。因为首页、笔记目录、关系图、Pagefind 和 sitemap 都在构建期产生，不能只复制一份 notes HTML。程序本身变更时仍走完整程序测试并更新 builder digest。

### 5.2 必测内容

| 场景 | 必须看到的结果 |
| --- | --- |
| 新增普通文章 | 原 URL、首页/归档/主题/标签、搜索、RSS、sitemap 正确 |
| 修改普通文章 | 正文、updated、封面和搜索一起更新 |
| 新增公开笔记 | /notes/<slug>/、笔记首页、首页卡片、Pagefind、sitemap 正确；RSS 不因它变化而失效 |
| 修改公开笔记 | 正文、更新时间、标签、成熟度、附件、关系图和反向链接一致 |
| 撤回公开笔记 | URL 不再生成；公开索引/搜索/关系均移除；私人数据不泄漏 |
| 无效笔记关系 | 指向私人/不存在的 Wiki 或 relations 时发布失败，旧站保持可用 |
| 构建或冒烟失败 | current 不变，错误日志可读 |
| 回滚 | 不构建即可恢复此前文章、笔记、索引与静态资产 |
| chrome 隔离 | full/minimal/none 文章和主题代表页仍符合现有产物契约 |

首期每次内容发布运行现有 Astro build、Pagefind、内容/链接/构建产物检查；程序级求解器全量测试和浏览器全量回归留在 builder 镜像 CI。上线试点及改变特殊页面时再跑对应 Playwright/视觉检查。不要为每次改一个字重复整套程序 CI。

### 5.3 公开笔记隐私门禁

至少测试：publish:false、draft:true、私人 Wiki 目标、附件引用、撤回后遗留文件、重复 slug，以及内容仓库和 dist 不包含本机 Vault 绝对路径或私人正文。不能只靠页面不生成 URL 来判断“未泄漏”：私人文件若进入 Git、builder 或静态资源同样算失败。

## 6. 交付批次

### P0：基线与分类

- 测量现有完整构建时间、磁盘和内存；列出 managed/trusted 的文章与主题；
- 记录当前三篇公开笔记、URL、附件、关系、Pagefind 与 sitemap 基线；
- 确认服务器资源、内容仓库归属、发布目录和只读密钥；
- 不改变生产行为。

完成：有可复测基线和一份明确的内容迁移清单。

### P1：本地内容事实源，文章与笔记同批打通

- 创建一个内容仓库，迁移一篇纯 Markdown 文章和一篇公开笔记；主题首期保持程序仓库事实源；
- 实现最小装配检查；修正笔记同步的公开投影、输出目录和安全撤回；
- 从同一代码版本分别用旧目录和新内容装配构建，对比 URL、HTML、首页、笔记关系、搜索、RSS 与 sitemap；
- 不删除程序仓库原件，直到同 slug 单一事实源切换能通过测试。

完成：只改文章或公开笔记均可在本地生成正确完整静态站；私有笔记未进入内容仓库或 dist。

### P2：一次性服务器发布与回滚

- 增加 builder target、一个发布脚本、一个回滚脚本；
- 用备用回环端口运行从 releases/current 读取的非 root Nginx；
- 测试构建失败、错误 commit、锁冲突、切换后旧资产、回滚与旧 GHCR 整站镜像救援；
- 只在备用环境验证，不改宝塔公开反代。

完成：内容改动不构建 GHCR 程序镜像；失败不影响当前版本；回滚无需构建。

### P3：生产切换与编辑收束

- 在维护窗口切换宝塔到新 Web；分别发布一篇文章改动和一篇笔记改动/新增；
- 再演练一次公开笔记撤回或回滚，确认首页、笔记关系、Pagefind、sitemap、RSS、404 和缓存；
- Blog Studio 指向内容 worktree，更新内容工作流、部署与回滚手册和 CURRENT_STATE。

完成：文章和公开学习笔记均能独立于程序镜像便捷发布；两种内容的真实生产证据齐全；旧整站镜像仍可救援。

### P4：可选的模板页面包

只在 P3 稳定后做一个特殊页面试点。首版页面包是 manifest.json、body.md、JSON 数据和受控媒体；ZIP 只用于本地导入，解包后以可 diff 的文件保存到内容仓库。程序侧用一个小型静态允许列表选择已存在的 renderer，不先做通用插件框架、远程上传后台或包市场。

页面包只能修改文案、章节、媒体和受 Schema 限制的参数；新增 Astro/JS/Wasm 或新交互仍走程序发布。导入时拒绝越界归档、软链接、压缩炸弹、危险 Markdown、未知 renderer、未知参数和同 slug 覆盖。装配到原 posts/columns 身份，保持 URL、chrome、搜索、RSS（文章）与 sitemap。只有第二个真实 renderer 出现后，才评估独立注册表模块。

完成：试点特殊页面只改包数据即可发布和回滚，且 none 页面不吸入站点外壳。P4 不阻塞 P0–P3 对普通内容的完成定义。

## 7. 何时再增加工程化

| 观察到的问题 | 再考虑的能力 |
| --- | --- |
| 多人同时发布或经常撞锁 | 队列、任务状态与审计事件 |
| 真正需要浏览器远程编辑 | 后台身份、权限、上传 API；再评估 CMS |
| 手动触发经常遗漏 | 验签 Webhook |
| release 数量和磁盘超出手工管理 | 自动清理与额外备份策略 |
| 内容来源不再只有 Git | Content Source Adapter |
| 出现多个可复用特殊模板 | 独立 renderer registry |
| 全量静态构建实测不可接受 | 增量构建或数据库 CMS 的成本评估 |

任何扩展仍须保留受控内容/可信代码边界与可回退的静态站。没有实测阻塞时，不按日历时间增加上述系统。

## 8. 预计文件与文档

首期预计涉及 Dockerfile、compose.yaml、docker/nginx.conf、一个内容装配脚本、一个发布脚本、一个回滚脚本、tools/blog-studio/sync-notes.mjs 和少量现有测试。仅当实现确实需要时改 src/content.config.ts 或路由入口；改动须同步 ADR 和架构测试。P4 再增加页面包导入与受控 renderer 代码。

对应运维文档是 docs/operations/CONTENT_WORKFLOW.md、DEPLOYMENT.md、OPERATIONS.md、PRODUCTION_CHECKLIST.md。docs/handover/CURRENT_STATE.md 只在真实生产演练完成后标记“已交付”，不得把本计划当成已上线事实。

## 9. 参考

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro Content Loader API](https://docs.astro.build/en/reference/content-loader-reference/)
- [Astro MDX：导入与表达式能力](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- [MDN 同源策略](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)
