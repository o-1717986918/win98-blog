# 运维手册

## 日常命令

| 目标 | 命令 |
|---|---|
| 开发 | `pnpm dev` |
| 内容审计 | `pnpm content:audit` |
| 单元与架构测试 | `pnpm test` |
| 全量验证 | `pnpm verify` |
| 生产预览 | `pnpm preview` |
| 上线前域名/服务检查 | `pnpm deploy:check` |

`pnpm build` 依次执行工作区冻结资产检查、内容审计、Astro 类型检查、静态构建、Pagefind 索引、产物契约、内部链接和体积预算。

## 监控目标

- 以真实用户 75 分位为准：LCP ≤ 2.5 秒、INP ≤ 200 毫秒、CLS ≤ 0.1；
- 构建预算：单个自有 JS ≤ 90 KiB、站点 CSS 总计 ≤ 160 KiB、单个优化媒体 ≤ 700 KiB；
- 无统计 provider 时用浏览器 Lighthouse 或托管平台的按需报告，不为监控强制引入追踪；
- Pagefind 是按需加载，搜索失败不影响导航、栏目、标签、归档或正文阅读。

## 故障处理

### 构建失败

先运行 `pnpm content:audit`。最常见原因是失效栏目引用、错误 slug、`updated` 早于 `date`、图片缺少 alt 或内部链接不存在。依赖问题使用 `pnpm install --frozen-lockfile` 复现 CI。

### 搜索失败

确认部署产物包含 `/pagefind/pagefind.js`、worker、索引片段和 `.pagefind` 二进制；确认主机没有把这些路径重写成 HTML。搜索模块失败时页面会显示降级提示。

### 评论失败

正文不受影响。Giscus 检查仓库公开性、Discussions、App 安装与四个 ID；Waline 检查服务健康、数据库和跨域。紧急情况下把 provider 改为 `none` 重新部署。

### 性能回退

先检查新媒体、第三方脚本和大组件。Canvas 在页面隐藏、系统减弱动效或手动暂停时不持续绘制；不要移除这些守卫。`none` 页面不应为性能修复而引入全站依赖。

## 备份与所有权

- Git 远端保存源码、内容与配置历史；构建 artifact 至少保留最近一个稳定版本；
- 共置媒体随 Git 或项目约定的 LFS/对象存储备份；
- Giscus 评论属于 GitHub Discussions；Waline 数据库必须单独备份；
- 域名、DNS、托管账号和 provider 密钥不进入仓库，记录在站主的凭据管理器中。

## 依据

- [Google Core Web Vitals 阈值](https://web.dev/articles/vitals)
- [WCAG 2.2 暂停、停止、隐藏](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- [Giscus 官方说明](https://giscus.app/zh-CN)
- [Waline 官方指南](https://waline.js.org/guide/get-started/)
