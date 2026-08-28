# 某人的小站

一个静态优先、允许文章与栏目逐级获得网页级自由的个人博客。仓库从 `C:\Users\26532\.zcode\workspace\default` 的原项目接手而来；外部源目录保持不动，原型和架构文档以固定 SHA-256 保留为接手证据。

## 已交付能力

- Astro 7 + TypeScript + MDX Content Collections + 原生 CSS，输出纯静态站点；
- 首页、栏目、归档、全局中文全文搜索、归档内主题筛选、关于、隐私、RSS、sitemap、robots 与 `llms.txt`；
- 文章和栏目各自支持 `full / minimal / none`，两者的档位互不推导；
- 栏目是开发者可新增的一等内容集合，可拥有私有 Astro 组件、样式、脚本和媒体；
- 构建期路由分派保证 `none` 产物不包含站点 Header、Footer、阅读控件或全站样式；
- 草稿/定时发布、内容脚手架与审计、相关文章、阅读进度、分享、许可信息与封面图片；
- Open Graph、Twitter Card、BlogPosting JSON-LD、Expressive Code 与 Astro 图片管线；
- 可暂停的 PixiJS 离散景深粒子、指针牵引与点击散射、首页会话级开屏、四套低饱和语义配色、字号与沉浸偏好；标准正文无 JavaScript 也可阅读；
- 评论和统计是默认关闭的可选适配器，不配置时没有第三方请求；
- CI、内部链接检查、静态产物契约、体积预算与部署前检查。

## 快速开始

需要 Node.js 22.12+ 与 pnpm 11.19+。

```powershell
pnpm install
pnpm verify
pnpm dev
```

开发服务器默认打开 `http://localhost:4321/`。生产预览使用 `pnpm preview`。

创建内容：

```powershell
pnpm content:new post my-post "文章标题"
pnpm content:new column my-column "栏目标题"
pnpm content:audit
```

编辑、发布与资源共置见 `docs/operations/CONTENT_WORKFLOW.md`；Cloudflare Pages、通用静态主机和上线检查见 `docs/operations/DEPLOYMENT.md`。

## 目录

```text
src/
├── content/columns/        # 栏目正文与栏目私有组件
├── content/posts/          # 文章正文与文章私有组件
├── integrations/           # 构建期 chrome 路由分派
├── layouts/                # Base + full/minimal/none 装配
├── routes/                 # 六个文章/栏目构建入口
├── pages/                  # 首页、搜索、标签、归档、隐私、RSS、404
└── styles/                 # 语义主题、站点外壳与长文排版
docs/source/                # 原项目的确定性架构结论
docs/handover/              # 接手现状、原则、研究与开发说明
experiments/                # 不属于生产主轴的历史视觉实验
prototype/                  # 冻结的原版单文件原型
```

新增栏目与关联文章见 `docs/handover/COLUMN_MODEL.md`。项目级约束见 `AGENTS.md`，日常运维见 `docs/operations/OPERATIONS.md`。

## 权威顺序

1. 用户当前明确要求；
2. `docs/source/blog-architecture.md` 的确定性结论；
3. 已接受 ADR、`AGENTS.md` 与 `docs/handover/PRINCIPLES.md`；
4. `prototype/index.html` 的博客构造与设计哲学；
5. 视觉实验只提供过程证据，不定义生产主线。
