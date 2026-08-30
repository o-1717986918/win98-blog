# 站点部署手册

## 0. 当前线上：GitHub Pages

当前首发地址是 `https://o-1717986918.github.io/win98-blog/`。`.github/workflows/github-pages.yml` 在 `main` 每次推送后构建并发布；站点以 `/win98-blog` 为 `BASE_PATH`，因此导航、图片、Pagefind、RSS、站点地图、Web Worker 与 Wasm 都必须经过统一子路径处理。

本机复现 GitHub Pages 构建：

```powershell
$env:SITE_URL='https://o-1717986918.github.io'
$env:BASE_PATH='/win98-blog'
pnpm build
Remove-Item Env:SITE_URL
Remove-Item Env:BASE_PATH
```

GitHub Pages 是当前可立即访问的公开首发渠道；下述 Cloudflare Pages 方案继续保留，作为绑定自定义域名后的生产迁移路径。迁移时把 `SITE_URL` 换成最终域名、清空 `BASE_PATH`，再完整执行生产验收。

## 1. 已选方案

生产主机采用 **Cloudflare Pages Direct Upload + GitHub Actions**。仓库自己完成测试、静态构建、Pagefind 索引和产物审计，再把已经验证的 `dist` 上传到 Pages。这样线上构建与本地/CI 使用同一条 `pnpm deploy:prepare` 契约。

暂不启用 Cloudflare 的 Git 仓库集成。Direct Upload 项目后续不能原地切换成 Git integration；若未来要切换，需要新建 Pages 项目并迁移域名。这个选择记录在 `docs/decisions/0012-reader-facing-copy-and-pages-deployment.md`。

## 2. 一次性准备

1. 在 Cloudflare 创建 API Token，权限只授予目标账号的 `Account / Cloudflare Pages / Edit`。
2. 取得 Cloudflare Account ID。
3. 登录 Wrangler，创建 Direct Upload 项目：

   ```powershell
   pnpm dlx wrangler@4.127.0 login
   pnpm dlx wrangler@4.127.0 pages project create
   ```

   项目名建议为 `someone-site`，production branch 设为 `main`。若项目已存在，跳过创建。
4. 在 GitHub 建立 `preview` 与 `production` 两个 Environment；为 `production` 配置 required reviewers，避免单人误触直接上线。
5. 在两个 Environment 或仓库中设置以下 Actions 配置。

| 类型 | 名称 | 示例/说明 |
|---|---|---|
| Variable | `SITE_URL` | 最终 HTTPS 根域名，不带尾斜杠 |
| Variable | `CLOUDFLARE_PAGES_PROJECT` | `someone-site` |
| Variable | `CLOUDFLARE_PRODUCTION_BRANCH` | `main` |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | 32 位 Account ID |
| Secret | `CLOUDFLARE_API_TOKEN` | Pages Edit token |

评论与统计变量按 `.env.example` 添加。它们会进入公开网页，不能放真正的私密凭据；Waline 数据库密钥等服务端秘密属于对应服务，不属于本仓库。

`PUBLIC_WEBMENTION_ENDPOINT` 与 `PUBLIC_PERFORMANCE_ENDPOINT` 也是可选公开地址，必须使用 HTTPS。留空时前者不写入页面，后者只在当前标签页保存一次性能样本，不产生网络请求。GitHub Pages 不能承载接收 API；需要 Webmention 或聚合现场性能时，应使用独立服务或迁移后的 Cloudflare Worker，并在隐私页公开保存边界。

## 3. 第一次发布

先复制环境文件并填写真实值：

```powershell
Copy-Item .env.example .env
pnpm deploy:prepare
```

`deploy:prepare` 会依次执行 Vitest、完整静态构建、Pagefind、链接/体积/封面审计、canonical 检查，并验证 Cloudflare 项目、账号和 token 是否齐备。它不上传任何文件。

