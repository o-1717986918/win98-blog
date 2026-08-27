# 迁移清单

迁移时间：2026-08-28（Asia/Shanghai）

源目录：`C:\Users\26532\.zcode\workspace\default`

目标仓库：`C:\Users\26532\Documents\Codex\2026-08-28\c-users-26532-zcode-workspace-default\outputs\wenshu-blog`

## 文件映射

| 源文件 | 目标文件 | 字节 | 行数 | SHA-256 |
|---|---|---:|---:|---|
| `blog/index.html` | `prototype/index.html` | 73,881 | 1,166 | `EAEC426E652D79529649AFBC2EA4126E5E073F5C958B29C7A92C1A95C40B8AC9` |
| `blog-architecture.md` | `docs/source/blog-architecture.md` | 20,593 | 347 | `7C598CB0A1E7D722818975DA653EEB1AFF3828054B0E0C9FD32AABFED3FEF99E` |

## 迁移约束

- 源目录无 `.git`，没有可迁移的提交历史。
- 两个源文件采用复制方式迁入，内容哈希保持一致。
- 源目录未被修改、移动或删除。
- 新增的接手文档、脚本和仓库元数据只存在于目标工作区。
- `pnpm check` 会验证两个源资产的哈希和接手文档是否齐全。
