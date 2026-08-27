# 个人博客架构方案：结论汇总

> **状态**：架构设计定稿，待实施
> **日期**：2026-08-27（第四轮更新）
> **说明**：本文档汇总四轮调研与设计评审（技术选型 → 模块化架构 → 独立网页模式评审 → 参考项目批判性吸收）的全部结论，作为后续实施的唯一依据。

---

## 1. 需求定位

| # | 需求 | 设计含义 |
|---|------|---------|
| 1 | 个人博客 | 轻量、免费、低维护，内容以文章为主 |
| 2 | **极强的模块化**：页面结构、博客内容都极易拼装 | 架构必须是"组件乐高"，而非"主题模板" |
| 3 | **单篇博客有独立网页级的编写自由度** | 文章可以定制到像一个手工编写的独立网页 |

由此推导出三条设计哲学：

1. **文章是主体，页面结构是文章可拼装的资源**——反对传统"Markdown 填进固定主题模板"的模式。
2. **自由度是滑块，不是开关**——默认走标准模板（低成本低维护），特殊文章按需逐级升级为"定制网页"。
3. **数据身份不独立，独立的只是对外壳的依赖程度**——无论多特殊，一篇文章始终是同一内容集合的成员（同一 URL 结构、同一 sitemap、同一 RSS）。

---

## 2. 技术选型结论

### 2.1 2026 年框架格局（调研结论）

| 梯队 | 框架 | 定位 | 是否满足本需求 |
|------|------|------|:---:|
| 🚀 现代首选 | **Astro** | 内容站点的"现代默认"，零 JS 默认 + Islands 架构 | ✅ |
| ⚡ 性能极致 | Hugo | Go 编写，海量内容秒级构建 | ❌ 主题模板锁死 |
| 🧩 全栈灵活 | Next.js | React 生态，博客只是能力之一 | ⚠️ 备选 |
| 📚 中文经典 | Hexo | 中文教程最多，但技术栈老旧 | ❌ 同上 |
| 🪶 极简路线 | Eleventy | 零配置、无框架绑定 | ⚠️ 能做但机制少 |

**选型结论：Astro。** 决定性理由：本方案要求的全部机制 Astro 均原生支持——frontmatter 布局覆盖、Content Collections（schema 类型安全）、MDX、组件级 scoped styles、按需交互岛屿。

**备选：Next.js**（仅当作者已是 React 深度用户且需要 SSR/API 路由时）。参考实现：Josh Comeau 的博客（Next.js + MDX，"每篇文章都是定制网页"的最著名范本）。

**否决：Hexo / Hugo**——其"主题"模式与本方案的模块化需求本质冲突。

### 2.2 最终技术栈（第四轮细化）

| 层 | 选型 | 理由 |
|----|------|------|
| 框架 | **Astro（最新大版本 v6）** | Content Layer API 支持任意内容源与万级条目；零 JS 默认 + Islands |
| 语言 | **TypeScript 全覆盖** | content.config.ts（zod schema）、layouts、dispatcher 全部 TS（借鉴 literary-studio） |
| 内容 | MDX + Content Collections | 组件化正文 + 编译期 schema 校验 |
| 样式 | **原生 CSS + Design Tokens（CSS 变量）+ `@layer` + Astro scoped styles** | 与主题系统天然契合（主题=变量集）；`none` 档零全局 CSS 的隔离目标依赖 `@layer`；不引入 Tailwind——工具类会与"主题即数据"模式和手写定制文章冲突（见 2.3） |
| 代码高亮 | **Expressive Code**（基于 Shiki） | 2026 年 Astro 博客事实标准：双主题、行号、标记、复制按钮、文件框 |
| OG 分享图 | **Satori 管线**（astro-og-canvas 或 x-satori） | 构建时按文章 frontmatter 自动生成分享卡，可跟随每篇文章的 `theme` 配色 |
| 图片 | Astro 内置 `<Image />` + Sharp | 构建时压缩、WebP/AVIF、防布局偏移 |
| 页面过渡 | **Client Router**（View Transitions，v5 起转正） | 跨页淡入淡出；`none` 档文章可按篇退出 |
| 测试 | **Vitest**（架构守护测试 + dispatcher 单测） | "架构约束=可执行断言"（借鉴 literary-studio 的 featureBoundary.spec.ts） |
| 托管 | Cloudflare Pages | Git push 即发布；国内访问相对友好 |
| 评论 | Giscus（国际）/ Waline、Artalk（国内优先） | Waline/Artalk 渲染用户 HTML 时必须过 DOMPurify 白名单（借鉴 SafeMarkdown） |
| 搜索 | Pagefind | 构建时静态索引，零后端 |
| 统计 | Umami | 隐私友好，可自托管 |