推荐在 GitHub Actions 手动运行 `deploy-cloudflare-pages`，先选 `preview`。工作流会创建 `manual-<run number>` 预览分支并把部署 URL 写入 Job Summary。通过 `docs/operations/PRODUCTION_CHECKLIST.md` 后，再从 `main` 手动选择 `production`；非 production branch 会被工作流拒绝。

授权本机也可以执行：

```powershell
pnpm deploy:pages:preview
$env:CONFIRM_PRODUCTION='YES'
pnpm deploy:pages:production
Remove-Item Env:CONFIRM_PRODUCTION
```

生产命令没有 `CONFIRM_PRODUCTION=YES` 会主动退出。不要把确认值长期保存在 `.env`。

### 3.1 本次内容重构后的发布顺序

1. 在无外部凭据的机器上先运行 `pnpm verify`，确认内容引用、ArcVellum 十二篇手记、工具主题、Pagefind 与全部静态路由可构建。
2. 确认 `pnpm solver:smoke` 返回内置地图的 33 步识别路径。冒烟脚本还会根据 `tools/solver-wasm/solver-engine.provenance.json` 校验制品 SHA-256、源码提交与 33/191 步行为契约。`public/solver/solver-engine.wasm` 是已构建产物；只有当求解器源仓库变更时，才使用 `tools/solver-wasm/build.ps1` 重建，并同步更新溯源清单。清单中的 `compilerVersion` 只有在真实重建时才可填写，不得猜测。
3. 启动本地预览，在 390×844 与桌面视口检查首页主题抽屉、三篇近文限制、全站返回桥、ArcVellum 侧栏目录与工具主题。
4. 在求解器文章先执行“只跑识别”，再执行一次内置地图“识别 + 完整规划”。确认 Worker 期间页面仍可滚动，结果显示 191 步规划路径，“停止”能中断运行。
5. 手动部署 preview，在 preview 域名再执行第 3–4 步，特别检查 `.wasm` 返回 200 且 Worker 可同源加载。该模块不依赖 `SharedArrayBuffer`，因此不需要为它额外启用 COOP/COEP。
6. 通过 `PRODUCTION_CHECKLIST.md` 后再人工批准 production。首发后保留前一个 deployment，并立即做一次回滚演练。

## 4. 自定义域名

1. 先在 Pages 项目的 **Custom domains** 中关联域名，再修改 DNS；不要只添加 CNAME。
2. 根域名必须由 Cloudflare 托管该 zone 并使用 Cloudflare nameserver。
3. 外部 DNS 托管的子域名可在 Pages 关联后 CNAME 到 `<project>.pages.dev`。
4. 域名生效后，把 `SITE_URL` 更新为最终源站，重新跑一次 preview 和 production；检查 canonical、RSS、sitemap、OG 图片都使用最终域名。

## 5. 发布后验证与回滚

完整验收见 `docs/operations/PRODUCTION_CHECKLIST.md`。最低检查包括：首页和一篇 full/minimal/none 内容、移动端导航、Pagefind、`robots.txt`、`sitemap-index.xml`、`rss.xml`、分享图、404、评论/统计的实际网络请求。

发生问题时：

1. 在 Cloudflare Pages Deployments 中把上一个成功 deployment 设回生产；
2. 在 Git 中回退或修正问题提交；
3. 重新运行 `pnpm deploy:prepare` 和 production workflow；
4. 记录故障、影响范围和回滚 deployment URL。

Direct Upload 当前限制为单次最多 20,000 个文件、单文件最多 25 MiB。仓库的构建预算更严格，正常不会接近该边界。

## 6. 自动化策略

当前 workflow 仅允许 `workflow_dispatch`，这是首发阶段的刻意限制。完成首次上线、回滚演练和至少一次稳定发布后，才把 `main` push 加入生产触发；PR 仍由 `ci.yml` 验证，不直接获得生产权限。

## 7. 官方依据

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Direct Upload 持续集成](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Astro 部署指南](https://docs.astro.build/en/guides/deploy/)
