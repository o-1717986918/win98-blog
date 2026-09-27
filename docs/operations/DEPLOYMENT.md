# 站点部署：Actions 静态产物到腾讯云宝塔

> 状态：2026-09-26 已完成首次生产发布与宝塔切换，2026-09-27 已完成真实文章更新。当前 release 为 `d48df26852cf909035313c44444c99f1b900f6db-36329017664-1`；旧 GHCR 容器继续在 `18098` 提供救援。公开笔记更新与无构建回滚演练尚未完成。旧 GHCR 和 Cloudflare 步骤见 `DEPLOYMENT_LEGACY.md`。

## 1. 运行结构

~~~text
GitHub main → publish-static → verify:all + Astro + Pagefind
→ site.tar.gz + SHA-256 → production Environment 审批
→ SSH 上传到 /opt/win98-static/incoming/
→ release.sh 校验、原子切换 current、回环 HTTP 冒烟
→ 只读 Nginx 127.0.0.1:18099 → 宝塔 HTTPS 反代 → win98.site
~~~

发布的事实源是当前代码仓库中的程序、文章、主题与公开学习笔记。普通文章和学习笔记更新都要完整构建网页，但服务器不运行 Git、Node、pnpm 或 Astro。`compose.yaml` 的旧 GHCR 容器可留在 `18098`，供首次切换和紧急救援。新服务使用 `compose.static.yaml`，不会覆盖旧容器。

## 2. 一次性准备：服务器

以管理员身份创建非 root、无 Docker 权限的专用部署用户（下例为 `win98deploy`），让其只拥有归档上传目录和发布数据目录。发布脚本及容器配置所在的父目录必须仍由 root 拥有，避免部署账号替换这些文件。示例命令适用于 Linux；在宝塔终端执行前，核对用户名与路径：

```bash
sudo useradd --create-home --shell /bin/bash win98deploy
sudo install -d -o root -g root -m 755 /opt/win98-static
sudo install -d -o win98deploy -g win98deploy -m 755 /opt/win98-static/incoming /opt/win98-static/releases
sudo install -d -o root -g root -m 755 /opt/win98-static/bin
sudo install -d -o root -g root -m 755 /opt/win98-static/docker
sudo install -o win98deploy -g win98deploy -m 644 /dev/null /opt/win98-static/release.lock
```

把仓库文件 `scripts/server-static-release.sh` 安装为 `/opt/win98-static/bin/release.sh`（root 拥有、权限 755）；把 `compose.static.yaml`、`docker/static-nginx.conf` 和 `docker/security-headers.conf` 放在 `/opt/win98-static/` 的同名相对位置。只在配置变更时更新这些文件；日常内容发布只传输 `site.tar.gz`。需要 Linux 的 `bash`、GNU `tar`、`sha256sum`、`flock`、`curl` 和 Docker Compose；不需要安装 Node 或 Git。

在 `/opt/win98-static/` 启动新的静态容器，默认仅监听 `127.0.0.1:18099`：

```bash
cd /opt/win98-static
docker compose -f compose.static.yaml config
docker compose -f compose.static.yaml up -d
curl -fsS http://127.0.0.1:18099/healthz
```

首次没有 `current` 时，`/healthz` 可以是 200，首页仍应为 404；首个成功版本到达后首页才会有内容。不要把静态站端口映射到 `0.0.0.0` 或直接开放防火墙。`releases/` 整个目录被只读挂进容器，不要只挂载 `current` 的当时目标，否则后续切换可能不可见。

## 3. 一次性准备：SSH 与 GitHub

为 `win98deploy` 配置只用于本机的 SSH 公钥；私钥只存于 GitHub 的 `production` Environment Secret `WIN98_DEPLOY_KEY`。服务器 SSH 防火墙只开放确需的来源，部署用户不加入 `sudo`/`docker` 组。环境变量：

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Variable | `WIN98_DEPLOY_HOST` | 服务器域名或 IPv4 地址，不带协议 |
| Variable | `WIN98_DEPLOY_USER` | `win98deploy`，或实际专用用户名 |
| Variable | `WIN98_DEPLOY_PORT` | SSH 端口；不设时为 `22` |
| Secret | `WIN98_DEPLOY_KEY` | 专用私钥全文，绝不提交到仓库 |
| Secret | `WIN98_DEPLOY_KNOWN_HOSTS` | **线下核对指纹后**保存的 OpenSSH `known_hosts` 行；非标准端口使用 `[host]:port` 格式 |