### 2.3 明确不引入的技术（含理由）

| ❌ 不引入 | 理由 |
|-----------|------|
| Tailwind CSS | 工具类体系与"主题=CSS 变量数据"的设计相反；`none` 档文章作者要写的是普通 CSS 而非工具类；两个参考项目的 CSS 均为原生 CSS + tokens 方案且运转良好 |
| 零构建手写 DOM（arcvellum 模式） | 没有内容管道：无 MDX、无集合、无 schema。对"一个精密仪器应用"合理，对上百篇文章的内容站是死路 |
| SPA + hash 路由（literary-studio 模式） | URL 带 `#`、运行时渲染、SEO 全灭——"博客必须静态"的最佳反例证明 |
| 运行时状态管理（Pinia 类） | 静态站无全局状态诉求；读者偏好用 localStorage + data-attr 即可 |
| command bus / desktop bridge / startup scene 级别的应用机制 | 复杂度预算超标，博客抄了就是自残 |
| Vue / React 作为整站框架 | Astro 原生组件已覆盖布局与静态组件；框架仅按需作岛屿（交互组件可用 Preact/React，默认不引入） |

---

## 3. 托管与部署

| 平台 | 特点 | 结论 |
|------|------|------|
| GitHub Pages | 完全免费，入门标配 | 可用，但国内访问一般 |
| Vercel / Netlify | 预览部署、域名体验最佳 | 默认域名国内时好时坏 |
| **Cloudflare Pages** | 免费额度大、全球节点多、**国内访问相对友好** | ✅ 首选 |

部署模式：**Git push 即发布**，仓库中存全部内容与代码，CI 自动构建分发。

---

## 4. 核心架构设计（本文档重点）

### 4.1 先拆解一个关键认知：「网页级自由度」是两个正交维度

| 维度 | 含义 | 实现机制 |
|------|------|---------|
| **内容自由度** | 正文里能放什么：组件、私有脚本、交互岛屿 | MDX + 文章自包含文件夹 |
| **文档自由度** | 这一页是否不受博客外壳（导航/页脚/全局 CSS·JS，即 chrome）约束 | chrome 三档分级 |

二者独立调配：一篇文章可以"外壳完整 + 正文全定制"，也可以"零外壳 + 纯文字"。

**独立网页 vs 内嵌的取舍结论**：不是二选一。在 SSG 中每个页面本来就是独立 HTML 文档，"内嵌"只是"组合了多少外壳组件"。架构应把这个注入量显式化为分档。

### 4.2 三层模块化

**层 1 · 页面结构可拼装 —— 布局系统**

- 布局是可继承、可覆盖的组件链：`BaseLayout` → `PostLayout` → 任意特殊版式。
- 每篇文章通过 frontmatter 声明页面级开关（版式、TOC 显隐、评论开关等）。

**层 2 · 内容可拼装 —— MDX 组件化正文**

正文不只是文字，而是组件装配现场：标题、段落、Callout、图表、代码演示、问答小部件全是同一等公民，随意拼装。

```mdx
import Callout from '../../components/Callout.astro'
import CodePlayground from '../../components/CodePlayground.tsx'

<Callout type="tip">传统 Markdown 做不到的事</Callout>

普通文字与交互组件混排：

<CodePlayground code={`console.log('hello')`} />
```

**层 3 · 单篇网页级自由度 —— 文章自包含文件夹（colocation）**

每篇文章是一个**文件夹**而非文件，私有组件、样式、脚本、图片就地存放：

```
content/posts/canvas-experiment/
├── index.mdx       # 正文
├── particles.js    # 本文专属脚本
└── cover.png
```

自由度天花板：某篇文章可以完全不用 Markdown，直接写成一个 `.astro` / `.tsx` 页面文件——Markdown 是"默认便利"，不是"天花板"。

### 4.3 外壳契约：加法设计（评审后的关键修正）

> 初版设计中 `BaseLayout` 隐含站点 chrome，"独立网页"是要绕过外壳的逃生舱（减法设计，逃生舱永远是二等公民）。
> **修正为加法设计**：

