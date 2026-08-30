export const PORTAL_FEATURES = {
  projects: true,
  skills: true,
  timeline: true,
  diary: false,
  albums: false,
  friends: false,
  anime: false,
  devices: false,
  aiTools: false,
  music: false,
  live2d: false,
  wallpaper: false,
} as const;

export const PORTAL_PROJECTS = [
  {
    id: 'arcvellum',
    name: 'ArcVellum',
    kind: '文学工程工作室',
    status: 'Beta / 持续开发',
    description: '面向小说、剧本与伪记录作品的本地创作系统，把长篇写作拆成可追溯、可检查的工程流程。',
    href: '/columns/arcvellum/',
    accent: 'violet',
    facts: ['12 篇工程记录', '本地优先', 'Agent Runtime'],
  },
  {
    id: 'someone-site',
    name: '某人的小站',
    kind: '静态个人出版系统',
    status: 'Online / 维护中',
    description: '基于 Astro 的模块化博客：内容集合、三档页面外壳、证据账本、公开笔记与本地 Blog Studio。',
    href: '/columns/blog-development/',
    accent: 'aqua',
    facts: ['Astro 7', 'Static-first', 'Blog Studio'],
  },
  {
    id: 'sokoban-solver',
    name: '推箱炸障求解器',
    kind: 'C99 / WebAssembly 求解系统',
    status: '可交互验证',
    description: '将识别、推箱、推弹炸障和状态回滚组织成两阶段规划器，并在浏览器中运行真实 Wasm 内核。',
    href: '/posts/sokoban-two-phase-solver/',
    accent: 'coral',
    facts: ['C99', 'Wasm Worker', '完整回放'],
  },
  {
    id: 'knowledge-notes',
    name: '公开知识笔记',
    kind: '本地知识关系系统',
    status: 'Growing',
    description: '从本地知识库显式发布笔记，在构建期解析 Wiki 链接、成熟度、正向关系和反向引用。',
    href: '/notes/',
    accent: 'gold',
    facts: ['双向关系', '显式发布', '静态可读'],
  },
] as const;

export const PORTAL_SKILLS = [
  {
    name: '内容架构',
    scope: 'Astro · MDX · Content Collections',
    description: '以类型化内容、真实 URL 和静态构建组织长文、主题与学习笔记。',
    evidence: '/columns/blog-development/',
    accent: 'aqua',
  },
  {
    name: '交互可视化',
    scope: 'Canvas · PixiJS · WebGL',
    description: '让图形交互承担解释任务，同时保留无动效和无脚本情况下的可读路径。',
    evidence: '/columns/lab/',
    accent: 'violet',
  },
  {
    name: '求解系统',
    scope: 'C99 · Wasm · Worker',
    description: '把状态空间、规划、超时中断和轨迹回放组合成可在浏览器复查的工程系统。',
    evidence: '/posts/sokoban-two-phase-solver/',
    accent: 'coral',
  },
  {
    name: '证据化交付',
    scope: '测试 · 审计 · ADR · CI',
    description: '把“完成了”改写为可以复查的构建产物、性能预算、决策记录和浏览器测试。',
    evidence: '/notes/evidence-ledgers/',
    accent: 'gold',
  },
] as const;

export const PORTAL_MILESTONES = [
  {
    date: '2026-08-30',
    title: '个人门户结构进入生产首页',
    description: '保留技术出版视觉，将作者、笔记、写作时间流、发表日历和内容发现重组为响应式门户。',
    href: '/',
    kind: 'SITE',
  },
  {
    date: '2026-08-29',
    title: 'ArcVellum 工程地图形成连续文章组',
    description: '上下文、模块图、叙事投影与 Agent Runtime 从内部实现整理成可公开复查的系列记录。',
    href: '/columns/arcvellum/',
    kind: 'WRITING',
  },
  {
    date: '2026-08-28',
    title: 'ArcVellum Beta 闭环完成',
    description: '以真实场景、正文规模和发布门禁为证据，完成从生成实验到可维护产品的阶段总结。',
    href: '/posts/arcvellum-release/',
    kind: 'PROJECT',
  },
  {
    date: '2026-08-27',
    title: 'Astro 模块化博客架构定稿',
    description: '确立内容主体、加法外壳、full/minimal/none 分级和文章自包含目录。',
    href: '/posts/modular-blog/',
    kind: 'DECISION',
  },
] as const;

export type PortalAccent = 'aqua' | 'coral' | 'violet' | 'gold';
