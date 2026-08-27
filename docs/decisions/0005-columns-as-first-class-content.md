# ADR-0005：栏目是一等内容集合，并拥有独立页面自由度

状态：Accepted

日期：2026-08-28

## 背景

`full/minimal/none` 表示页面对站点外壳的依赖程度，不表示文章内容分类。用 chrome 充当栏目会混淆“写什么”与“怎样呈现”，违反 `blog-architecture.md` 对两个自由度正交的结论。

## 决策

- 建立独立 `columns` Content Collection；文章用 `columns: reference('columns')[]` 关联零到多个栏目；
- 栏目也是自包含目录，拥有 frontmatter、MDX、私有组件、样式、脚本和媒体；
- 栏目独立声明 `chrome: full | minimal | none`，与所属文章的 chrome 互不推导；
- full 栏目使用站点外壳与自动文章索引，minimal 使用返回桥和精简索引，none 只使用文档骨架与默认返回桥；
- `nav`、`navLabel` 与 `order` 决定栏目是否自动进入导航；
- 集中式构建集成读取栏目 frontmatter，为每个栏目注入唯一且隔离的构建入口。开发者新增栏目无需修改路由或分派代码。

## 不变量

- 栏目不改变文章永久 URL、RSS、sitemap、搜索或元数据身份；
- 栏目不形成强制树状层级，一篇文章可以属于多个栏目；
- none 栏目与 none 文章不得携带全站 chrome；默认返回桥可用 `back:false` 显式关闭；
- 关联引用、chrome 分派和构建产物隔离必须由测试守护。

## 后果

分类语义和页面自由被真正解耦，栏目可以从普通归档渐进升级为独立网页。代价是同时维护文章/栏目 schema 与六个构建入口；这种显式重复换取了 none 页面可检查的依赖隔离。
