# GitHub 培训登记运维

文章使用 `/posts/github-onboarding/#register`。手机和桌面均可从 `/columns/lab/` 进入。正式站访客填写 GitHub 用户名及专业、班级、姓名后触发邀请，镜像链接到正式站。学员信息可填 `计算机26-4王小明` 或 `计算机-26-4-王小明`。

## 首次上线

1. 在 GitHub 创建 [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new)。选择资源所有者 `aust-robot-ai-training`，按本次培训周期设定到期日，在组织权限里仅启用 **Members → Read and write**。邀请接口使用组织权限，不需要仓库内容权限。若 GitHub 显示待批准，先在组织后台批准。
2. 通过私有 SSH 会话，把凭据写入仅 root 可读的 `/etc/win98-onboarding/github-token`。首次配置可使用以下方式，输入时终端不回显凭据。

   ```bash
   install -d -o root -g root -m 0700 /etc/win98-onboarding
   umask 077
   read -rsp 'GitHub token: ' onboarding_token
   printf '\n'
   printf '%s\n' "$onboarding_token" > /etc/win98-onboarding/github-token
   unset onboarding_token
   ```

3. 创建专用系统用户和组 `win98onboarding`，使用 `/sbin/nologin`。把 `tools/github-onboarding/service.py` 放到 `/opt/win98-onboarding-students/service.py` 并保持 root 所有，将同目录的 `win98-onboarding-students.service` 安装至 `/etc/systemd/system/`。执行 `systemd-analyze verify /etc/systemd/system/win98-onboarding-students.service`，再加载 unit 并首次启动。检查 `curl -fsS http://127.0.0.1:18101/healthz`。
4. 将 `nginx-http.conf` 放入主 Nginx 的 `http` 上下文，当前宿主机可用 `/www/server/panel/vhost/nginx/00-win98-onboarding-limit.conf`。将 `nginx-location.conf` 放在 `/www/server/panel/vhost/nginx/proxy/win98.site/` 子目录下，使用单独文件名。用现有 Nginx 程序执行配置检查，检查通过再平滑加载。确认对登记接口发送同域 Origin 和无效输入得到预期的 JSON 4xx，普通文章仍能访问。
5. 通过现有 `publish-static` 工作流发布正式文章。从旧版迁移时，在确认新表单走 `/api/github-onboarding/register-student` 后，用 `nginx-legacy-location.conf` 替换旧登记路由配置，使旧表单提示刷新页面。测试使用模拟 GitHub 服务，如需实测发送，用培训方选定的测试账号。

## 管理名单

```bash
sudo -u win98onboarding python3 -B /opt/win98-onboarding-students/service.py export --report
sudo -u win98onboarding python3 -B /opt/win98-onboarding-students/service.py export --search example
sudo -u win98onboarding python3 -B /opt/win98-onboarding-students/service.py set-student example
```

默认导出列名为 `github_username`。`--report` 同时给出邀请状态、登记时间、专业、班级和姓名。`pending` 表示 GitHub 已确认待接受邀请，`active` 表示团队成员已生效，`retry` 表示可用同一账号重试。`set-student` 会交互式读取更正信息，保留现有邀请状态。旧登记可以通过新版表单补填学员信息。

数据库默认位于 `/var/lib/win98-onboarding/registrations.sqlite3`。学员信息按 GitHub 用户名关联，只供培训方查询和导出。使用 SQLite 在线备份保存登记数据。原托管站的 D1 记录需要单独从原后台导出并核对。

## 本地验证

```powershell
python -B -m unittest discover -s tools/github-onboarding -p 'test_*.py'
$env:SITE_URL = 'https://win98.site'
pnpm verify:all
```

测试中的邀请响应由模拟 GitHub 接口提供。
