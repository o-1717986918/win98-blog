# 生产发布检查表

这份清单把仓库内已完成的工程能力与必须由站主提供的外部状态分开。每次正式上线复制一份到发布记录，并填写 deployment URL、提交 SHA、执行人和时间。

## A. 账号与资产（站主）

- [ ] 当前 GitHub Pages 仓库、发布源和 `github-pages` Environment 已启用；若迁移 Cloudflare，再完成以下两项 Cloudflare 准备。
- [ ] （仅 Cloudflare）Direct Upload 项目已创建，项目名与 `CLOUDFLARE_PAGES_PROJECT` 一致，API Token 只有 Pages Edit 权限。
- [ ] （仅 Cloudflare）`preview` / `production` Environment 已建立，production 有审批保护。
- [ ] 域名、续费联系人、DNS 控制权与回滚责任人已记录在凭据管理器。
- [ ] Logo、头像、文章/主题真实封面的版权与署名信息已确认；暂缺内容接受使用确定性默认封面。

## B. 构建门禁（自动）

- [ ] `pnpm install --frozen-lockfile` 成功。
- [ ] `pnpm deploy:prepare` 成功。
- [ ] GitHub CI 和目标发布 workflow 的 `verify:all` 全绿。
- [ ] `dist` 内无 `example.com` 或 `localhost` canonical，RSS 与 sitemap 指向 `SITE_URL`。
- [ ] 没有草稿、未来日期内容或失效的主题引用意外进入生产。

## C. Preview 验收（人工）

- [ ] 首页开场可跳过，减弱动态开启时不会强行动画。
- [ ] 首页重点文章、右侧封面、鼠标响应和移动端紧凑版正常。
- [ ] 主题纵向滚动框可用键盘、触控和滚轮浏览，末端内容可达。
- [ ] “继续阅读”只显示三篇，主题条目封面没有被挤压变形。
- [ ] 从主题、搜索和文章间进入页面后，返回桥能回到原上下文；外部直达时回到首页。
- [ ] mist 与 abyss 均有足够对比度，没有旧主题残留。
- [ ] `/archive/`、`/tags/`、侧栏/移动端搜索与 404 均可用。
- [ ] 各抽查一篇 full、minimal、none；none 没有站点 Header/Footer/全站脚本污染。
- [ ] 正文目录、代码、图表、窄屏长词和真实封面裁切正常。
- [ ] 求解器 `.wasm` 与 Worker 均返回 200；识别路径为 33 步；完整模式返回 191 步内置地图路径；运行中页面不卡顿，“停止”可终止 Worker。

## D. 域名与发现

- [ ] 在 Pages Custom domains 先关联域名，再完成 DNS。
- [ ] HTTPS 证书有效，HTTP 正确跳转到 HTTPS，主机名策略唯一。
- [ ] `/robots.txt`、`/sitemap-index.xml`、`/rss.xml`、`/llms.txt` 返回 200 和正确 MIME。
- [ ] canonical、Open Graph、Twitter Card 与 JSON-LD 都使用最终生产域名。
- [ ] 在实际主机响应中核验 CSP、nosniff、Referrer-Policy 等安全头；GitHub Pages 不会应用仓库 `_headers`。
- [ ] 至少用一个真实分享抓取器验证首页、文章和主题 PNG 分享图。

## E. 可选服务与隐私

- [ ] 若启用评论：真实域名下可加载、发布和失败降级，权限/审核/备份策略已建立。
- [ ] 若启用统计：只产生预期域名请求，不收集未声明的数据。
- [ ] 若启用性能接收端点：仅接收路径、LCP、CLS、最长交互延迟样本与时间；CORS、保存期限和删除策略已配置。
- [ ] 若启用 Webmention：文章 head 中端点正确，来源核验、滥用过滤、删除和备份流程可用。
- [ ] `/privacy/` 展示的 provider 状态与实际构建一致。
- [ ] 评论或统计未启用时，网络面板中没有对应第三方请求。

## F. 生产观察与回滚

- [ ] 桌面与至少一台真实移动设备完成烟雾测试。
- [ ] 记录初始 LCP、CLS 与交互延迟样本；接入真实用户聚合后检查移动/桌面各自的 75 分位目标。
- [ ] 检查真实设备字体回退、低性能设备粒子开销与系统减弱动态。
- [ ] 已确认上一个稳定 deployment，可在 Pages 控制台完成回滚。
- [ ] 完成一次非事故回滚演练，并记录恢复时间。
