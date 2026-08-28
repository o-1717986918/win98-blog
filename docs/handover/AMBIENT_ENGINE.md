# 背景与开屏引擎

更新日期：2026-08-28

## 视觉结论

正式站不采用全屏油膜、液态波或高饱和四色光场。它们适合作品集的短时展示，但会在个人博客的长时阅读中形成持续竞争。当前方案是雾色底上的离散微粒：静止时只提供空气景深，鼠标移动会牵引附近粒子并留下短暂动量，点击或触摸会产生局部散射；正文区域的响应系数降为普通区域的 28%。离子蓝与铜橙构成独立的冷暖双主色，分别承担技术信号和阅读行动；用户提供的头像只作为品牌识别图，不参与色板取样或主题推导。

灵感与技术取舍来自以下公开案例和文档：

- [Akaru WebGL 案例](https://tympanus.net/codrops/2019/12/30/case-study-akaru-2019/)说明了 DOM 内容与 WebGL 背景分层、鼠标速度驱动和 GPU 交互的实现方式；本站保留其“局部反馈”原则，但放弃持续流体纹理。
- [Codrops 水面扰动教程](https://tympanus.net/codrops/2019/10/08/creating-a-water-like-distortion-effect-with-three-js/)展示了用低分辨率交互纹理控制涟漪；本站评审后确定博客背景不使用波纹，只保留点击触发的离散粒子散射。
- [Talk to Dasha 设计评述](https://onepagelove.com/dasha)强调个人站的互动趣味应当克制，不让动画盖过内容。
- [PixiJS Application](https://pixijs.com/8.x/guides/components/application)与 [Ticker](https://pixijs.com/8.x/guides/components/application/ticker-plugin)文档作为当前实现依据。

## 工程实现

- `AmbientField.astro`：CSS 静态降级、暂停按钮、主题/可见性/系统减弱动态联动；
- `pixi-field.ts`：按需动态载入 PixiJS、粒子生成、景深、指针牵引、点击散射和资源销毁；
- `SiteIntro.astro` + `intro-particles.ts`：只在首页出现、每个浏览器会话播放一次；约 6.8 秒主体叙事以粒子从视口边缘聚合成站名，完成光学显影后散入主页。可用按钮、`Esc` 或 `Enter` 跳过，`?intro=1` 可供设计复核时强制重播；
- `public/brand/logo.jpg`：用户提供的原始品牌图，统一用于站点导航、开屏、favicon 与 web manifest，不经裁色或自动取色；
- 系统开启 `prefers-reduced-motion`、用户主动暂停或页面进入后台时，Ticker 停止；CSS 与最后一帧仍维持基本背景；
- 移动端降低粒子数、设备像素比与最大帧率；桌面最大 36 FPS，移动端最大 28 FPS。
- 开屏播放期间正式背景 Ticker 暂停，避免两个粒子系统同时占用 GPU；开屏结束后再恢复互动背景。

PixiJS 是异步视觉增强，不改变静态 HTML 的可读性。构建预算按实际网络传输的 gzip 体积审计：单个 JavaScript 资产不超过 75 KiB gzip，全站 JavaScript 不超过 180 KiB gzip。

## Wallpaper Engine 兼容边界

“Wallpaper Engine 动态壁纸文件”不是一种统一的浏览器格式，必须按项目类型区分：

| 类型 | 浏览器直接渲染 | 处理方式 |
|---|---|---|
| Web 壁纸源码（HTML/CSS/JS 与 `project.json`） | 有条件支持 | 在拥有合法源码时迁移资源与入口；为 Wallpaper Engine 专用全局 API 加兼容适配 |
| 视频壁纸 | 有条件支持 | 提供或导出为浏览器支持且有使用权的 MP4/WebM 后，以 `<video>` 作为可选背景源 |
| Scene 壁纸、编辑器工程或 Workshop `.pkg` | 不支持 | 依赖 Wallpaper Engine 的场景运行时、材质/着色器图与 SceneScript；需取得源工程后人工转换，或导出为视频 |

依据：[Web 壁纸入门](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html)、[Web 属性 API](https://docs.wallpaperengine.io/en/web/api/propertylistener.html)、[Web 壁纸性能与 FPS](https://docs.wallpaperengine.io/en/web/performance/fps.html)。项目当前没有通用 Wallpaper Engine 导入器；在用户提供具体且有权使用的源文件前，不猜测文件结构，也不把 `.pkg` 当作普通网页资源。
