# win98的小站

一个静态优先、允许文章与主题逐级获得网页级自由的个人博客。仓库从 `C:\Users\26532\.zcode\workspace\default` 的原项目接手而来；外部源目录保持不动，原型和初始架构文档作为历史设计基线保留，当前事实以可执行 Schema、源码、测试和已接受 ADR 为准。

线上站点：[o-1717986918.github.io/win98-blog](https://o-1717986918.github.io/win98-blog/)

## 已交付能力

- Astro 7 + TypeScript + MDX Content Collections + 原生 CSS，输出纯静态站点；
- 首页、主题、学习笔记、归档、项目、能力、时间线、中文文章正文搜索、归档内主题筛选、关于、隐私、RSS、sitemap、robots 与 `llms.txt`；
- 可持久化的门户模块/密度偏好、按发表日历筛选的文章流、分段展开，以及只连接真实证据的项目与能力目录；
- 桌面端固定左侧导航轨道与移动端顶部折叠菜单；搜索独立置顶，站点说明进入侧栏，主题/探索在侧栏内部动态展开；首页直接进入个人门户，重点文章在内容末尾作为精选回看；
- 文章和主题各自支持 `full / minimal / none`，两者的档位互不推导；
- 主题是开发者可新增的一等内容集合，可拥有私有 Astro 组件、样式、脚本和媒体；
- 构建期路由分派保证 `none` 产物不包含站点 Header、Footer、阅读控件或全站样式；
- 草稿/定时发布、内容脚手架与审计、相关文章、阅读进度、分享、许可信息与封面图片；
- 内容 ID 与主题 accent 驱动的确定性默认封面；提供真实共置图片时自动进入 Astro 图片优化管线；构建期同时生成主题化 1200×630 PNG 分享图；
- mist/abyss 双主题、Open Graph、Twitter Card、BlogPosting JSON-LD、Expressive Code 与 Astro 图片管线；
- 可暂停的 PixiJS 页边批注粒子、克制的指针扰动、约 3.8 秒的首页会话级粒子开屏，以及按主题数据稳定归属的四种低饱和 accent；品牌图不用于主题取色，标准正文无 JavaScript 也可阅读；
- 评论和统计是默认关闭的可选适配器，不配置时没有第三方请求；
- Callout、可访问数据图与沙箱代码预览组件，行距/续读偏好以及 full/minimal 跨页过渡；
- Vitest + Playwright CI、封面/内部链接检查、静态产物契约、体积预算与部署前检查。

## 快速开始

需要 Node.js 22.12+ 与 pnpm 11.19+。

```powershell
pnpm install
pnpm verify
pnpm verify:all
pnpm dev
```

开发服务器默认打开 `http://localhost:4321/`。生产预览使用 `pnpm preview`。

创建内容：

```powershell
pnpm content:new post my-post "文章标题"
pnpm content:new column my-column "主题标题"
pnpm content:audit
```

`pnpm verify` 运行单元、求解器与完整静态构建门禁；`pnpm verify:all` 在此基础上再运行真实浏览器回归，适合发布前一次性验收。编辑、发布与资源共置见 `docs/operations/CONTENT_WORKFLOW.md`；GitHub Pages 首发、GHCR + 宝塔 Docker 生产路径与 Cloudflare 备选方案见 `docs/operations/DEPLOYMENT.md`，逐项上线验收见 `docs/operations/PRODUCTION_CHECKLIST.md`。

## Docker 与 GHCR

需要本机 Docker Desktop。以下命令会构建并用生产安全参数启动临时镜像，验证 canonical、健康检查、静态路由、Pagefind、Wasm、缓存与安全响应头：

```powershell
pnpm container:verify
```

正式镜像由 GitHub Actions 的 `publish-ghcr` 手动工作流发布到 public `ghcr.io/o-1717986918/win98-blog`。工作流只接受 `main` 和真实 HTTPS `site_url`，产出不可变 `sha-<commit>` 及可选 `stable` 标签；服务器可匿名使用根目录 `compose.yaml` 拉取，不在生产机编译源码。

## 目录

```text
src/
├── content/columns/        # 主题正文与主题私有组件（内部稳定名）
├── content/posts/          # 文章正文与文章私有组件
├── integrations/           # 构建期 chrome 路由分派
├── layouts/                # Base + full/minimal/none 装配
├── routes/                 # 六个文章/主题构建入口
├── pages/                  # 首页、搜索、标签、归档、项目、能力、时间线、隐私、RSS、404
└── styles/                 # 语义主题、站点外壳与长文排版
docs/source/                # 原项目的确定性架构结论
docs/handover/              # 接手现状、原则、研究与开发说明
experiments/                # 不属于生产主轴的历史视觉实验
prototype/                  # 冻结的原版单文件原型
docker/                     # 非 root Nginx 与响应头/缓存契约
compose.yaml                # 宝塔服务器的 GHCR 运行定义
```

新增主题与关联文章见 `docs/handover/COLUMN_MODEL.md`。项目级约束见 `AGENTS.md`，日常运维见 `docs/operations/OPERATIONS.md`。

## 权威顺序

1. 用户当前明确要求；
2. 可执行 Schema、生产源码、构建产物与自动化测试；
3. 已接受 ADR、`AGENTS.md`、`docs/handover/CURRENT_STATE.md` 与 `docs/handover/PRINCIPLES.md`；
4. `docs/source/blog-architecture.md` 与 `prototype/index.html` 提供历史原则和接手证据；
5. 视觉实验只提供过程证据，不定义生产主线。历史材料与当前实现冲突时，不覆盖较新的 ADR 和可执行契约。
