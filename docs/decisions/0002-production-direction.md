# ADR-0002：正式工程方向

状态：Accepted

日期：2026-08-28

## 背景

历史方案选择 Astro v6 和 Cloudflare Pages。审查时 Astro 7 已正式发布，Cloudflare 也把 Workers 定位为新项目主平台。当前资产仍只是零依赖原型，因此没有旧框架兼容负担。

## 决策

- 正式工程从 Astro 7 最新稳定版起步，并用 pnpm lockfile 固定精确版本；
- 内容使用 MDX + Content Collections + schema；
- 默认生成静态 HTML，采用真实文件路由；
- 保留 `full | minimal | none` 三档和加法式 chrome；
- 原生 CSS + 语义设计令牌为默认样式策略；
- 交互框架按单个岛屿的实际需要引入，不设整站框架；
- Gate 1 不绑定部署 adapter，Gate 5 再决定 Workers、Pages 或其他静态托管。

## 后果

优点：避免新建即升级；生产方向符合当前官方版本；部署保持可移植。

代价：Astro 7 的严格 HTML、默认 Markdown 管线和空白处理与 v6 有差异，迁移时必须做视觉与内容回归；部署平台结论被推迟，需要单独评审。

## 参考

- [Astro 7.0](https://astro.build/blog/astro-7/)
- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Cloudflare framework guides](https://developers.cloudflare.com/pages/framework-guides/)
