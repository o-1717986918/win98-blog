# 栏目模型与开发说明

## 定位

栏目回答“这篇文章讨论什么、被放进哪组内容”，`chrome` 回答“这个页面需要多少站点外壳”。两者完全正交：

```text
文章 ── columns[] ──> 栏目
  │                     │
  └─ chrome             └─ chrome
     full|minimal|none     full|minimal|none
```

因此 `none` 交互文章可以同时属于普通 `full` 工程栏目；`none` 策展栏目也可以收录 `full` 长文。栏目不是目录树，也不是文章等级，一篇文章可以属于多个栏目。

## 新增普通栏目

只需创建 `src/content/columns/<id>/index.mdx`：

```mdx
---
title: 工程实践
description: 架构、构建与维护记录。
chrome: full
theme: abyss
accent: aqua
nav: true
navLabel: 工程
order: 10
showPosts: true
---

这里可以写栏目说明。
```

`nav:true` 的栏目自动按 `order` 进入站点导航，构建集成自动注入真实 URL `/columns/<id>/`；不修改导航、页面路由或分派器。

文章通过引用加入栏目：

```yaml
columns: [engineering, field-notes]
```

引用由 Content Collections 在构建期验证。栏目只改变发现关系，不改变文章 URL、RSS 身份或文章自身 chrome。

`accent` 可取 `aqua / coral / violet / gold`，省略时为 `aqua`。它是栏目的稳定视觉身份：文章列表、重点文章和相关文章继承文章首个栏目的 accent，因此调整 `columns` 顺序也会改变文章的主要策展色。不要依靠列表位置制造交替配色。

## 让栏目获得网页级自由

栏目正文、私有组件、样式、脚本和媒体与 `index.mdx` 放在同一目录。升级顺序仍为 `full → minimal → none`。

```text
src/content/columns/field-notes/
├── index.mdx
├── FieldIndex.astro
├── field-map.ts
└── assets/
```

```mdx
---
title: 现场笔记
description: 一组可以独立编排的观察记录。
chrome: none
theme: abyss
back: true
nav: true
order: 30
---
import FieldIndex from './FieldIndex.astro'

<FieldIndex />
```

`none` 栏目只得到 `BaseLayout` 和默认返回桥，其余 DOM、CSS、Canvas/WebGL 与交互均由栏目决定。生产示例见 `src/content/columns/lab/`。确需全屏孤立体验时才设置 `back:false`。

## 字段

- 栏目：`title`、`description`、`chrome`、`theme`、`accent`、`back`、`nav`、`navLabel`、`order`、`showPosts`、`draft`；
- 文章：`title`、`shortTitle`、`description`、`date`、`updated`、`format`、`tags`、`columns[]`、`evidence`、`syndication`、`chrome`、`theme`、`back`、`wide`、`hideToc`、`draft`。

新增或调整后运行 `pnpm verify`；测试会检查引用有效性、三档代表页、路由分派和 `none` 产物隔离。
