# 视觉资产台账

更新日期：2026-08-29

## 取材原则

项目文章优先使用仓库中的真实界面、计算图或实际运行轨迹；只有讨论抽象设计与交互机制的文章使用生成图。生成图统一采用“纸面校样、绘图仪、丝网印刷、可见的人工修订”母题，并主动排除霓虹赛博、玻璃拟态、发光球体、光滑 3D 图标等常见生成式同质化特征。

`ContentCover.astro` 只在收到 Astro 已解析的 `ImageMetadata` 时调用图片管线。如果开发服务器因内容热更新遗留了 `./cover.png` 字符串，组件显示确定性校样图而不是抛出 `LocalImageUsedWrongly`；重启内容同步后恢复真实图片。

## 真实来源

| 内容 | 来源 |
|---|---|
| ArcVellum 发布、前端、内核、Runtime、交付、长篇调试、模块化、Beta | 本地 ArcVellum 仓库 `docs/images/` 与 `docs/assets/concepts/` 的不同版本真实界面/概念稿 |
| 推箱炸障求解器 | 实际 C99 内核的内置地图、33 步识别路径与求解目标可视化 |
| 气动弹性复现 | 复现脚本实际生成的颤振临界动压、幅值与静变形图 |
| 数学物理 Skill | 仓库 `plot_template.py` 的实际输出 |
| 博客生产闭环与栏目代表图 | 本站真实桌面渲染 |

## 生成资产与最终提示

所有资产由内置图像生成工具生成，项目内文件名保持为各内容目录的 `cover.png`。

1. **粒子场**：`wide blog header; hand-tuned computational particle field bending around an invisible attractor; deep near-black drafting grid; restrained editorial scientific art combining screen print, plotter drawing and long exposure; oxidized aqua, muted coral, pale violet and tiny gold registration marks; no text, logo, neon cyberpunk, smooth 3D blobs or centered orb.`
2. **阅读控制**：`wide editorial still life of a printed essay being tuned with translucent measure strips, movable margins, baseline grid and bookmarks; pale mist paper; contemporary editorial photography plus letterpress proofing and hand-cut collage; no readable text, screens, humans or plastic 3D icons.`
3. **主题即数据**：`wide two-state color laboratory translating the same arrangement between pale mist and deep abyss; Bauhaus color study plus analog print proof and specimen board; gouache, paper fibers and penciled measurement lines; no readable text, UI screenshot, gradient mesh or glassmorphism.`
4. **封面管线**：`wide print-room proof table translating one source image into deliberate editorial crops; contact-sheet frames, crop windows, color bars and rejected proofs; analog art-direction desk with risograph misregistration; no readable text, computers, generic UI cards or glossy 3D.`
5. **路由故障复盘**：`wide physical route map made from punched cards, colored threads, evidence stamps and one repaired junction; dark graph-paper workbench; forensic handcrafted systems diagram; no readable text, screens, glowing network sphere or cyberpunk.`
6. **首页索引抽屉**：`wide tactile editorial prototype: three broad reading sheets beside a long narrow index rail moving through a fixed transparent window; Swiss layout, paper, acetate, metal rail and crop marks; no readable text, computer screen or floating widgets.`
7. **学习笔记**：`wide living mathematical notebook system with paper notes, abstract equation linework, phase portrait, hand-drawn graphs, transparent connections and an open blank card; late-evening archival collage; no fake authoritative formulas, AI-brain graphic or neural glow.`
8. **模块博客架构**：`wide exploded architectural model made from separated paper layers for content, routing gates, shells, components and visual surface; vellum, card and metal registration pins; no readable text, screens, isometric SaaS icons or generic flowchart.`
9. **视觉重构账本**：`wide art-direction wall documenting successive physical website proofs from a crossed-out uniform draft to stronger hierarchy, asymmetry, image space and color distribution; risograph, tracing overlays, graphite strokes and worn tape; no readable text, glossy mockups or gradient blobs.`

## 审计结论

此前 27 个真实封面只对应 8 个唯一文件，其中同一张旧首页截图被复用 10 次，ArcVellum 同一截图被复用 5 次。当前每篇抽象设计文章拥有与主题一致的独立封面；ArcVellum 八篇文档使用不同阶段的真实产品图。栏目代表图允许与该栏目的一篇核心文章共享身份图，但不再以重复截图代替所有文章的视觉判断。