- `BaseLayout` 只保证 `<html><head>` 骨架 + 一个内容插槽，**不含任何视觉 chrome**；
- 导航、页脚、TOC、评论区全部是**可组装的外壳部件**（`chrome/` 目录）；
- "完整博客页" = BaseLayout + 一堆部件的**一种特定组合**，而非默认继承物。

三档模式由此变成同一套零件的三种拼法，机制上不存在"逃逸"。

### 4.4 chrome 三档分级

内容集合 schema 中加枚举字段：

```ts
// content.config.ts
chrome: z.enum(['full', 'minimal', 'none']).default('full'),
back: z.boolean().default(true),  // none 档下是否注入浮动返回徽章
```

| 档位 | 拼装结果 | 适用场景 |
|------|---------|---------|
| `full`（默认） | BaseLayout + 导航 + 页脚 + TOC + 评论 | 约 90% 的"读"型文章 |
| `minimal` | BaseLayout + 悬浮返回条 + 正文（无页脚/侧栏） | 特殊版式但仍以阅读为主 |
| `none` | 纯 BaseLayout，零全局 CSS/JS 注入 | 文章即"作品/实验"：全屏 canvas、交互可视化、scrollytelling |

**构建时分级 × 运行时切换，两条互补的轴线**（借鉴 arcvellum 的 immersive 模式）：`chrome` 字段是作者在构建时声明的"这页是什么"；此外再提供一个**读者侧运行时沉浸开关**——阅读长文时一键收起导航（body class 切换 + localStorage 记忆 + Esc 唤回）。前者决定页面生来是什么样，后者把选择权临时交给读者，二者互不冲突。

渲染由**集中式 dispatcher** 完成（而非每篇文章散写 `layout:` 路径——schema 枚举校验、中央可控）：

```astro
---
// src/pages/posts/[...slug].astro
const layouts = {
  full: PostLayout,        // BaseLayout + Header + Footer + TOC + Giscus
  minimal: BareLayout,     // BaseLayout + BackBadge
  none: StandaloneLayout,  // 只有 BaseLayout，其余为零
}
const Layout = layouts[post.data.chrome]
const { Content } = await render(post)
---
<Layout post={post}><Content /></Layout>
```

### 4.5 独立档（`none`）四条硬约束

1. **同域同构**：URL 仍是 `/posts/xxx/`，参与同一构建，进同一份 sitemap 和 RSS。对搜索引擎和读者，它就是博客的一篇文章——"独立"只是渲染时不带外壳，**不是脱离博客**。
2. **导航桥**：`none` 档自动注入浮动「← 返回博客」徽章（`back: false` 可显式关闭），解决独立页"出不去"的体验问题。
3. **样式隔离从机制上保证**：外壳全局样式全部收进 `@layer shell`；`none` 档引入的全局 CSS 为零，想污染都没有入口。反向亦然——`full` 档中文章私有样式靠 Astro scoped style 不外漏。
4. **按档注入外围服务**：统计、评论区只随 `full` / `minimal` 档加载；`none` 档性能预算 100% 归文章自己。

### 4.6 反模式清单（明确否决）

| ❌ 做法 | 否决理由 |
|--------|---------|
| iframe 嵌入独立构建的文章页 | 破坏 URL 分享、SEO、滚动与性能；仅适合嵌外部演示（如 Observable） |
| 独立子域 / 独立部署"作品集" | 内容集合、搜索、RSS、订阅关系全被拆散，摧毁模块化目标 |
| 篇篇上 `none` 档 | 每篇都手写网页，维护成本失控；默认值必须是 `full` |

---

## 5. 目录结构（定稿）

```
src/
├── layouts/
│   ├── BaseLayout.astro        # 唯一契约：html/head 骨架 + 插槽，无任何视觉 chrome
│   ├── PostLayout.astro        # chrome: full 的拼装方案
│   ├── BareLayout.astro        # chrome: minimal
│   └── StandaloneLayout.astro  # chrome: none
├── chrome/                     # 外壳零件（可增删、跨档复用）
│   ├── SiteHeader.astro
│   ├── SiteFooter.astro
│   ├── Toc.astro
│   ├── BackBadge.astro         # 导航桥
│   └── ImmersiveToggle.astro   # 读者侧运行时沉浸开关（借鉴 arcvellum）
├── themes/                     # 主题=纯数据的 CSS 变量集（借鉴 arcvellum themes.js）
│   ├── default.css             # 基础 design tokens（含日夜两套）
│   └── obsidian.css            # 示例：一篇文章一套艺术方向
├── components/                 # 内容级组件（Callout、图表、代码演示…）
│   ├── Callout.astro
│   ├── Chart.astro
│   └── CodePlayground.tsx      # 交互岛屿
├── content/posts/              # 每篇文章 = 自包含文件夹
│   ├── hello-world/
│   │   ├── index.mdx
│   │   ├── Hero.astro          # 本文私有组件
│   │   └── cover.png
│   └── canvas-experiment/
│       ├── index.mdx
│       └── particles.js        # 本文专属脚本
└── tests/
    └── architecture.spec.ts    # 架构守护测试（借鉴 literary-studio，见第 10 章）
```

