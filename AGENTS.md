# AGENTS.md

本文件约束所有在本仓库工作的自动化代理和开发者。除非用户明确覆盖，以下规则适用于整个仓库。

## 1. 先读后改

依次阅读 `docs/source/blog-architecture.md`、`README.md`、`docs/handover/CURRENT_STATE.md`、`docs/handover/PRINCIPLES.md`、`docs/handover/COLUMN_MODEL.md` 与相关 ADR。`blog-architecture.md` 是原项目已经确定的产品与架构结论；接手文档只能落实或补充，不能自行覆盖。

## 2. 身份与仓库边界

- 公开站名固定为“某人的小站”。不恢复历史候选名，也不把视觉概念用作站名。
- 不修改外部源目录 `C:\Users\26532\.zcode\workspace\default`。
- `prototype/index.html` 与 `docs/source/blog-architecture.md` 是哈希冻结的接手基线。
- `src/` 是唯一生产主线；`experiments/` 下的 Celestial Matrix 与单文件视觉候选只保留过程证据。
- 不把原型的 hash 路由、`innerHTML` 渲染或单文件结构复制进生产代码。
- 不提交密钥、`.env`、缓存、依赖目录或构建产物。

## 3. 产品与架构契约

- 文章是主体；首页首先帮助发现和阅读内容，不做营销页、仪表盘或概念展。
- 内容自由度与外壳自由度正交。`BaseLayout` 只提供文档骨架，其他 chrome 必须显式加法装配。
- 默认 `full`，确有阅读理由时用 `minimal`，需要完整网页控制时才用 `none`。
- 栏目是一等内容集合，不是 `chrome` 的分类名。文章可属于多个栏目；文章与栏目的 `chrome` 各自独立。
- 新栏目通过 `src/content/columns/<id>/index.mdx` 增加。栏目私有组件、样式、脚本和媒体与栏目共置；不得要求修改核心导航或路由。
- 所有文章和栏目保有同域真实 URL，并进入静态构建；文章继续进入 RSS、sitemap 和搜索体系。
- `none` 构建产物不得注入站点 Header、Footer、阅读控件、全站样式或服务；默认只保留可关闭的返回桥。
- 主题是语义数据。配色和背景可以重设计，但正文对比度、内容层级、减弱动效和失败降级不能被破坏。
- 原生静态 HTML 优先；客户端 JavaScript 必须由真实交互证明必要性。
- 文章/栏目私有能力先共置，出现第二个真实消费者后再提取公共组件。
- 不默认引入 Tailwind、整站 React/Vue、SPA 路由或运行时全局状态库。

## 4. 路由与内容规则

- `src/integrations/content-routes.mjs` 是集中式构建分派器：读取 frontmatter 的 `chrome`，为每个内容实体注入唯一的构建入口。
- 六个 `src/routes/{posts,columns}-{full,minimal,none}.astro` 入口保持单一职责，禁止在 `none` 入口导入 full/minimal 布局。
- 修改 schema、路由、布局、主题 ID 或部署目标时，同步 ADR/接手文档与架构测试。
- 新的长期约束写成 ADR，不只留在聊天或提交信息里。

## 5. 验证门槛

提交前至少运行：

```text
pnpm verify
```

涉及 UI 时还需验证 390×844 与 1280×720、键盘焦点、减弱动效、横向溢出、控制台，以及文章和栏目各自的 `full/minimal/none` 代表页。完成定义是代码、测试、文档和构建产物证据一致。
