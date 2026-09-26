# ADR-0021：Actions 构建静态产物，服务器只验收并切换

- 状态：已接受；代码已实现，生产切换待站主配置与演练
- 日期：2026-09-19
- 取代：ADR-0019 的日常“整站镜像随内容重建”发布方式；ADR-0019 的镜像保留为救援路径
- 备选：ADR-0020 的“内容仓库 + 服务器 builder”不删除，但不再是默认施工路线

## 背景

本站是 Astro 静态站。文章、主题、公开学习笔记、首页、Pagefind、RSS、sitemap 和 OG 图均在构建期形成。现有 GHCR 工作流把 `dist` 放进每次重建的 Nginx 镜像；单篇内容更新也要推拉整个镜像。CI 虽已有 `dist` artifact，但使用预览域名且仅短期保留，不能作为 `win98.site` 的生产版本。

## 决定

1. 源码、普通文章、主题与公开学习笔记暂留在现有仓库；本次不创建内容仓库或公网管理后台。本地 Blog Studio 继续只负责编辑，不直接向生产服务器写文件。
2. 独立 `publish-static` 工作流只从 `main` 手动触发，以 `SITE_URL=https://win98.site`、`BASE_PATH=/`、`PREVIEW_DRAFTS=false` 执行现有 `pnpm deploy:check`，包括 `verify:all`、Astro、Pagefind 与产物审计。构建失败不得访问部署凭据。
3. Actions 仅打包验证后的 `dist`，记录源码 SHA、run/attempt 与归档 SHA-256；生产 Environment 授权后，使用固定 SSH 主机指纹把归档送到服务器的专用 incoming 目录。服务器不拉取源码、不安装 Node/pnpm、不运行 Astro build。
4. 宿主机非特权发布脚本校验 release ID、归档散列、路径、文件类型、体积与必需页面，然后在同文件系统创建版本目录，原子切换 `current`；本机 HTTP 冒烟失败时恢复旧指针。回滚只选择已验收的旧版本，不重新构建。
5. 新的只读 Nginx 容器挂载整个 releases 根，默认监听宿主机回环 `18099`；原 GHCR 容器可留在 `18098` 作切换和救援。宝塔 HTTPS 反代完成站主侧验收后才改指向 `18099`。
6. 已打开旧网页引用的 `/_astro/` 与 Pagefind 资产保存在 releases 下的共享兼容目录；不得把该目录误认为可自动清理。涉及隐私撤回时，必须同时处理旧 release、兼容资产和任何外部缓存。
7. 笔记同步默认只物化明确公开且非草稿的笔记与附件，避免私人 Vault 内容进入公开 Git 仓库。普通文章、主题和特殊 MDX 仍按现有源码信任边界审查。

## 后果

内容或程序变更仍需一次完整静态构建，但消耗的是 GitHub runner，不再重建生产镜像或占用服务器构建资源。日常生产发布仍依赖 Git 提交与 GitHub Actions；浏览器直写数据库不在本 ADR 范围内。服务器必须持久备份 releases 与部署配置，GitHub workflow artifact 的有限保留期不能代替服务器回滚版本。

生产切换前，新增工作流和脚本只代表“可部署实现”，不能描述为线上已启用。必须由站主配置受限 SSH 身份、已核验的 `known_hosts`、GitHub production Environment、宝塔反代、首发与回滚演练，并记录真实发布证据。