---

## 6. 内容创作模型

**单篇文章的完整声明能力**（frontmatter）：

```yaml
---
title: 粒子宇宙实验
chrome: none                        # full | minimal | none（默认 full）
theme: obsidian                     # 可选：指定主题（一组 CSS 变量），不写则用默认
back: true                          # none 档下的导航桥开关
wide: true                          # 版式开关（full/minimal 档可用）
hideToc: true                       # 关闭目录
customScript: ./particles.js        # 注入本文专属 JS
# layout 字段不直接使用——由 dispatcher 统一调度
---
import Hero from './Hero.astro'     # 正文可 import 私有组件

<Hero />                            # 正文 = 自由拼装

其余用 Markdown 正常书写，需要交互处直接放组件。
```

```ts
// content.config.ts 中对应的 schema 片段
chrome: z.enum(['full', 'minimal', 'none']).default('full'),
theme: z.string().optional(),       # 对应 src/themes/ 下的一个 token 集
back: z.boolean().default(true),
```

**主题即数据**（借鉴 arcvellum themes.js）：一个主题文件只包含一组 CSS 变量声明，由布局挂载到文章页根元素上——文章换整套配色不用写一行 CSS，OG 分享图也可以读取同一主题配色生成。

**使用准则**：默认什么都不写（`full` 档开箱即用）；只有特殊文章才逐级升级。升级顺序：先试 `minimal`，确实需要零外壳时才用 `none`。

---

## 7. 生态组件选型

| 用途 | 选型 | 备选 | 说明 |
|------|------|------|------|
| 评论 | **Giscus**（基于 GitHub Discussions） | Waline / Artalk（国内访问优先） | 免费无广告，按 chrome 档注入 |
| 站内搜索 | **Pagefind** | — | 构建时生成静态索引，零后端 |
| 访问统计 | **Umami** | Plausible | 隐私友好，可自托管 |
| 全文格式 | **MDX** | — | Markdown 超集，可嵌组件 |

---

## 8. AI 时代考量（GEO / LLMO）

2026 年博客的优化目标已从"Google 排名"扩展为"**被 AI 搜索引用**"：

- **有效手段**：结构化数据、Schema 标记、语义化 HTML、清晰的标题层级。静态博客天然对 AI 抓取友好（纯 HTML、无登录墙）。
- **llms.txt**（网站根目录给 LLM 读的说明文件）：Google 官方已声明不影响排名，但制作成本极低（约 20 分钟），可做、不依赖。
- 本方案的静态 + 语义化 HTML + sitemap 结构已覆盖绝大部分要求，无需额外投入。

---

## 9. 实施路线图

| 阶段 | 内容 | 产出 |
|------|------|------|
| **Phase 1** 骨架 | Astro 初始化 + BaseLayout + 三档布局 + chrome 部件 + dispatcher + design tokens（含日夜主题） | 可本地运行的空博客 |
| **Phase 2** 内容 | Content Collections + schema + 两篇示例文章（一篇 `full`、一篇 `none` 档 canvas 演示）+ Expressive Code + **架构守护测试** | 验证三档差异，架构规则有测试兜底 |
| **Phase 3** 生态 | Giscus 评论 + Pagefind 搜索 + Umami 统计 + Satori OG 分享图 | 功能完整 |
| **Phase 4** 上线 | Cloudflare Pages 部署 + 自定义域名 + sitemap/RSS + Client Router 页面过渡 | 公网可访问 |

---

## 10. 借鉴附录：两个参考项目的批判性吸收

> 来源：`arcvellum/frontend`（零构建原生 JS + WebGL2 天文台应用）与 `literary-engineering-studio`（Vue 3 + feature-sliced 桌面工作台）。仅吸收模式，不搬技术栈。

### 10.1 吸收的五个模式

