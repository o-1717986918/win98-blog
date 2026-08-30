---
title: 静态优先不是拒绝交互
description: 默认交付可阅读 HTML，把脚本、第三方服务和运行时状态限制在确有价值的局部。
created: 2026-08-30
updated: 2026-08-30
tags: [Astro, 架构, 发布]
aliases: [Static First, 静态发布]
publish: true
source: manual/static-first-publishing.md
maturity: evergreen
relations: [welcome, evidence-ledgers]
---

静态优先的判断单位不是整站，而是每一种能力。正文、导航、关系和发现路径可以在构建期确定；主题切换、阅读恢复、求解器与图谱操作则由局部脚本获得运行时能力。

## 三条判断线

1. 没有 JavaScript 时，核心内容是否仍可阅读和链接？
2. 交互是否带来了静态 HTML 无法提供的真实价值？
3. 外部服务未配置或失败时，构建和阅读是否仍成立？

因此静态优先并不排斥复杂交互，它要求复杂度先证明自己的必要性。测试、链接检查和资源预算提供[证据账本](../evidence-ledgers/)所需的可复查结果；[公开笔记系统](../welcome/)也只同步明确公开的内容，而不把整个私人 Vault 变成运行时数据库。
