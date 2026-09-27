# 静态产物发布：执行与验收计划

> 路线：已选择并于 2026-09-26 投入生产。首次构建、传输、服务器激活与公网切换，以及 2026-09-27 的真实文章更新均已验收；公开笔记更新与回滚演练仍待完成。以 ADR-0021 为长期契约。

## 1. 目标与边界

一次文章、主题或公开学习笔记更新，只提交当前仓库，手动运行 `publish-static`。GitHub Actions 用真实生产域名构建并验证完整 `dist`；腾讯云服务器只接收压缩产物、校验并切换静态目录。日常发布不重建 GHCR 整站镜像，也不在服务器执行 Astro/Node/Git。

这不是“无构建发布”或“前端后台发布”。Blog Studio 仍只绑定站主电脑；特殊 MDX、Astro、JS、Wasm 随可信源码在 Actions 中构建。数据库 CMS 和服务器 builder 分别留作以后单独评估及 ADR-0020 备选。

## 2. 模块与事实源

| 模块 | 当前落点 | 责任 |
| --- | --- | --- |
| 内容与程序 | `src/content/` 和源码 Git 仓库 | 文章、主题、仅公开笔记、共置媒体、特殊页面的事实源 |
| 本地编辑 | `tools/blog-studio/` | 编辑、预览和公开笔记同步；不持有服务器凭据 |
| 构建与门禁 | `.github/workflows/publish-static.yml` | 固定生产 URL，执行 `pnpm deploy:check`，打包 `dist`、SHA-256 与短期 workflow artifact |
| 传输与准入 | GitHub `production` Environment、SSH | 经审批后仅上传到 `/opt/win98-static/incoming/` 并调用固定发布脚本 |
| 版本切换 | `scripts/server-static-release.sh` | 校验、原子切换、HTTP 冒烟、回滚、状态查询 |
| 读者服务 | `compose.static.yaml`、`docker/static-nginx.conf` | 只读挂载 releases；宝塔继续负责 TLS 与公网反代 |
| 救援 | 现有 `compose.yaml` 和 GHCR 镜像 | 保持旧容器 `18098`，不在切换当天删除 |

## 3. 一次发布的完整路径

~~~text
站主本地编辑 → Git commit/push → Actions 手动 publish-static
→ main 限制 + 生产域名 verify:all → dist 归档与 SHA-256
→ production Environment 审批 → SSH 上传 incoming
→ 宿主机校验并新建 release → current 原子切换
→ 127.0.0.1:18099 冒烟 → 宝塔 HTTPS 反代继续提供页面
~~~

服务器只持有 `incoming/`、`releases/`、发布脚本、Compose 和 Nginx 配置。运行中的 Web 容器没有 SSH 密钥、Git、Node、Docker Socket 或写权限。`release-id.txt` 公开显示当前版本，`release.json` 留在站点目录外记录版本与散列。

`publish-static` 保持手动触发；首次上线与一次真实文章发布已经通过，待公开笔记发布和回滚演练通过后，再决定是否在 `main` push 后自动运行。任何 GitHub artifact 都只是传输与短期调试材料，服务器至少保留当前版和一个已验收旧版。

## 4. 本地完成条件

- `pnpm verify` 与 `pnpm verify:all` 通过，生产 URL 构建检查正常；
- Linux 发布脚本测试覆盖成功安装、散列/软链接错误不切换、首次及后续冒烟失败恢复、旧资产保留、拒绝回滚失败版本和无构建回滚；
- `docker compose -f compose.static.yaml config` 可解析；当前本机没有可用的 Docker daemon，静态 Nginx 的实际启动、响应头和缓存行为留到服务器验收；
- 笔记同步测试证明私人/草稿正文与附件不进入 `src/content/notes`；
- 新 workflow 不复用预览域名的 CI artifact，也不复用 GitHub Pages 的子路径产物。

## 5. 站主侧上线条件

1. 在服务器安装 `/opt/win98-static/`、发布脚本与静态 Compose；配置受限部署用户，不给 Docker 或 root 权限。
2. 在 GitHub 配置 `production` Environment 的 `main` 分支限制和审批，写入专用 SSH 私钥与人工核对过指纹的 `known_hosts`，配置主机、用户和端口变量。
3. 先保持旧 GHCR 容器在 `18098`，启动静态容器在 `18099`；执行一次 `publish-static`，通过本机 `/release-id.txt`、首页、归档、Pagefind、RSS、sitemap 与 404 检查。
4. 修改宝塔反代到 `127.0.0.1:18099`，核验 HTTPS、缓存和安全头。旧容器不立刻删除。
5. 发布一篇普通文章改动和一篇公开笔记改动/新增，核验首页、笔记关系、搜索、RSS 与 sitemap；再回滚到上一 release 并恢复新版。

外部凭据和生产 DNS 不在本仓库内。首次证据为 Actions run `36223564941`、release `62829ea11d347877c39f4eb1ae568a65860de5ce-36223564941-1`；真实文章更新证据为 Actions run `36329017664`、release `d48df26852cf909035313c44444c99f1b900f6db-36329017664-1`。逐条服务器命令见 `docs/operations/DEPLOYMENT.md`。完成公开笔记更新与回滚演练后，再把剩余上线条件标记为关闭。
