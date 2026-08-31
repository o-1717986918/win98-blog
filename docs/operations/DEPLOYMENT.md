# 站点部署手册

## 0. 当前线上：GitHub Pages

当前首发地址是 `https://o-1717986918.github.io/win98-blog/`。`.github/workflows/github-pages.yml` 在 `main` 每次推送后构建并发布；站点以 `/win98-blog` 为 `BASE_PATH`，因此导航、图片、Pagefind、RSS、站点地图、Web Worker 与 Wasm 都必须经过统一子路径处理。

本机复现 GitHub Pages 构建：

```powershell
$env:SITE_URL='https://o-1717986918.github.io'
$env:BASE_PATH='/win98-blog'
pnpm verify:all
Remove-Item Env:SITE_URL
Remove-Item Env:BASE_PATH
```

GitHub Pages 是当前可立即访问的公开首发渠道；自租服务器的目标路径改为下述 **GitHub GHCR + 宝塔 Docker Compose**。Cloudflare Pages 继续作为不自托管时的备选方案。迁移时把 `SITE_URL` 换成最终域名、把 `BASE_PATH` 设为 `/`，再完整执行生产验收。

`public/_headers` 会随产物发布，但 GitHub Pages 不解释该文件；当前安全响应头必须在真实承载层另行核验，不能把仓库文件存在当作线上已生效。

## 1. 目标生产路径：GHCR + 宝塔 Docker

### 1.1 架构与门禁

`.github/workflows/publish-ghcr.yml` 只允许在 `main` 手动执行。它接收最终 `site_url`，先运行 `pnpm deploy:check`，再构建 `linux/amd64` 镜像、写入 SBOM 和 build provenance、推送 `sha-<commit>` 与可选 `stable` 标签，最后从 GHCR 重新拉取并以生产安全参数启动冒烟容器。

镜像地址固定为：

```text
ghcr.io/o-1717986918/win98-blog
```

`SITE_URL` 是静态产物的一部分，不是容器启动参数。正式域名变更时必须重新发布镜像，不能只改宝塔反向代理。工作流使用 `GITHUB_TOKEN` 写包，不需要创建 GitHub 发布 PAT；只有服务器拉取私有包时才需要只读 PAT。

本机完整复现容器交付：

```powershell
docker version
docker compose version
pnpm container:verify
```

`container:verify` 会用测试 HTTPS origin 构建镜像，以只读文件系统、无 capabilities、回环随机端口启动 Nginx，并验证健康检查、首页 canonical、归档、笔记、Pagefind、Wasm、缓存头、安全头和真实 404。它不推送镜像。

### 1.2 第一次 GHCR 发布

1. 先确定正式域名，例如 `https://blog.example.cn`，不要带路径或尾斜杠。
2. 在 GitHub 仓库进入 **Actions → publish-ghcr → Run workflow**，分支选择 `main`，填写 `site_url`，首次保持 `publish_stable=true`。
3. 等待 `Verify, publish and smoke-test` 全绿，在 Job Summary 保存镜像 digest 与 `sha-<commit>` 标签。
4. 新建 GHCR 包默认是 private。两种拉取方式二选一：
   - 保持 private：为服务器创建仅含 `read:packages` 的 classic PAT，用 `docker login ghcr.io` 保存；
   - 需要匿名一键拉取：在包的 **Package settings → Change visibility → Public** 手工公开。公开后不能再改回 private。
5. 不要把 PAT 写入仓库、Compose 或宝塔站点配置。若使用私有包，PAT 只保存在服务器 Docker credential store，并定期轮换。

### 1.3 宝塔一键运行与反向代理

在服务器创建专用目录（例如 `/opt/win98-blog`），只放仓库中的 `compose.yaml` 和下列 `.env`：

```dotenv
WIN98_IMAGE=ghcr.io/o-1717986918/win98-blog
WIN98_TAG=sha-替换为已验收的提交
WIN98_PORT=18098
```

在宝塔“Docker → Compose”导入该目录，或在目录中执行：

```bash
docker compose config
docker compose pull
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:18098/healthz
```

Compose 只把容器 `8080` 映射到宿主机 `127.0.0.1:18098`。不要改为 `0.0.0.0`，也不要开放 18098 防火墙端口。随后在宝塔创建纯静态/反向代理站点：

1. 绑定最终域名；
2. 反向代理目标填写 `http://127.0.0.1:18098`；
3. 申请证书并强制 HTTPS；
4. 保留原始 `Host`、`X-Real-IP`、`X-Forwarded-For` 与 `X-Forwarded-Proto`；
5. 访问公网 `/healthz`、首页、`/archive/`、`/pagefind/pagefind.js` 和一个不存在的地址，确认分别为 200、200、200、200、404。

### 1.4 更新、固定版本与回滚

日常生产不要长期依赖可变 `stable`。在 GitHub 发布并验收新镜像后，把服务器 `.env` 的 `WIN98_TAG` 改为对应 `sha-<commit>`，再执行：

```bash
docker compose pull
docker compose up -d
docker image prune -f
```

只有站点健康且人工验收通过后才清理旧镜像。回滚时把 `WIN98_TAG` 改回发布记录中的上一个 SHA 标签，重复 `pull` 和 `up -d`；不重新构建旧源码。`docker image prune -f` 只清理未使用镜像，不应在回滚前执行。

## 2. Cloudflare Pages 备选迁移方案

