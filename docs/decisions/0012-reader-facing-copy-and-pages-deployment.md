# ADR 0012：公开文案与 Cloudflare Pages 发布路径

- 状态：Accepted
- 日期：2026-08-28

## 背景

站点公开页面曾直接解释静态优先、页面外壳档位、dispatcher 和搜索实现。这些内容适合工程文档，却让首页、关于页和栏目页像项目说明书。与此同时，架构差距审计已经确认生产部署仍依赖外部账号，但仓库没有一条可执行、可防误触的发布路径。

## 决策

1. 框架级公开文案从读者视角描述文章、问题、阅读线索和更新状态；实现细节只留在技术文章、隐私说明与仓库文档。
2. 采用 Cloudflare Pages Direct Upload，由仓库 GitHub Actions 上传本地验证过的 `dist`。
3. workflow 首发阶段仅手动触发；preview 使用独立分支别名，production 只接受 production branch，并建议使用 GitHub Environment 审批。
4. 本机生产命令要求临时设置 `CONFIRM_PRODUCTION=YES`；检查命令和预览命令不需要该确认。
5. Wrangler 锁定到 `4.127.0`，GitHub Action 与本机使用相同版本。

## 后果

- 公开页面不再把内部架构当作品牌文案，实际工程透明度不受影响。
- 测试、构建与索引只有一条发布前契约，降低 Cloudflare 端与本地结果不一致的风险。
- Direct Upload 项目不能原地转为 Git integration；未来若改变策略，需要新建项目并迁移域名。
- 账号、域名、DNS、token、真实评论/统计服务和生产观察仍由站主完成，仓库只提供验证与操作边界。
