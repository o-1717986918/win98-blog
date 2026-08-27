# 个人技术博客构造检索与结论

日期：2026-08-28

## 研究问题

本轮不寻找“看起来像设计作品”的页面，而是检索长期运作的个人技术博客如何解决四件事：作者身份、内容发现、长文阅读、特殊实验与普通文章的关系。研究结果必须服从 `blog-architecture.md` 的确定性结论。

## 案例观察

| 案例 | 可验证做法 | 对“某人的小站”的启示 |
|---|---|---|
| Josh W. Comeau | 首页维护最新/热门内容索引；文章用 MDX 嵌入一次性交互组件；重建时保留原有设计主意而做细化 | 定制自由应发生在文章内部，不需要让每个页面都变成同一种概念界面 |
| Anthony Fu | 顶层区分 Blog、Projects、Talks 等身份；文章页按年份形成极易扫描的时间档案，并显示日期和时长 | 首页可以有人格，但文章索引必须直接、完整、按时间可追溯 |
| Emil Kowalski | 首屏一句话说明作者与工作；Projects 和 Writing 紧随其后，文章标题承担主要视觉信息 | 个人博客的主轴是“作者—作品—写作”，不是大面积装饰 hero |
| Gwern | 长文按标题/元数据、摘要、目录、正文、参考资料逐层增加信息深度 | `full` 文章要让读者能先判断、再扫描、再深读；目录是阅读工具而非装饰 |
| Maggie Appleton | 用 essays、notes、patterns 等类型和成长阶段标识内容；非时间流内容仍需要全局导航、过滤和搜索 | chrome 档位与内容类型都应显式，不让实验页成为无法返回的孤岛 |
| 阮一峰 | 最新内容、完整档案、年份与分类长期并存；大规模内容仍可通过朴素结构发现 | 时间顺序是博客最可靠的默认轴，分类与搜索负责补充而不是替代 |
| OneV's Den | 关于页解释作者身份与站内文章分类，分类名称带有个人语气 | 个人性应来自作者声音、选题与小尺度命名，不靠把整个站做成主题乐园 |
| IndieWeb | 内容应以自己的域名为长期身份，平台变化不应改变永久链接 | 与架构文档的“同域同构、统一 URL/RSS/sitemap”完全一致 |

## 平台与可访问性证据

- Astro Content Collections 提供构建期集合、schema、查询与渲染，适合把不同 chrome 档位维持在同一内容集合。
- Astro 文件路由默认在构建期预渲染；sitemap 集成可以收集静态生成的动态文章路由。
- Pagefind 可以只索引文章正文，并用页面元数据提供标签、类型和年份过滤；首页、导航和页脚无需污染结果。
- W3C 对长文视觉呈现建议提供不超过 80 个西文字符或约 40 个 CJK 字形的行宽，并允许文本放大、间距覆盖和回流。

## 对主线的综合结论

### 1. 首页是博客目录，不是产品宣传页

保留原版的品牌说明、最新文章、搜索、实验室入口和关于导航，但视觉权重改为：作者/博客一句话 → 最新文章 → 实验入口。首屏艺术效果只负责气氛，不能挡住文章入口。

### 2. 时间是默认轴，标签和搜索是辅助轴

文章列表继续按时间排列；日期、标题、摘要、标签和预计阅读时间保持可扫描。内容增长后增加按年归档，不在四篇示例阶段伪造复杂分类系统。

### 3. 文章页采用递进阅读

标题、摘要/导语、日期/时长/标签先帮助判断；正文与目录帮助深读；上下篇和评论位于阅读结束后。阅读坞只放字号与沉浸等直接相关操作。

### 4. 实验是文章的一种，不是第二个网站

首页只提供清楚的实验入口。`none` 页可以完全不同，但保留规范 URL、元数据、搜索/RSS 身份和默认返回桥。Celestial Matrix 仅用于三档文章实验，不参与主线品牌设计。

### 5. 现代感来自精度，不来自模板化特效

采用现代技术编辑排版、清晰元数据、细密网格、克制的仪器刻度与低密度星野；移除玻璃卡片堆叠、强霓虹光晕、无意义渐变和大面积控制台文案。博客的个人性来自真实文章、作者说明、主题与少量持续出现的观测标记。

## 参考来源

- [Josh W. Comeau — How I Built My Blog](https://www.joshwcomeau.com/blog/how-i-built-my-blog-v2/)
- [Josh W. Comeau — General articles](https://www.joshwcomeau.com/blog/)
- [Anthony Fu — Posts](https://antfu.me/posts)
- [Emil Kowalski](https://emilkowal.ski/)
- [Gwern — Design of This Website](https://gwern.net/design)
- [Maggie Appleton — A Brief History & Ethos of the Digital Garden](https://maggieappleton.com/garden-history)
- [阮一峰的网络日志 — 文章存档](https://www.ruanyifeng.com/blog/archives.html)
- [OneV's Den — 关于](https://onevcat.com/tabs/about/)
- [IndieWeb — Own your data](https://indieweb.org/own_your_data)
- [Astro — Content Collections API](https://docs.astro.build/en/reference/modules/astro-content/)
- [Astro — Routing Reference](https://docs.astro.build/en/reference/routing-reference/)
- [Astro — Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Pagefind — Indexing](https://pagefind.app/docs/indexing/)
- [Pagefind — Filtering](https://pagefind.app/docs/filtering/)
- [W3C WAI — Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation)
- [W3C WAI — Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing)
