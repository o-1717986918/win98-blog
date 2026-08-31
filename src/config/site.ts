export const SITE = {
  title: 'win98的小站',
  description: '记录 Web 架构、图形学、阅读与工程实践的个人博客。',
  author: '某人',
  github: 'https://github.com/o-1717986918',
  language: 'zh-CN',
  defaultTheme: 'mist',
  defaultOgImage: '/og-default.svg',
} as const;

export const PROFILE = {
  role: 'AUTHOR / BUILDER',
  bio: '在文学工程、可视化交互、求解系统与个人知识工具之间持续做项目。',
  focus: 'ArcVellum · Blog Studio · 求解器',
  links: [
    { label: 'GitHub', detail: 'o-1717986918', href: SITE.github, external: true },
    { label: '关于', detail: '个人与网站', href: '/about/', external: false },
    { label: 'RSS', detail: '订阅文章', href: '/rss.xml', external: false },
  ],
} as const;

export const THEMES = ['mist', 'abyss'] as const;
export type ThemeId = (typeof THEMES)[number];

export const resolveTheme = (theme: ThemeId | null | undefined): ThemeId =>
  theme ?? SITE.defaultTheme;

export const CHROME_LEVELS = ['full', 'minimal', 'none'] as const;
export type ChromeLevel = (typeof CHROME_LEVELS)[number];
