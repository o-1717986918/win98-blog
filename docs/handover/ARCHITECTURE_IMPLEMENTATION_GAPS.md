# 架构文档落实差距审计

审计日期：2026-08-28

审计对象：冻结规划文档 `docs/source/blog-architecture.md` 与当前生产源码。规划文档是历史架构依据，不是修改指令；用户当前要求与已接受 ADR 优先。

## 本地可闭环项：已落实

| 项目 | 当前实现与验证 |
|---|---|
| 主题化动态 OG | `src/pages/og/` 按内容 title/theme/accent 构建 1200×630 PNG；真实 cover 仍可优先进入 Astro 图片管线；产物契约检查文件与 HTML 元数据 |
| 浏览器回归 | Playwright 覆盖 1280×720、390×844、开场焦点隔离、搜索、full/minimal/none、行距续读和减弱动态；CI 安装 Chromium 后执行 |
| Node 脚本类型边界 | `tsconfig.scripts.json` 以 `checkJs` + strict null/catch 检查所有 `.mjs` 构建、维护、路由集成和 frontmatter 脚本，保留原生 Node 直接执行 |
| MDX 内容组件 | `Callout`、`DataChart`、`CodePlayground` 已形成正式组件；数据图附文本表，代码预览使用 sandbox iframe |
| 第三方内容边界 | Waline 强制 HTTPS 并运行在无 `allow-same-origin`、无顶层导航权限的 iframe；默认关闭，不影响 none |
| 页面过渡 | full/minimal 通过 CSS 跨文档 View Transitions 渐变；none 不导入相关样式；减弱动态时关闭动画 |
| 阅读偏好 | 字号、三档行距、沉浸模式与逐路径滚动位置持久化；工具条默认收起，不持续遮挡正文 |
| 真实封面审计 | `pnpm content:covers` 校验真实图片存在性、alt、最小 1200×630 与宽高比，并报告确定性默认封面数量 |
| 主题收束 | 实际视觉系统只有 `mist` 与 `abyss`；旧主题名只作为迁移输入映射，不再生成额外配色 |
| 首页容量 | 重点文章为左文右图并保留低幅指针动态；继续阅读限制三篇；栏目改为固定条目高度的纵向索引抽屉；阅读编排器按兴趣、预算和真实内容元数据生成一至三站路径，不再复列导航入口 |
| 真实求解器内嵌 | 推箱炸障项目的 20 个 C99 源文件通过 Zig/WASI 编译为 WebAssembly；独立 Worker 提供 45 秒中断；冒烟测试核对 33 步识别路径，完整内置地图实测产生 191 步规划路径 |
| 全站返回桥 | 所有非首页的 full/minimal/none 页面均显示返回桥；同源来路优先使用历史回退，直达访问回退到真实首页 href |

## 已落实的架构主干

- Astro 静态构建、严格内容 schema、MDX 与内容共置；
- BaseLayout 加法外壳，文章和栏目均有 full/minimal/none，none 产物隔离由源码、构建与浏览器三层验证；
- 构建期集中路由分派、稳定 URL、RSS、sitemap、SEO、结构化数据与 `llms.txt`；
- Expressive Code、Astro 图片管线、Pagefind 正文搜索；
- 评论与统计可选适配器、隐私页、内容/封面审计、CI、链接与体积预算。

## 仍需外部状态，不能由仓库独立完成

1. **后续内容资产**：当前项目、学术与工具文章优先使用真实界面/计算图，抽象设计文章已配独立原创视觉，并保留生成提示、来源与 alt 台账；新文章仍需要作者确认版权、裁切焦点和 alt。
2. **生产部署执行**：Direct Upload 脚本、固定版 Wrangler、手动 GitHub workflow、环境校验、生产防误触和验收表已经落实；真实 Pages 项目、域名、DNS、API token、GitHub Environment 审批与回滚权限仍需要站主账号。
3. **评论与统计上线**：需要真实 Giscus/Waline、Cloudflare/Umami 配置、数据保留策略，并在生产域名检查网络请求和隐私文本。
4. **生产观察**：Core Web Vitals、真实设备字体回退、分享平台抓图缓存与评论垃圾策略只能在实际流量环境验证。

## 被更好方案替代，不应照搬

- 单个运行时 dispatcher 被构建期六入口分派替代，避免 Astro 聚合布局 CSS 后污染 none；
- `customScript` frontmatter 被 MDX 共置组件与显式 import 替代；
- 独立 `src/themes/` 目录被集中语义 token 与双主题 schema 替代；
- Satori 不是目标本身：当前 Sharp + SVG 模板生成确定性 PNG，减少字体运行时和额外包，同时得到同等静态分享图结果；
- 父页面 DOMPurify 不是唯一安全边界：Waline 被放入唯一来源 sandbox，用户内容无法取得父页面、cookie 或本地存储权限。