不要把未核对的 `ssh-keyscan` 输出直接当成可信指纹。GitHub `production` Environment 应限制为 `main`，按需要启用人工审批；工作流的构建 job 不读取 SSH 密钥，只有生产 deploy job 在审批后获得它。仓库变量中的评论/统计配置若启用，也会写进公开页面，只能填公开值。

## 4. 首发与宝塔切换

1. 确认 `main` 只有准备公开的文章、笔记和媒体。笔记同步现在默认只导出 `publish: true` 且非 `draft` 的文件；不要把私人 Vault 或私有草稿手工提交到公开仓库。
2. 在 GitHub **Actions → publish-static → Run workflow** 从 `main` 手动启动。构建 job 完成生产门禁、Linux 发布脚本测试和归档；deploy job 在 `production` 审批后上传并调用 `/opt/win98-static/bin/release.sh install`。
3. 记录 Job Summary 的 release ID 与归档 SHA-256。在服务器检查：

   ```bash
   sudo -u win98deploy /opt/win98-static/bin/release.sh status
   curl -fsS http://127.0.0.1:18099/release-id.txt
   curl -fsS -o /dev/null http://127.0.0.1:18099/archive/
   curl -fsS -o /dev/null http://127.0.0.1:18099/pagefind/pagefind.js
   ```

4. 打开回环预览并检查首页、文章三档、主题、公开笔记、搜索、RSS、sitemap、Wasm、404 和响应头。通过后在宝塔把 `win98.site` 的反向代理目标从 `http://127.0.0.1:18098` 改为 `http://127.0.0.1:18099`。保持 `Host` 与 `X-Forwarded-*`，继续使用现有 HTTPS 证书。
5. 公网检查 `https://win98.site/`、`/archive/`、`/notes/`、`/pagefind/pagefind.js`、`/rss.xml`、`/sitemap-index.xml` 与一个不存在的路径；最后应为真实 404。通过前不停止旧 `18098` 容器。

该工作流仍是手动触发，避免单次 `main` 推送未经站主确认就上线。日常更新只需提交内容并运行同一工作流；不重新构建 GHCR 镜像。

## 5. 回滚、故障与备份

`release.sh status` 列出当前和历史版本。回滚到已验收版本：

```bash
sudo -u win98deploy /opt/win98-static/bin/release.sh rollback <完整-release-id>
```

脚本切换后会检查本机 HTTP 的版本标记、首页、归档、Pagefind、RSS 和 sitemap。冒烟失败会恢复旧指针；归档散列、路径或关键文件错误则在切换前失败。回滚不需 Actions、GitHub 或构建。若静态容器整体故障，把宝塔反代暂时改回旧 GHCR 容器 `127.0.0.1:18098`，再查日志；不要为了修复去编辑已验收的 release 内文件。

`/opt/win98-static/releases/` 和配置文件需要服务器备份；至少保留当前与一个成功旧版。`incoming/` 的已上传归档和 GitHub workflow artifact 可按保留期清理，但不要把有保留期限的 Actions artifact 当作唯一回滚来源。共享 `releases/shared/` 保留旧页面仍引用的 `_astro` 与 Pagefind 资源；紧急撤回敏感内容时必须评估并清除旧 release、共享资源及外部缓存，此操作不能用普通回滚替代。

首次生产切换完成后，按 `PRODUCTION_CHECKLIST.md` 做一次文章更新、一次公开笔记更新和一次无构建回滚，并把真实 release ID、耗时与结果记录到站主的发布记录。记录完成前，仓库中的实现不等于线上已交付。

## 6. 旧路径

- `compose.yaml`、`publish-ghcr.yml` 与 `Dockerfile` 保留为整站镜像救援；不再是日常内容更新主线。
- GitHub Pages 的 `/win98-blog` 工作流仍是公开镜像渠道，但该产物的子路径与生产域名不同，不得上传到 `win98.site`。
- Cloudflare Pages Direct Upload 仍是更换主机时的备选，具体操作存档于 `DEPLOYMENT_LEGACY.md`。

依据：[GitHub Environment 与审批](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)、[Actions artifact 保留期](https://docs.github.com/en/actions/tutorials/store-and-share-data)、[Astro 部署](https://docs.astro.build/en/guides/deploy/)。
