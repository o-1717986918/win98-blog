# 正式主线实现审查

日期：2026-08-28

审查对象：`src/` 与静态构建产物 `dist/`

## 结论

通过架构、类型与构建审查。正式项目已经不再是单个 HTML：Astro Content Collections 管理文章和栏目，真实路由由构建期分派器注入，首页、归档、关于、RSS、sitemap 与 404 独立生成。公开身份统一为“win98的小站”。

## `blog-architecture` 落实证据

| 确定性结论 | 正式实现 |
|---|---|
| 文章是主体 | 首页最近文章先于栏目目录；实验只作为具体栏目与文章存在 |
| 两个自由度正交 | MDX/私有组件负责内容自由，`chrome` 只选择外壳 |
| BaseLayout 为空骨架 | `BaseLayout.astro` 不导入 CSS、Header、Footer、Canvas 或阅读服务 |
| full/minimal/none 加法装配 | 六个文章/栏目入口各自只导入所需布局 |
| 内容身份稳定 | 文章与栏目均有真实同域 URL；文章进入 RSS/sitemap |
| 静态优先 | 11 个页面构建为静态 HTML；JavaScript 只用于搜索、主题、阅读偏好与实际 Canvas |
| 主题即数据 | 四主题共用语义 CSS RGB 令牌，环境 Canvas 读取同一令牌 |
| 内容共置 | ParticleField、LabColumn、ReadingScale 均与使用者目录共置 |

## 栏目审查

- `columns` 是独立集合，文章通过构建期 `reference('columns')` 关联；
- 工程栏目证明 full，阅读栏目证明 minimal，实验栏目证明 none；
- `nav:true` 与 `order` 自动控制导航，不写死栏目名；
- none 实验栏目以私有 `LabColumn.astro` 完整决定 DOM/CSS；文章档位与栏目档位无关。

## 产物证据

- `astro check`：42 个 Astro/TS 文件，0 error、0 warning、0 hint；
- Vitest：5 项架构契约通过；
- 静态构建：11 个页面、RSS 与 sitemap 生成成功；
- none 文章和 none 栏目均不含 SiteHeader、SiteFooter、ReaderControls、FullShell 或 minimal 样式，只保留 BaseLayout、私有内容与返回桥；
- full 代表页包含站点外壳、目录、上下篇和阅读控制；minimal 代表页无站点 Header/Footer，但保留返回桥与阅读控制。

## 浏览器审查

- 1280×720：首页 `scrollWidth=clientWidth=1265`，首篇文章顶部位于 670px，首屏同时建立站点身份并露出内容入口；
- 390×844：首页 `scrollWidth=clientWidth=375`，移动菜单展开后 `aria-expanded=true` 与 `data-open=true`；
- 移动 full/minimal 文章 `scrollWidth=clientWidth=375`，none 文章/栏目完整视口均为 390px，无横向溢出；
- full 文章实测包含 Header、Footer、3 项目录和阅读控件；字号按钮将语义比例从 1 调至 1.1；
- minimal 文章无 Header/Footer，有返回桥、环境背景与阅读控件；minimal 栏目无 Header/Footer，有返回桥；
- none 文章和栏目均无 Header/Footer/阅读控件，默认返回桥存在；粒子文章保留自己的 Canvas，实验栏目保留自己的页面结构；
- 首页主题按钮从 graphite 切到 paper，DOM 主题名同步；搜索 `Canvas` 正确保留两篇包含该词的文章。

## 上线前边界

需要由站主提供真实 `SITE_URL`；Pagefind、评论、统计、OG 图片与托管平台仍遵循按需引入，不用占位凭据假装完成。
