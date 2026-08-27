# 文枢手记

这是从 `C:\Users\26532\.zcode\workspace\default` 接手后建立的独立工作区。源目录保持不动；原始架构文档与单文件原型以相同内容迁入本仓库，并用 SHA-256 固定了接手基线。

## 当前状态

- 当前可运行资产是零依赖单文件原型，不是 Astro 工程。
- 正式实现目标调整为 Astro 7、静态输出优先、MDX Content Collections。
- 原型只承担视觉与交互验收基线；正式工程不得沿用 hash 路由或单文件应用结构。
- 接手盘点、计划审查、设计审查、原则和 ADR 已落在 `docs/`。

## 目录

```text
.
├── AGENTS.md                         # 代理和开发者的仓库级规则
├── prototype/index.html              # 原样迁入的可运行原型
├── docs/source/blog-architecture.md  # 原样迁入的历史架构方案
├── docs/handover/                    # 接手现状、审查与实施计划
├── docs/decisions/                   # 架构决策记录（ADR）
└── scripts/                          # 零依赖校验与原型预览
```

## 快速开始

要求 Node.js 22.12 或更高版本，推荐使用仓库声明的 pnpm 版本。

```powershell
pnpm check
pnpm preview:prototype
```

然后访问 `http://127.0.0.1:8765/`。端口冲突时可先设置 `PORT`：

```powershell
$env:PORT = '9000'
pnpm preview:prototype
```

## 文档权威顺序

1. 当前用户需求与已接受的 ADR；
2. `docs/handover/PRINCIPLES.md` 与 `AGENTS.md`；
3. `docs/handover/TAKEOVER_PLAN.md`；
4. `docs/source/blog-architecture.md`（历史输入，不再是未经审查的唯一依据）；
5. `prototype/index.html`（视觉和交互参考，不是生产架构范本）。

下一阶段从 `docs/handover/TAKEOVER_PLAN.md` 的 Gate 1 开始：初始化 Astro 7 骨架，并先做原型等价迁移，不接第三方服务。
