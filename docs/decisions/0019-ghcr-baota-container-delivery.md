# ADR-0019：GHCR 与宝塔容器交付

- 状态：已接受
- 日期：2026-08-31

## 背景

站点准备迁移到站主自租服务器和宝塔面板。Astro 输出是静态文件，但 `SITE_URL` 会在构建期写入 canonical、RSS、sitemap、分享图与结构化数据，因此“服务器启动时再注入域名”不适用于当前静态架构。直接在服务器拉取源码构建还会扩大服务器权限、工具链和故障面。

## 决定

1. GitHub Actions 在生产门禁通过后构建单一 `linux/amd64` OCI 镜像，并发布到 `ghcr.io/o-1717986918/win98-blog`。服务器只拉取镜像，不持有仓库写权限、Node.js 或 pnpm。
2. GHCR 发布初期仅允许从 `main` 手动触发，并强制输入最终 HTTPS 根域名。每次发布生成不可变 `sha-<commit>` 标签；只有人工选择时才推进可变 `stable` 标签。
3. 工作流用仓库内置 `GITHUB_TOKEN` 写入 GHCR，不新增长期 GitHub 发布密钥；镜像附带 OCI 元数据、SBOM 和 GitHub build provenance attestation。
4. 镜像使用多阶段构建并以 digest 固定基础镜像。Node 阶段用 Noto CJK 字体生成跨平台完整分享图；运行阶段使用非 root Nginx，只监听容器 `8080`，带健康检查、静态路由 404、缓存与安全响应头。
5. 宝塔通过 `compose.yaml` 运行镜像：容器文件系统只读、移除全部 capabilities、禁止提权、限制资源，并仅把端口绑定到宿主机 `127.0.0.1:18098`。公网流量只能经宝塔 Nginx 的域名、TLS 和反向代理进入。
6. `stable` 用于日常更新，`sha-<commit>` 用于审计和确定性回滚。生产记录必须保存镜像 digest；紧急回滚应把 `WIN98_TAG` 改为上一个 SHA 标签，而不是重新构建旧源码。
7. GHCR 包按站主决定保持 public，以便宝塔匿名拉取和一键更新，不在服务器保存 GitHub PAT。公开化不可逆；如果未来需要私有交付，必须删除并重建包或改用新包名，不能把原包直接转回 private。
8. GitHub Pages 保留为迁移期间的公开渠道；Docker 自托管稳定并完成回滚演练前，不删除现有 Pages workflow。

## 后果

同一提交可以因 `SITE_URL` 或公开 provider 配置不同而产生不同镜像，因此 digest 才是最终制品身份，SHA 标签只是源码定位。正式域名未确定时只能做本地容器验证，不能发布或推进生产 `stable`。服务器不再承担编译，但仍需要负责 Docker/宝塔升级、TLS、备份、日志、可用性监测和私有 GHCR 凭据轮换。
