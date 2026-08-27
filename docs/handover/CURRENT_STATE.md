# 接手现状

审查日期：2026-08-28

## 结论

项目已经从单文件原型落实为可构建的 Astro 7 多路由博客，公开身份为“某人的小站”。`src/` 是正式实现；旧单文件重设计与 Celestial Matrix 均已隔离为实验。原项目的“文章主体、加法外壳、静态优先、主题数据化、内容共置”结论均有源码与产物级测试。

## 已实现

| 能力 | 实现证据 |
|---|---|
| 真实内容与路由 | `src/content/`、`src/integrations/content-routes.mjs`、`src/routes/` |
| 文章三档外壳 | full 标准长文、minimal 阅读页、none 粒子场 |
| 栏目功能 | 独立 `columns` 集合；工程/阅读/实验三种代表栏目 |
| 栏目网页级自由 | `src/content/columns/lab/LabColumn.astro` 完整控制栏目页面 |
| 站点结构 | 首页、归档、关于、404、RSS、sitemap、规范 URL |
| 配色与背景 | 四套语义令牌；静态 CSS 环境网格 + 一次绘制 Canvas 场 |
| 读取体验 | 搜索、目录、上下篇、字号与沉浸偏好、移动导航 |
| 架构守护 | Vitest 源码契约 + `scripts/check-build.mjs` 产物契约 |

## 关键实现决定

Astro 对同一路由中静态导入的所有布局会聚合样式。为真正满足 `none` 的零全站注入，项目没有使用一个运行时联合组件，而由集成在构建开始前读取每个 `index.mdx` 的 `chrome`，把确切 URL 分派到六个互相隔离的入口。新增内容不需要修改分派器；构建时仍会验证 frontmatter 与入口一致。

## 当前边界

- `SITE_URL` 未配置时 canonical 使用 `https://example.com`，上线前必须在构建环境设置真实域名；
- Pagefind、评论、统计与 OG 图片尚未接入，遵循“需要时引入”；
- 示例内容用于证明架构，可由站主替换为真实文章与栏目；
- 性能预算与最终托管平台仍属于后续上线 Gate。

冻结源资产和哈希见 `MIGRATION_MANIFEST.md`。
