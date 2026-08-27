# 接手实施计划

状态：已审查，可执行。每个 Gate 通过后再进入下一阶段。

## Gate 0：基线接管（已完成）

产出：

- 源资产原样迁入并记录 SHA-256；
- 新 Git 工作区、`AGENTS.md`、接手现状、计划审查、设计审查、原则与 ADR；
- 零依赖 `pnpm check` 与原型预览命令；
- 桌面和移动端实测记录。

退出条件：`pnpm check` 通过，源目录未改变，新仓库首个基线提交可复现。

## Gate 1：Astro 7 最小骨架

范围：

- 使用 pnpm 初始化 Astro 7，固定 lockfile；
- 静态输出，不加云平台 adapter；
- 建立 TypeScript、格式化、类型检查、Vitest 和最小浏览器冒烟；
- 建立 `BaseLayout`、内容 schema 与真实 `/posts/[...slug]/` 路由；
- 建立一个最小文章，证明构建、404、canonical、sitemap 和 RSS 路径。

退出条件：全新安装后 `check + test + build` 通过；构建产物使用真实路径且无 hash 路由。

## Gate 2：原型等价迁移

范围：

- 将四篇内嵌文章拆为自包含 MDX 目录；
- 建立 `full`、`minimal`、`none` 布局与集中 dispatcher；
- 拆出主题令牌、header、footer、TOC、返回桥和阅读控制；
- 将星野和粒子实验变为独立、可清理的客户端模块；
- 修复移动顶栏溢出和浮层可访问性。

退出条件：三档各有代表页；桌面视觉意图与原型一致；390px 无溢出；无 JS 标准文章可读；`none` 构建产物不含标准 chrome 服务。

## Gate 3：架构守护与内容工作流

范围：

- schema 覆盖 title、description、date、tags、chrome、theme、back、draft 和 OG 字段；
- 测试文章目录完整性、slug 唯一性、主题存在性、chrome 映射、内部链接和构建输出；
- 建立文章模板、媒体规范、草稿/发布日期规则；
- 记录正式性能预算和浏览器支持矩阵。

退出条件：错误 frontmatter 会使 CI 失败；新建文章无需修改 dispatcher；文档可让新贡献者独立完成一篇文章。

## Gate 4：生态能力逐项接入

顺序建议：

1. 图片优化与代码高亮；
2. RSS、sitemap、结构化数据和 OG 图；
3. Pagefind；
4. 评论；
5. 统计；
6. 页面过渡。

每项必须：可关闭、失败可降级、测量客户端成本、验证 `none` 不被自动注入。

## Gate 5：部署决策与上线

到此时再比较 Cloudflare Workers、Cloudflare Pages 与其他静态托管，依据：

- 纯静态输出是否足够；
- 自定义域名、预览部署、回滚和缓存；
- 目标读者实际网络测试，而非“国内相对友好”的未经测量判断；
- 构建环境的 Node/pnpm 支持；
- 日志、分析、隐私和费用。

退出条件：预览环境通过浏览器、链接、可访问性和性能检查；上线与回滚步骤有文档；域名和外部服务凭据由用户安全配置。

## 暂不执行

- 不在 Gate 1 前接入 Giscus、Waline、Umami 或 Pagefind；
- 不从原型直接抽取一个“万能组件库”；
- 不为未来可能的 SSR/API 提前引入 Cloudflare adapter；
- 不把所有视觉差异一次性“重设计”；
- 不承诺特定托管平台在中国大陆的访问质量，先测量。
