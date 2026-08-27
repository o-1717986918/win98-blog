# ADR-0003：将“Celestial Matrix / 位相星图界面”限制为文章类型实验

状态：Superseded for mainline / Retained as experiment

日期：2026-08-28

## 背景

原原型采用深空渐变、发光粒子、玻璃模糊和矿物色强调。一次视觉探索据此创建了 Celestial Matrix，但它把概念界面放到了博客主轴位置，弱化了个人博客应有的内容组织与阅读关系。

## 决策

- Celestial Matrix 不作为博客主品牌语言、首页结构或主线视觉验收基线；
- 完整实现移入 `experiments/celestial-matrix/`，仅用于验证 `full`、`minimal`、`none` 三档文章类型及其切换、返回和无外壳体验；
- 实验的颜色、排版、Canvas 或概念文案不得默认进入主线；只有被主线研究与设计审查独立证明合理的局部能力，才可重新实现；
- 主线重构必须以 `docs/source/blog-architecture.md` 的确定性结论为上位约束，从 `prototype/index.html` 的副本开始，保留博客基本结构和原版设计哲学。

## 后果

优点：保留已完成的高保真探索和三档文章实验价值，同时阻止实验概念绑架个人博客的信息架构与品牌身份。

代价：主线视觉需要重新研究和实现；实验与生产会暂时并存，必须在文档、命令和验收中持续区分。
