# ADR-0013：以证据、关系图和开放网络语义完成内容闭环

- 状态：Accepted
- 日期：2026-08-30

## 背景

站点的外壳、封面与构建门禁已经成熟，但内容证据、公开笔记关系和跨平台身份仍主要依赖正文约定。视觉完成度高于内容模型会让“看起来可靠”先于“可以复查”。同时，真实用户性能与 Webmention 都依赖外部接收端点，不能为了功能列表破坏静态核心或默认隐私边界。

## 决策

1. 文章增加 `format`、可选 `shortTitle`、结构化 `evidence` 与 `syndication`。精选文章至少有一条证据；essay 发布前至少 1200 个非空白字符；none 页面自行决定证据账本放置位置。
2. Notes 增加 `maturity` 与显式 `relations`。构建期把显式关系、Wiki 链接和站内 Markdown 链接合并成去重图，校验悬空目标，并为索引和独立笔记页提供正向/反向邻接。
3. full/minimal 文章输出 h-entry，关于页输出 h-card；`syndication` 渲染为 POSSE `u-syndication`。Webmention 仅在 HTTPS 端点被明确配置时写入 head。
4. full/minimal 页面使用浏览器原生 PerformanceObserver 记录 LCP、CLS 与最长交互延迟样本。未配置 HTTPS 接收端点时只写入 `sessionStorage`，不产生网络请求；none 继续零注入。
5. 站点身份自托管 8 KiB Noto Sans SC 子集，只包含站名、英文大写和数字；正文与任意标题继续使用系统字体，避免完整 CJK 字体成本。
6. 现有原生跨文档 View Transition 保持 full/minimal opt-in，不引入 Client Router，不进入 none。

## 后果

- 内容审计从“字段合法”扩展到“长标题可编辑、精选有证据、长文有最低正文体量、笔记关系不悬空”。
- 笔记关系成为确定构建数据，不再由页面用正文字符串猜测。
- Webmention 接收、真实性能聚合与 POSSE 分发仍需站主提供外部账号或端点；仓库只提供语义、适配器、隐私说明与部署检查。
- 字体身份更稳定，但不会强行统一所有中文正文外观；这一取舍优先保证性能与未来内容覆盖。
