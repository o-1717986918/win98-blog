# 部署指南

## 1. 生产前提

- Node.js 22、pnpm 11；
- 把 `.env.example` 中的 `SITE_URL` 改为真实 HTTPS 根域名，不带路径和尾斜杠；
- 构建命令：`pnpm build`；输出目录：`dist`；
- 最终检查：`pnpm deploy:check`。它会重新验证、构建，并确认 canonical 使用当前 `SITE_URL`。

项目是 Astro `output: static`，没有 SSR adapter、数据库或常驻 Node 进程。`dist` 可以部署到任何支持静态文件和 history-independent 路径的主机。

## 2. Cloudflare Pages（参考部署）

1. 在 Cloudflare Pages 连接 Git 仓库；
2. Production branch 选择 `main`；
3. Build command 填 `pnpm build`，Build output directory 填 `dist`；
4. 设置 `NODE_VERSION=22`、真实 `SITE_URL`，按需添加 `.env.example` 中的公开 provider 变量；
5. 首次预览确认 canonical、RSS 和 sitemap 域名后再绑定自定义域名。

也可以在已授权的本机执行：

```powershell
pnpm build
pnpm dlx wrangler pages deploy dist --project-name someone-site
```

仓库的 `public/_headers` 会随产物发布，提供基础安全头和静态资源缓存策略。

## 3. GitHub Pages / 通用静态主机

CI 会上传完整 `dist` artifact。GitHub Pages 可把该 artifact 交给官方 Pages deploy action，适合用户主页仓库、自定义域名或根路径部署。当前站内 URL 以 `/` 为根；若部署到 `https://name.github.io/repository/` 子路径，应先统一实现 base path，不要只修改 Astro 的 `base`。

对 Netlify、对象存储或 Nginx，上传 `dist` 即可。确保：

- 目录 URL `/path/` 能解析到 `/path/index.html`；
- `404.html` 被配置为错误页；
- `.wasm` 或 `.pagefind` 未知扩展可作为静态二进制返回；
- XML、manifest、SVG 和 JavaScript 使用正确 MIME；
- 不重写 `rss.xml`、`robots.txt`、`llms.txt` 与 Pagefind 文件。

## 4. 评论和统计

默认 `none`，不会产生第三方请求。

- Giscus：设置 provider、公开仓库、repo/category ID；仓库必须启用 Discussions 并安装 Giscus App；
- Waline：设置 provider 和自有 server URL；服务端、数据库、审核和备份由站主管理；
- Cloudflare Web Analytics：设置 provider 和 token；
- Umami：设置 provider、脚本 URL 与 website ID。

这些脚本只进入 full/minimal 页面，`none` 构建产物保持隔离。每次更换 provider 后重新执行 `pnpm verify`，并确认隐私页显示的当前状态。

## 5. 发布、观察、回滚

先用 PR preview 检查移动端、搜索与代表文章。生产发布后检查 `/robots.txt`、`/sitemap-index.xml`、`/rss.xml` 和 `/search/`。Cloudflare Pages 可以直接回滚到先前 deployment；通用主机应保留上一版 `dist` artifact，同时在 Git 中回退有问题的提交。

## 6. 官方依据

- [Astro 部署指南](https://docs.astro.build/en/guides/deploy/)
- [Cloudflare Pages 的 Astro 指南](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)
- [GitHub Pages 自定义 Actions 工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Pagefind 部署后索引](https://pagefind.app/docs/running-pagefind/)
