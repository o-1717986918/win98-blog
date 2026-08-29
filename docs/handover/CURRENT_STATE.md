# 接手现状

审查日期：2026-08-29

## 结论

项目已经从单文件原型落实为功能完整、可部署的 Astro 7 静态个人博客，公开身份为“某人的小站”。`src/` 是正式实现；旧单文件重设计与 Celestial Matrix 均已隔离为实验。原项目的“文章主体、加法外壳、静态优先、主题数据化、内容共置”结论均有源码、产物和真实浏览器级验证。

## 已实现

| 能力 | 实现证据 |
|---|---|
| 真实内容与路由 | `src/content/`、`src/integrations/content-routes.mjs`、`src/routes/` |
| 文章三档外壳 | full 标准长文、minimal 阅读页、none 粒子场 |
| 主题功能 | 内部保留稳定的 `columns` 集合与 `/columns/` URL；公开语义为主题，现有工程、博客开发、工具、学术、ArcVellum 与实验均为真实主题 |
| 主题网页级自由 | `src/content/columns/lab/LabColumn.astro` 完整控制主题页面 |
| 内容封面 | 真实项目界面/计算结果优先，抽象设计文章使用独立原创视觉，确定性 SVG 校样图仅兜底；首页、列表、主题、相关文章和标准正文共享 16:9 完整画幅契约；开发态遇到未解析的图片字符串时降级而不崩溃 |
| 首页信息架构 | 主题占左侧主窗口并独立纵向滚动；继续阅读占右侧且严格三篇；下方另设可发布状态、学习笔记与内容信号模块，不靠链接堆叠制造信息量 |
| 站点结构 | 首页、归档、关于、404、RSS、sitemap、规范 URL |
| 内容运营 | Git-first 脚手架、草稿/定时发布、审计、共置图片与更新元数据 |
| 内容发现 | 顶栏单一输入框的 Pagefind 正文搜索，默认只返回文章并排除页面外壳；归档内文本/主题筛选；主题、标签深链与相关文章 |
| 配色与背景 | V4“光谱批注场”收束为 mist/abyss 双主题；钴蓝/柿红/鸢紫/赭金继续按语义分工，主题保存稳定 accent，文章继承首个主题；PixiJS 只绘制页边短划、方点和折角批注 |
| 网站开屏 | 首页约 3.8 秒的会话级粒子字体开场，可跳过、可强制预览、隔离底层焦点与辅助技术树，并响应系统减弱动态偏好 |
| 品牌标识 | 用户提供的原始图片统一用于导航、开屏、favicon 与 web manifest；标识图不驱动主题配色 |
| 阅读体验 | 目录、上下篇、进度、分享、字号、三档行距、逐路径续读、沉浸偏好、移动导航 |
| SEO 与分发 | 构建期主题化 OG PNG、Twitter Card、BlogPosting JSON-LD、RSS、robots、manifest、`llms.txt` |
| 可选服务 | 默认零请求的 Giscus/Waline 与 Cloudflare/Umami 适配器；Waline 使用无同源权限 iframe 和 HTTPS URL 校验 |
| ArcVellum 展示 | 模拟内容接入实际 Pixi/WebGL + 2.5D 技术路线：章节星核、黄金角场景簇、六种空间语法、四元数无界轨道、深度缩放、DOM 标签与同图语义焦点；侧栏按五层组织十二篇工程文章 |
| 浏览器求解器 | 真实 C99 内核编译为 177 KiB 级 Wasm，在 Worker 中执行识别与完整规划；带 60 秒中断、可编辑地图、完整轨迹/推箱/推弹爆破回放和快慢两级冒烟测试 |
| 学习笔记 | 独立 `notes` 集合与公开只读页面；本机同步器支持显式发布、Wiki 链接、附件与清单，不再伪装成主题 |
| Blog Studio | 回环地址上的本地可视化维护台，可浏览、创建和编辑文章/主题/笔记，预览 Markdown，运行白名单质量命令与笔记同步 |
| 架构守护 | Vitest、Playwright、类型/内容/封面审计、产物隔离、内部链接、体积预算与 CI |

## 关键实现决定

Astro 对同一路由中静态导入的所有布局会聚合样式。为真正满足 `none` 的零全站注入，项目没有使用一个运行时联合组件，而由集成在构建开始前读取每个 `index.mdx` 的 `chrome`，把确切 URL 分派到六个互相隔离的入口。新增内容不需要修改分派器；构建时仍会验证 frontmatter 与入口一致。

## 当前边界

- `SITE_URL` 未配置时 canonical 使用 `https://example.com`，上线前必须设置真实域名并运行 `pnpm deploy:check`；
- 评论和统计代码已具备但默认关闭，真实启用仍需要站主的 provider 账号与公开配置；
- ArcVellum Demo 使用模拟作品数据但运行真实技术路线；它是架构解释器，不是完整 ArcVellum 客户端，文章清单中的未来稿也未冒充已发布；
- Blog Studio 是本机单用户工具，没有远程协作、账号系统或双向 Obsidian 合并；笔记同步以显式发布和本地源为准；
- 公网域名、DNS 与托管账号属于站主外部状态；Direct Upload workflow、本机命令、域名顺序和回滚步骤见 `docs/operations/DEPLOYMENT.md`，发布验收见 `docs/operations/PRODUCTION_CHECKLIST.md`。

冻结源资产和哈希见 `MIGRATION_MANIFEST.md`。

## 当前视觉与功能方向

`UI_REDESIGN_V4.md`、`BLOG_SYSTEM_REDESIGN_AND_STUDIO_PLAN.md`、ADR-0009 与 ADR-0011 是当前 UI 决策。桌面内容宽度扩大到 96rem；首页重点文章为左文右图并保留局部指针动态；主题主窗口左大且独立滚动，“继续阅读”右小并严格三篇；学习笔记是错落排版中的大型功能入口。旧“站内工作台”和阅读编排器均已删除。页面不按列表位置轮换颜色，色彩归属主题内容数据；实际页面主题只有 mist 与 abyss。搜索收纳为顶栏单一输入框，可由 `/` 或 `Ctrl/⌘ K` 聚焦，结果默认只返回文章正文。

背景、开屏、性能降级与 Wallpaper Engine 兼容边界见 `AMBIENT_ENGINE.md`。