计划中的自定义域名主机采用 **Cloudflare Pages Direct Upload + GitHub Actions**。仓库自己完成测试、静态构建、Pagefind 索引、浏览器回归和产物审计，再把已经验证的 `dist` 上传到 Pages。这样迁移后的线上构建与本地/CI 使用同一条 `pnpm deploy:prepare` 契约。

暂不启用 Cloudflare 的 Git 仓库集成。Direct Upload 项目后续不能原地切换成 Git integration；若未来要切换，需要新建 Pages 项目并迁移域名。这个选择记录在 `docs/decisions/0012-reader-facing-copy-and-pages-deployment.md`。

## 3. Cloudflare 一次性准备

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

## 4. Cloudflare 第一次发布

先复制环境文件并填写真实值：

```powershell
Copy-Item .env.example .env
pnpm deploy:prepare
```

`deploy:prepare` 会依次执行 Vitest、完整求解器冒烟、静态构建、Pagefind、链接/锚点/体积/封面审计、Playwright 浏览器回归、canonical 检查，并验证 Cloudflare 项目、账号和 token 是否齐备。它不上传任何文件。

推荐在 GitHub Actions 手动运行 `deploy-cloudflare-pages`，先选 `preview`。工作流会创建 `manual-<run number>` 预览分支并把部署 URL 写入 Job Summary。通过 `docs/operations/PRODUCTION_CHECKLIST.md` 后，再从 `main` 手动选择 `production`；非 production branch 会被工作流拒绝。

授权本机也可以执行：

```powershell
pnpm deploy:pages:preview
$env:CONFIRM_PRODUCTION='YES'
pnpm deploy:pages:production
Remove-Item Env:CONFIRM_PRODUCTION
```

生产命令没有 `CONFIRM_PRODUCTION=YES` 会主动退出。不要把确认值长期保存在 `.env`。

### 4.1 本次内容重构后的发布顺序

1. 在无外部凭据的机器上先运行 `pnpm verify:all`，确认内容引用、ArcVellum 十四篇手记、工具主题、Pagefind、全部静态路由与浏览器连接行为通过。
2. 确认 `pnpm solver:smoke` 返回内置地图的 33 步识别路径。冒烟脚本还会根据 `tools/solver-wasm/solver-engine.provenance.json` 校验制品 SHA-256、源码提交与 33/191 步行为契约。`public/solver/solver-engine.wasm` 是已构建产物；只有当求解器源仓库变更时，才使用 `tools/solver-wasm/build.ps1` 重建，并同步更新溯源清单。清单中的 `compilerVersion` 只有在真实重建时才可填写，不得猜测。
3. 启动本地预览，在 390×844 与桌面视口检查首页三栏阅读顺序、侧栏分层展开、底部重点文章、全站返回桥、ArcVellum 目录与工具主题。
4. 在求解器文章先执行“只跑识别”，再执行一次内置地图“识别 + 完整规划”。确认 Worker 期间页面仍可滚动，结果显示 191 步规划路径，“停止”能中断运行。
5. 手动部署 preview，在 preview 域名再执行第 3–4 步，特别检查 `.wasm` 返回 200 且 Worker 可同源加载。该模块不依赖 `SharedArrayBuffer`，因此不需要为它额外启用 COOP/COEP。
6. 通过 `PRODUCTION_CHECKLIST.md` 后再人工批准 production。首发后保留前一个 deployment，并立即做一次回滚演练。

## 5. Cloudflare 自定义域名

1. 先在 Pages 项目的 **Custom domains** 中关联域名，再修改 DNS；不要只添加 CNAME。
2. 根域名必须由 Cloudflare 托管该 zone 并使用 Cloudflare nameserver。
3. 外部 DNS 托管的子域名可在 Pages 关联后 CNAME 到 `<project>.pages.dev`。
4. 域名生效后，把 `SITE_URL` 更新为最终源站，重新跑一次 preview 和 production；检查 canonical、RSS、sitemap、OG 图片都使用最终域名。

## 6. 发布后验证与回滚

完整验收见 `docs/operations/PRODUCTION_CHECKLIST.md`。最低检查包括：首页和一篇 full/minimal/none 内容、移动端导航、Pagefind、`robots.txt`、`sitemap-index.xml`、`rss.xml`、分享图、404、评论/统计的实际网络请求。

发生问题时：

1. 在 Cloudflare Pages Deployments 中把上一个成功 deployment 设回生产；
2. 在 Git 中回退或修正问题提交；
3. 重新运行 `pnpm deploy:prepare` 和 production workflow；
4. 记录故障、影响范围和回滚 deployment URL。

Direct Upload 当前限制为单次最多 20,000 个文件、单文件最多 25 MiB。仓库的构建预算更严格，正常不会接近该边界。

## 7. 自动化策略

GHCR 与 Cloudflare 生产 workflow 均只允许 `workflow_dispatch`，这是首发阶段的刻意限制。完成首次上线、回滚演练和至少一次稳定发布后，才评估把 `main` push 加入镜像发布触发；PR 仍由 `ci.yml` 验证，不直接获得生产权限。

## 8. 官方依据

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Direct Upload 持续集成](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Cloudflare Pages 自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [Astro 部署指南](https://docs.astro.build/en/guides/deploy/)
- [GitHub：发布 Docker 镜像](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images)
- [GitHub Packages 权限与可见性](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)
- [NGINX Unprivileged 官方镜像](https://github.com/nginx/docker-nginx-unprivileged)
