# UI 重构 V3：有景深的知识工作室

状态：Approved for implementation  
日期：2026-08-28

## 1. 对 V2 的否定

V2 正确地减少了卡片、徽标和重复入口，却把“克制”误做成了扁平：大量细线与透明背景只表达结构，没有表达可点击性；Canvas 只有稀疏点线，没有前中后景；搜索、标签各自占用页面，反而让信息架构显得像功能清单。

## 2. 开放检索后的可迁移原则

- Maxime Heckel 的博客以文章为稳定骨架，把互动 playground、可视化和图形技术用于真正需要解释的内容；借鉴“高强度视觉服务于内容”，不复制作品集首页。
- Maggie Appleton 让 Essays、Notes、Patterns 以不同结构呈现；借鉴“内容路径应由结构表达”，但继续遵守本站栏目与文章外壳互不推导的约束。
- Rauno Freiberg 与 Emil Kowalski 的个人站强调细微、即时、可逆的交互反馈；借鉴触感，不借鉴信息极少的作品集构造。
- Linear 2026 视觉复盘提出核心任务优先、结构应被感知而非被分隔线反复画出；据此减少一级入口与边框，改用层级、材质、遮挡和运动表达结构。
- Codrops 的 DOM + Canvas/WebGL 混合案例证明视觉背景可以与传统 HTML 内容并存；采用混合层，不将文本和导航放入 Canvas。
- Pagefind 官方提供可锁定焦点的模态搜索与自定义 API；搜索改为全局覆盖层，由导航按钮、`/` 或 `Ctrl/⌘ K` 唤起。独立 `/search/` 只保留为兼容入口，不再作为主导航目的地。

参考：

- https://blog.maximeheckel.com/
- https://maggieappleton.com/
- https://raunofreiberg.me/
- https://emilkowal.ski/
- https://linear.app/now/behind-the-latest-design-refresh
- https://tympanus.net/codrops/2022/01/05/crafting-scroll-based-animations-in-three-js/
- https://pagefind.app/docs/components/modal/
- https://pagefind.app/docs/api/

## 3. 选定方案：有景深的知识工作室

### 信息架构

- 主导航仅保留：首页、文章、栏目、关于；搜索是动作，不是地点。
- 首页移除搜索、标签、归档、RSS 四块等权“快速入口”。归档和 RSS 以低权重文本动作出现。
- 标签不再拥有一级入口；归档页提供即时文本过滤和主题过滤，文章上的标签仍可形成深链接。
- `/search/` 与 `/tags/` 保留向后兼容和可链接性，但从主浏览路径退出。

### 三层视觉空间

1. 背景层：原 Canvas 点线继续存在，新增透视网格、远近粒子、三组缓慢漂移的光学体和指针视差。
2. 内容层：普通文章流保持清晰、平静，使用轻微材质变化与彩色边缘提示交互。
3. 焦点层：最新文章成为唯一“悬浮阅读台”，具备实体阴影、背板错位、指针微倾斜和明确的进入动作。

### 交互边界

- 仅焦点卡使用 3D 倾斜；列表只做小幅位移和材质变化，避免全站漂浮。
- 指针视差最大 2°，不影响点击命中；触屏禁用倾斜。
- `prefers-reduced-motion`、页面隐藏、手动暂停继续停止动态；Canvas DPR 上限 2，帧率目标约 30 FPS。
- 视觉层全部 `pointer-events: none`，语义与键盘操作仍由 HTML 承担。

## 4. 验收

- 首屏能完整看到最新文章主标题及进入动作；
- 所有主要可点击模块仅凭静态画面也可被识别；
- 搜索在任意 full 页面可用，支持键盘关闭、焦点返回与本地 Pagefind 索引；
- 归档内可按文本和主题筛选，不必先去标签总页；
- 1280×720 与 390×844 无横向溢出；
- Canvas 保留且显著增强，低动态偏好下仍提供静态景深；
- `none` 与 `minimal` 的隔离原则不受影响。
