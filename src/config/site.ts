export const SITE = {
  title: '某人的小站',
  description: '记录 Web 架构、图形学、阅读与工程实践的个人博客。',
  author: '某人',
  language: 'zh-CN',
  defaultTheme: 'paper',
  defaultOgImage: '/og-default.svg',
} as const;

export const THEMES = ['graphite', 'paper', 'night', 'indigo'] as const;
export type ThemeId = (typeof THEMES)[number];

export const CHROME_LEVELS = ['full', 'minimal', 'none'] as const;
export type ChromeLevel = (typeof CHROME_LEVELS)[number];
