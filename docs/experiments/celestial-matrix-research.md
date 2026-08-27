# Celestial Matrix 实验检索与方向探索

日期：2026-08-28

## 检索目标

寻找不依赖“暗色渐变 + 玻璃卡片 + 霓虹粒子”的实验视觉语言，同时保留原版与观测、记录、实验有关的局部主题。检索范围包括古代天文制图、博物馆编辑设计、生成式视觉和交互星图。该研究不定义正式站名或生产主线。

## 关键启发

### 天文制图不是“星空背景”

1247 年苏州石刻天文图以极强的结构表达天空：同心圆、放射分区、二十八宿、星点与密集注释共同构成知识地图。它提供的不是浪漫夜空，而是一套可阅读、可测量的视觉语法。People's Graphic Design Archive 的资料记载该图包含 1,434 颗星与 280 个星官；Wikimedia Commons 提供了拓片图像参考。

### 系统可以同时严谨和实验

Design Museum 对 Wim Crouwel 的回顾强调了网格方法、模块化字形与实验排版之间的关系：严格系统并不等于中性模板，系统本身可以成为识别度。其对《Fractured Lands》的介绍也证明，克制、书籍化、章节式的大型排版可以承载长篇阅读。

### 生成艺术应体现可变规则

NASA Scientific Visualization Studio 和 D3 Celestial 的案例说明，有价值的天文视觉来自坐标、对象、层级与交互，而不是随机装饰。生成式部分应由文章类别、阅读位置和指针输入驱动，使变化可解释。

## 三个候选方向

### A. Celestial Matrix / 位相星图界面（实验采用）

冷灰复合材料、碳黑、光谱钴蓝、信号橙与高能黄。主视觉是一套由 Canvas 2D 实时绘制的坐标界面：同心刻度、放射扇区、确定性数据点、拓扑连线与测量十字。古代星图只提供几何结构来源，成品不使用仿古纹理、古典术语或古籍排版。

记忆点：指针像观测镜一样扭曲局部坐标；滚动让星图缓慢换相，文章分类点亮对应扇区。

风险：容易退回“古风纸张”。修正：不用暖米色、毛笔字、仿古边框、泛黄纹理和古典文案，改用冷工业色、现代无衬线、实时读数和异常尺度。

### B. 光学实验台

铝灰、黑、警示橙和干涉紫；所有模块像光具座上的滑块和标尺。交互非常工程化，适合技术博客，但人文气质不足，也容易接近高端硬件官网。

### C. 天文排字机

以生成式汉字切片和可变字重为主，文章标题在滚动时被重新排版。冲击力强，但中文字体跨平台一致性和长文可读性风险过高。

## 选定方案的设计计划

### 色彩令牌

- 实验室灰 `#DDE1DB`：主背景，接近复合材料与仪器面板；
- 碳墨 `#11120F`：正文与星图主线；
- 光谱钴 `#1438FF`：结构、链接和大面积章节色；
- 信号橙 `#FF3D16`：当前状态与关键操作；
- 高能黄 `#E8FF4F`：数据高亮；
- 氧化灰 `#74776F`：次要标注。

### 字体角色

- 展示：`Arial Black / Microsoft YaHei UI`，使用超粗、压缩和异常尺度；
- 正文：`Inter / Microsoft YaHei / Noto Sans SC`，保持现代技术文档的清晰度；
- 界面：`Arial Narrow / Bahnschrift / Microsoft YaHei UI`，紧凑、明确；
- 数据：`Cascadia Mono / IBM Plex Mono / monospace`。

### 布局草图

```text
┌─────────────────────────────────────────────────────────────┐
│ INDEX / 时间 / 模式                 文章  实验  关于  [观测] │
├──────┬────────────────────────────────────┬─────────────────┤
│ 文   │                                    │ ISSUE / 004     │
│ 枢   │        活体星图版画 Canvas         │ 当前星官 / 坐标 │
│ 手   │                                    │ 图例 / 操作     │
│ 记   │                                    │                 │
├──────┴────────────────────────────────────┴─────────────────┤
│ 日期 / 分类  巨型文章标题                       图版编号     │
│ 日期 / 分类  巨型文章标题                       图版编号     │
├─────────────────────────────────────────────────────────────┤
│ LAB：整屏星图仪 / 指针成为观测镜                           │
└─────────────────────────────────────────────────────────────┘
```

### 唯一签名

“位相星图界面”是本实验的唯一大型艺术效果。该结论只适用于实验，不适用于博客主线；它不得作为首页 hero、全站内容导航或品牌轴线直接迁移。

## 自我审查

- 该方案采用实验室面板和技术编辑排版；冷灰、强钴蓝、数据刻度和交互坐标场使其不同于常见的暖米色杂志模板。
- 无圆角卡片、无渐变背景、无荧光玻璃；高辨识度来自内容主题本身。
- 大胆之处集中在竖排巨字与可操纵星图；正文列表和阅读层保持安静。
- 所有视觉效果都能在减弱动效、无 Canvas 或移动端情况下退化为可读结构。

## 参考来源

- [A Map of the Stars — People's Graphic Design Archive](https://peoplesgdarchive.org/item/15859/a-map-of-the-stars-tian-wen-tu-tien-wen-tu)
- [Soochow Planisphere — Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Soochow_Planisphere.jpg)
- [Wim Crouwel — Design Museum](https://designmuseum.org/designers/wim-crouwel)
- [Fractured Lands — Design Museum](https://designmuseum.org/exhibitions/beazley-designs-of-the-year/graphics-20xx/fractured-lands-the-new-york-times-magazine)
- [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/)
- [D3 Celestial](https://github.com/ofrohn/d3-celestial)
