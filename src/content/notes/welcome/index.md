---
title: 学习笔记现在怎样工作
description: 公开站只读，本机维护平台负责导入、编辑、检查与发布；未显式公开的笔记不会出现在博客。
created: 2026-08-29
updated: 2026-08-29
tags: [知识库, Blog Studio]
aliases: [笔记系统说明]
publish: true
source: manual/welcome.md
---

学习笔记已经从“主题”迁移为真正的内容模块。它和文章共享静态构建、搜索与链接检查，但拥有自己的元数据、URL 和同步入口。

## 边界

- 公开网页只读，不在访客浏览器里伪装成云端编辑器。
- 本机 `Blog Studio` 可以创建、编辑、预览和检查笔记。
- 本地 Vault 只有显式写入 `publish: true` 或 `blog: true` 的笔记才进入公开列表。
- 附件随笔记复制；基础 `[[双向链接]]` 会转换为站内笔记链接。

## 使用

运行 `pnpm studio` 后，在“笔记同步”中选择或填写本地 Vault 目录，先执行预览同步，再确认写入。也可以直接运行：

```powershell
pnpm notes:sync -- --source "C:\path\to\vault" --dry-run
pnpm notes:sync -- --source "C:\path\to\vault"
```

同步清单会记录源相对路径、目标 slug、公开状态和复制附件数，不把本机绝对路径发布到站点。
