# 计划审查

审查对象：`docs/source/blog-architecture.md` 第 9 节实施路线图。

## 审查结论

原路线图方向正确，但还不能直接执行：阶段以功能列表组织，没有入口条件、退出条件、风险门禁和回滚策略；框架与部署判断也已发生时间性变化。建议保留四阶段叙事，但按 `TAKEOVER_PLAN.md` 的交付门禁执行。

## 必须修正

### P0：框架主版本已过期

历史方案写“最新大版本 v6”，但 Astro 7 已于 2026-06-22 正式发布。新工程应从 Astro 7 创建并锁定精确依赖版本；不要先建 v6 再升级。Astro 7 的 Rust 编译器、更严格 HTML、默认 Sätteri Markdown 管线和 JSX 式空白处理，会影响模板与 MDX 验收。

### P0：先建立可验证的迁移基线

原计划从“初始化 + 三档布局 + chrome + dispatcher + tokens”一次性开始，容易同时改变架构和视觉。应先固定原型截图、路由清单、文章数据和主题令牌，再逐页等价迁移。

### P0：成功标准缺失

每阶段必须有可执行退出条件：构建成功、真实路径生成、三档代表页、无横向溢出、无 JS 可读、减弱动效、schema 失败用例和关键浏览器检查。只有文件存在不算完成。

## 应调整

### P1：部署目标需要重新决策

Cloudflare Pages 仍支持 Astro 静态与 SSR 项目，但 Cloudflare 当前官方框架总览把 Workers 作为新项目主平台。项目应保持标准静态 `dist/` 输出，不在骨架阶段绑定 adapter；到部署门禁再比较 Workers、Pages 和其他静态托管。

### P1：内容迁移工作被低估

当前四篇文章是 JS 中的 HTML 字符串，不是 Markdown。迁移需要保留 slug、日期、标签、阅读时长、代码块、表格、callout、上下篇关系和标题锚点，并为每篇文章建立内容验收。

### P1：第三方生态应逐项进入

评论、搜索、统计、OG 图和页面过渡不是一个阶段的一次提交。每项都应有独立开关、失败降级、隐私说明、性能测量和 `none` 档不注入的断言。

### P1：测试策略不应只靠 Vitest

架构守护测试适合检查 import 边界和内容目录规则，但不能验证真实 HTML、键盘操作和视觉溢出。需要组合：类型检查、单元/架构测试、生产构建、链接检查、浏览器冒烟、可访问性与性能审计。

## 保留的正确决策

- Astro 与内容站定位匹配；
- MDX + Content Collections + schema 能承接文章级自由；
- BaseLayout 的加法设计优于从重型模板逃逸；
- 三档 chrome 是清晰、可测试的产品契约；
- 原生 CSS、设计令牌、按需交互岛屿适合当前目标；
- 内容与私有资产共置、统一 URL/RSS/sitemap 的约束应保留。

## 参考

- [Astro 7.0 官方发布](https://astro.build/blog/astro-7/)
- [Astro v7 升级指南](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Astro Content Collections 官方文档](https://docs.astro.build/en/guides/content-collections/)
- [Cloudflare Workers 的 Astro 指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)
- [Cloudflare Pages 的 Astro 指南](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
