# ADR-0022 · 实验栏目 GitHub 培训登记

- 状态：已接受，生产后端已验证
- 日期：2026-11-15
- 关联：ADR-0021

教程以独立文章归入实验栏目。图文、截图和交互与文章共置，随 Astro 预渲染构建。生产表单只调用同域的 `POST /api/github-onboarding/register`。静态镜像引导学员到正式站点填写。

宝塔 Nginx 将精确匹配的登记路径转给宿主机回环服务，并按来源 IP 和全站分别限流。访客提交 GitHub 用户名即可登记。服务使用 SQLite 记录登记，并直接调用原批量工具使用的 GitHub 团队接口。重复提交先读取现有成员状态，GitHub 确认后页面提示访客登录所填账号查看邀请。邀请目标固定为 `aust-robot-ai-training/training-2026`，角色为 `member`。接受邀请后获得团队现有的作业仓库写权限。

凭据由 systemd 从主机私有文件提供。登记名单与成员状态由培训方经 SSH 查询和导出。数据库与静态文章版本分别备份和发布。

部署与发码见 [GitHub 培训登记运维](../operations/GITHUB_ONBOARDING.md)。