| # | 模式 | 来源 | 落点 |
|---|------|------|------|
| 1 | **主题=一个数据对象驱动多层渲染**（CSS 变量 + 场景调色板 + 天空色调一次下发） | arcvellum `themes.js` | 第 6 章 `theme:` 字段 + `src/themes/` |
| 2 | **架构守护测试**（测试扫描源码强制架构规则：组件不直接 import HTTP 层、每个 feature 必有语义化 client） | literary-studio `featureBoundary.spec.ts` | 第 5 章 `tests/architecture.spec.ts`：断言 `none` 档零全局 CSS、chrome 部件互不 import、文章文件夹必有 index.mdx |
| 3 | **运行时沉浸模式**（body class 关掉全部仪器 UI，localStorage 记忆，Esc 唤回） | arcvellum `Shell.toggleImmersive()` | 第 4.4 章 `ImmersiveToggle.astro`：与构建时 chrome 分级互补 |
| 4 | **偏好规范化三件套**（normalize 成枚举→持久化→挂 data-attr，CSS 写 `[data-x]` 选择器） | literary-studio `orreryPreferences.ts` + arcvellum reader 偏好 | 读者侧字号/行距/日夜/阅读进度恢复 |
| 5 | **动态内容净化纪律**（DOMPurify 白名单 + 链接协议校验 + `rel="noopener"`） | literary-studio `SafeMarkdown.vue` | 仅适用于评论等用户内容；构建期 MDX 由可信作者编写，不做多余净化 |

### 10.2 印证与反教训

**印证**（两项目从正反两面验证了方案主干）：chrome 可开关是实战形态（A 的沉浸模式 / B 的路由驱动外壳切换）；集中式组合根（A 的 app.js 注入 / B 的 App.vue + router）对应我们的 dispatcher；文档先行（A 的 DESIGN.md）对应本文档。

**反教训**（已写入 2.3 节"明确不引入"）：零构建手写 DOM 无内容管道（A）；SPA + hash 路由毁掉 SEO 与分享（B）；上帝状态单例（A）；command bus 级别的应用机制复杂度（B）。

**顺手吸收**：两个项目均为重度中文排版打磨（衬线标题 + 无衬线正文 + 尊重 `prefers-reduced-motion` / `prefers-color-scheme`），直接进博客 base 样式基线。

## 11. 参考资料

**框架调研**
- [Hygraph: Top 12 SSGs for 2026](https://hygraph.com/blog/top-12-ssgs)
- [2026 静态站点生成器对比](https://gautamkhorana.com/blog/static-site-generators-2026-astro-eleventy-hugo-jekyll-gatsby/)
- [Astro 博客搭建完全指南](https://blog.moewah.com/hubs/astro-blog-setup-guide/)
- [从 Hugo 迁移到 Astro 的实战经验](https://rudeigerc.dev/posts/migrating-from-hugo-to-astro/)

**模块化与单篇自由度**
- [Josh Comeau: How I Built My Blog (2024 App Router Edition)](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)
- [Josh Comeau: Why My Blog is Closed-Source](https://www.joshwcomeau.com/blog/why-my-blog-is-closed-source/)
- [Astro 官方文档：Layouts](https://docs.astro.build/en/basics/layouts/)
- [Creating a Blog Platform with Astro and MDX](https://www.thomasledoux.be/blog/create-blog-astro-mdx)

**AI 时代**
- [Google 2026 指南：llms.txt 对排名无影响](https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026)
- [onevcat: llms.txt](https://onevcat.com/2025/04/llmtxt/)

**技术栈细化（第四轮）**
- [Astro 5.0 发布公告：Content Layer API 与 Server Islands](https://astro.build/blog/astro-5/) · [升级至 v6 指南](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Astro 官方文档：语法高亮（Shiki）](https://docs.astro.build/en/guides/syntax-highlighting/)
- [Expressive Code 官网](https://expressive-code.com/) · [astro-expressive-code（NPM）](https://www.npmjs.com/package/astro-expressive-code)
- [Satori OG 图生成实践（中文）](https://calpa.me/blog/satori-open-graph-image-generation/) · [astro-og-canvas（GitHub topics）](https://github.com/topics/satori?l=typescript&o=desc&s=forks)

**延伸方向（暂不实施，留档）**
- 数字花园（Obsidian + Quartz 4，双链知识图谱形态）：[Quartz 官网](https://quartz.jzhao.xyz/) · [数字花园简史](https://blog.iaieye.com/posts/obsidian-evolved/appleton-digital-garden/)
- Notion 系博客（写作体验优先，定制性弱，与本需求冲突）
