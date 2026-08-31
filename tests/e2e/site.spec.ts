import { expect, test, type Page } from '@playwright/test';

const basePath = process.env.BASE_PATH ? `/${process.env.BASE_PATH.replace(/^\/+|\/+$/gu, '')}` : '';
const sitePath = (path: string) => `${basePath}${path}` || '/';
const visit = (page: Page, path: string) => page.goto(sitePath(path));

function rejectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

test('homepage intro is escapable and desktop content stays inside the viewport', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await visit(page, '/?intro');
  await expect(page.locator('[data-site-intro]')).toBeVisible();
  await expect(page.locator('.site-header')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-site-intro]')).toBeHidden({ timeout: 2500 });
  await expect(page.locator('.site-header')).not.toHaveAttribute('inert', '');
  await expect(page.locator('#main-content')).toBeFocused();
  await expect(page.locator('.spotlight')).toBeVisible();
  const copyBox = await page.locator('.spotlight-main').boundingBox();
  const coverBox = await page.locator('.spotlight [data-content-cover]').boundingBox();
  expect(coverBox?.x ?? 0).toBeGreaterThan(copyBox?.x ?? Infinity);
  await page.locator('.spotlight').hover({ position: { x: 420, y: 120 } });
  await expect(page.locator('.spotlight')).toHaveAttribute('data-pointer', 'true');
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, spotlight: document.querySelector('.spotlight')?.getBoundingClientRect().height ?? 0 }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.spotlight).toBeGreaterThan(220);
  expect(dimensions.spotlight).toBeLessThan(320);
  const headerAlignment = await page.evaluate(() => {
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    const content = document.querySelector('.home-page')?.getBoundingClientRect();
    const search = document.querySelector('.header-search')?.getBoundingClientRect();
    return {
      railBeforeContent: (header?.right ?? Infinity) <= (content?.left ?? 0),
      railTop: header?.top ?? Infinity,
      railBottomDelta: Math.abs((header?.bottom ?? 0) - innerHeight),
      searchInsideRail: (search?.left ?? -1) >= (header?.left ?? 0) && (search?.right ?? Infinity) <= (header?.right ?? 0),
    };
  });
  expect(headerAlignment.railBeforeContent).toBe(true);
  expect(headerAlignment.railTop).toBe(0);
  expect(headerAlignment.railBottomDelta).toBeLessThan(1);
  expect(headerAlignment.searchInsideRail).toBe(true);
  await page.locator('.explore-menu > summary').click();
  await expect(page.locator('.explore-menu .column-menu__panel')).toBeVisible();
  const flyoutAlignment = await page.evaluate(() => {
    const rail = document.querySelector('.site-header')?.getBoundingClientRect();
    const panel = document.querySelector('.explore-menu .column-menu__panel')?.getBoundingClientRect();
    const summary = document.querySelector('.explore-menu > summary')?.getBoundingClientRect();
    return {
      insideRail: (panel?.left ?? -1) >= (rail?.left ?? 0) && (panel?.right ?? Infinity) <= (rail?.right ?? 0),
      nestedBelowSummary: (panel?.top ?? 0) >= (summary?.bottom ?? Infinity) - 1,
    };
  });
  expect(flyoutAlignment.insideRail).toBe(true);
  expect(flyoutAlignment.nestedBelowSummary).toBe(true);
  await page.locator('.explore-menu > summary').click();
  const portalGrid = await page.evaluate(() => ({
    spotlightHeight: document.querySelector('.spotlight')?.getBoundingClientRect().height ?? Infinity,
    spotlightTop: document.querySelector('.spotlight')?.getBoundingClientRect().top ?? 0,
    portalBottom: document.querySelector('.home-portal')?.getBoundingClientRect().bottom ?? Infinity,
    notesTop: document.querySelector('.notes-feature')?.getBoundingClientRect().top ?? 0,
    notesLeft: document.querySelector('.notes-feature')?.getBoundingClientRect().left ?? 0,
    notesWidth: document.querySelector('.notes-feature')?.getBoundingClientRect().width ?? 0,
    notesBottom: document.querySelector('.notes-feature')?.getBoundingClientRect().bottom ?? Infinity,
    profileLeft: document.querySelector('[data-profile-card]')?.getBoundingClientRect().left ?? 0,
    profileWidth: document.querySelector('[data-profile-card]')?.getBoundingClientRect().width ?? 0,
    profileTop: document.querySelector('[data-profile-card]')?.getBoundingClientRect().top ?? 0,
    profileBottom: document.querySelector('[data-profile-card]')?.getBoundingClientRect().bottom ?? Infinity,
    topicsTop: document.querySelector('.portal-topics')?.getBoundingClientRect().top ?? 0,
    streamLeft: document.querySelector('.writing-stream')?.getBoundingClientRect().left ?? 0,
    streamRight: document.querySelector('.writing-stream')?.getBoundingClientRect().right ?? Infinity,
    streamWidth: document.querySelector('.writing-stream')?.getBoundingClientRect().width ?? 0,
    streamTop: document.querySelector('.writing-stream')?.getBoundingClientRect().top ?? 0,
    rightLeft: document.querySelector('.portal-right')?.getBoundingClientRect().left ?? 0,
    rightTop: document.querySelector('.portal-right')?.getBoundingClientRect().top ?? 0,
    streamCount: document.querySelectorAll('[data-home-post-stream] > li').length,
    topicCount: document.querySelectorAll('.portal-topics li').length,
  }));
  expect(portalGrid.spotlightHeight).toBeLessThan(300);
  expect(portalGrid.spotlightTop).toBeGreaterThan(portalGrid.portalBottom);
  expect(portalGrid.streamLeft).toBeGreaterThan(portalGrid.profileLeft + portalGrid.profileWidth);
  expect(portalGrid.notesLeft).toBeGreaterThan(portalGrid.streamRight);
  expect(portalGrid.streamWidth).toBeGreaterThan(portalGrid.profileWidth * 1.8);
  expect(Math.abs(portalGrid.profileTop - portalGrid.notesTop)).toBeLessThan(1);
  expect(Math.abs(portalGrid.streamTop - portalGrid.notesTop)).toBeLessThan(1);
  expect(portalGrid.rightLeft).toBeGreaterThanOrEqual(portalGrid.notesLeft);
  expect(portalGrid.rightTop).toBeGreaterThanOrEqual(portalGrid.notesBottom);
  expect(portalGrid.topicsTop).toBeGreaterThanOrEqual(portalGrid.profileBottom);
  expect(portalGrid.streamCount).toBeGreaterThan(6);
  expect(portalGrid.topicCount).toBeGreaterThan(0);
  await expect(page.locator('[data-publication-calendar]')).toBeVisible();
  await expect(page.locator('.notes-feature')).toBeVisible();
  await expect(page.locator('.portal-gateway')).toHaveCount(0);
  await expect(page.getByText('站内入口', { exact: true })).toHaveCount(0);
  const noteTab = page.locator('[data-note-mode]').first();
  await noteTab.focus();
  await noteTab.press('ArrowRight');
  await expect(page.locator('[data-note-mode]').nth(1)).toBeFocused();
  await expect(page.locator('[data-note-mode]').nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-note-panel="links"]')).toBeVisible();
  await expect(page.locator('[data-note-panel="note"]')).toBeHidden();
  assertNoErrors();
});

test('theme switch exposes only mist and abyss', async ({ page }) => {
  await page.addInitScript(() => { localStorage.removeItem('someone-site:theme'); sessionStorage.setItem('someone-site:intro-seen:v4', 'true'); });
  await visit(page, '/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mist');
  await expect(page.locator('[data-theme-name]')).toHaveText('MIST');
  await page.locator('[data-theme-button]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'abyss');
  await expect(page.locator('[data-theme-name]')).toHaveText('ABYSS');
  await page.locator('[data-theme-button]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mist');
});

test('core navigation remains usable when browser storage is unavailable', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
      Object.defineProperty(Storage.prototype, method, { configurable: true, value: () => { throw new Error('storage disabled'); } });
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, '/');
  await expect(page.locator('[data-site-intro]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-site-intro]')).toBeHidden({ timeout: 2500 });
  const menu = page.locator('[data-menu-button]');
  await menu.click();
  await expect(page.locator('[data-navigation-shell]')).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await page.locator('[data-portal-open]').click();
  await expect(page.locator('[data-portal-dialog]')).toBeVisible();
  assertNoErrors();
});

test('portal preferences persist and the publication calendar filters the writing stream', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    sessionStorage.setItem('someone-site:intro-seen:v4', 'true');
    if (!sessionStorage.getItem('someone-site:portal-test-cleaned')) {
      localStorage.removeItem('someone-site:portal-preferences:v1');
      sessionStorage.setItem('someone-site:portal-test-cleaned', 'true');
    }
  });
  await visit(page, '/');
  await expect(page.locator('[data-stream-item]:visible')).toHaveCount(6);
  await page.locator('[data-stream-more]').click();
  await expect(page.locator('[data-stream-item]:visible')).toHaveCount(12);

  const calendarDay = page.locator('[data-calendar-date]').first();
  const date = await calendarDay.getAttribute('data-calendar-date');
  expect(date).toBeTruthy();
  const matching = await page.locator(`[data-stream-item][data-post-date="${date}"]`).count();
  await calendarDay.click();
  await expect(page.locator('[data-stream-item]:visible')).toHaveCount(matching);
  await expect(calendarDay).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-stream-reset]').click();
  await expect(page.locator('[data-stream-item]:visible')).toHaveCount(6);

  await page.locator('[data-portal-open]').click();
  await page.getByRole('checkbox', { name: /发现索引/ }).uncheck();
  await page.getByRole('radio', { name: /紧凑/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-portal-density', 'compact');
  await page.getByRole('button', { name: '关闭门户显示设置' }).click();
  await expect(page.locator('.portal-tags')).toBeHidden();
  await page.reload();
  await expect(page.locator('.portal-tags')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-portal-density', 'compact');
  assertNoErrors();
});

test('header brand returns home while profile, writing and notes keep their portal columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('someone-site:intro-seen:v4', 'true'));
  await visit(page, '/');
  await expect(page.getByRole('link', { name: 'win98的小站 · 返回首页' })).toHaveAttribute('href', sitePath('/'));
  await expect(page.locator('[data-profile-dialog]')).toHaveCount(0);
  const card = page.locator('[data-profile-card]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('link', { name: '查看某人的个人介绍' })).toHaveAttribute('href', sitePath('/about/'));
  await expect(card.getByRole('navigation', { name: '个人链接' }).getByRole('link')).toHaveCount(3);
  await expect(page.locator('.site-navigation > a[href$="/notes/"]')).toHaveCount(0);
  await page.locator('.explore-menu > summary').click();
  await expect(page.locator('.explore-menu').getByRole('link', { name: /学习笔记/ })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('[data-profile-card]');
    const portrait = card?.querySelector<HTMLImageElement>('.profile-card__portrait img');
    const notes = document.querySelector<HTMLElement>('.notes-feature');
    const stream = document.querySelector<HTMLElement>('.writing-stream');
    const box = portrait?.getBoundingClientRect();
    const cardBox = card?.getBoundingClientRect();
    const notesBox = notes?.getBoundingClientRect();
    const streamBox = stream?.getBoundingClientRect();
    return {
      width: box?.width ?? 0,
      height: box?.height ?? 0,
      cardRight: cardBox?.right ?? Infinity,
      cardTop: cardBox?.top ?? 0,
      streamLeft: streamBox?.left ?? 0,
      streamRight: streamBox?.right ?? Infinity,
      streamTop: streamBox?.top ?? Infinity,
      notesLeft: notesBox?.left ?? 0,
      notesTop: notesBox?.top ?? Infinity,
    };
  });
  expect(Math.abs(geometry.width - geometry.height)).toBeLessThan(1);
  expect(geometry.width).toBeGreaterThanOrEqual(90);
  expect(geometry.width).toBeLessThan(180);
  expect(geometry.cardRight).toBeLessThanOrEqual(geometry.streamLeft);
  expect(geometry.streamRight).toBeLessThanOrEqual(geometry.notesLeft);
  expect(Math.abs(geometry.cardTop - geometry.notesTop)).toBeLessThan(1);
  expect(Math.abs(geometry.streamTop - geometry.notesTop)).toBeLessThan(1);
});

test('mobile portal keeps its reading order and the bottom spotlight retains a legible cover', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem('someone-site:intro-seen:v4', 'true'));
  await visit(page, '/');
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    spotlight: document.querySelector('.spotlight')?.getBoundingClientRect().height ?? 0,
    spotlightTop: document.querySelector('.spotlight')?.getBoundingClientRect().top ?? 0,
    cover: document.querySelector('.spotlight [data-content-cover]')?.getBoundingClientRect().height ?? 0,
    portalBottom: document.querySelector('.home-portal')?.getBoundingClientRect().bottom ?? Infinity,
    notesTop: document.querySelector('.notes-feature')?.getBoundingClientRect().top ?? Infinity,
    profileBottom: document.querySelector('[data-profile-card]')?.getBoundingClientRect().bottom ?? Infinity,
    profileTop: document.querySelector('[data-profile-card]')?.getBoundingClientRect().top ?? Infinity,
  }));
  expect(layout.width).toBeLessThanOrEqual(390);
  expect(layout.spotlight).toBeLessThan(520);
  expect(layout.cover).toBeGreaterThanOrEqual(150);
  expect(layout.cover).toBeLessThanOrEqual(230);
  expect(layout.spotlightTop).toBeGreaterThan(layout.portalBottom);
  expect(layout.notesTop).toBeGreaterThan(layout.profileBottom);
  await expect(page.locator('[data-search-input]')).toBeVisible();
  assertNoErrors();
});

test('key visual systems reflow at the WCAG reference width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => sessionStorage.setItem('someone-site:intro-seen:v4', 'true'));
  for (const path of ['/', '/archive/', '/posts/theme-as-data/', '/notes/', '/columns/arcvellum/', '/projects/', '/skills/', '/timeline/']) {
    await visit(page, path);
    const reflow = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.right > innerWidth + .5 || rect.left < -.5)
        .slice(0, 8)
        .map(({ element, rect }) => `${element.tagName.toLowerCase()}.${element.className || '(no-class)'} [${rect.left.toFixed(1)}, ${rect.right.toFixed(1)}]`),
    }));
    expect(reflow.width, `${path}: ${reflow.offenders.join('; ')}`).toBeLessThanOrEqual(320);
    if (path === '/notes/') await expect(page.getByRole('link', { name: '返回博客', exact: true })).toBeVisible();
  }
});

test('feature pages expose real projects, evidence-backed skills and a filterable timeline', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/projects/');
  await expect(page.getByRole('heading', { name: '项目 陈列' })).toBeVisible();
  expect(await page.locator('.portal-record').count()).toBeGreaterThan(0);
  await expect(page.locator('.portal-feature-grid').getByRole('heading', { name: 'ArcVellum', exact: true })).toBeVisible();
  await visit(page, '/skills/');
  await expect(page.getByRole('heading', { name: '能力 图谱' })).toBeVisible();
  expect(await page.locator('.portal-record').count()).toBeGreaterThan(0);
  await visit(page, '/timeline/');
  const timelineCount = await page.locator('[data-timeline-item]:visible').count();
  expect(timelineCount).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'PROJECT', exact: true }).click();
  const projectCount = await page.locator('[data-timeline-item]:visible').count();
  expect(projectCount).toBeGreaterThan(0);
  expect(projectCount).toBeLessThan(timelineCount);
  await expect(page.locator('[data-timeline-filter="PROJECT"]')).toHaveAttribute('aria-pressed', 'true');
  assertNoErrors();
});

test('archive exposes year and month chronology while filtering whole groups', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/archive/');
  await expect(page.locator('[data-archive-ledger]')).toBeVisible();
  await expect(page.locator('[data-archive-year]').first()).toBeVisible();
  await expect(page.locator('[data-archive-month]').first()).toBeVisible();
  const initialCount = await page.locator('[data-post-row]').count();
  expect(initialCount).toBeGreaterThan(0);
  await page.locator('[data-post-search]').fill('不可能匹配的归档文章');
  await expect(page.locator('[data-filter-status]')).toHaveText('当前显示 0 篇文章');
  await expect(page.locator('[data-archive-year]').first()).toBeHidden();
  await page.locator('[data-post-search]').fill('');
  await expect(page.locator('[data-archive-year]').first()).toBeVisible();
  await expect(page.locator('[data-post-row]:visible')).toHaveCount(initialCount);
  assertNoErrors();
});

test('search discovers articles and public notes', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/search/');
  await page.locator('[data-search-input]').fill('双向链接');
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  await expect(page.locator('[data-search-results] a[href*="/notes/"]').first()).toBeVisible();
  assertNoErrors();
});

test('chrome levels keep their isolation contracts', async ({ page }) => {
  const cases = [
    ['/posts/theme-as-data/', true, true, true, false],
    ['/posts/reader-control/', false, false, true, true],
    ['/posts/particle-field/', false, false, false, true],
    ['/columns/engineering/', true, true, false, false],
    ['/notes/', false, false, false, false],
    ['/columns/lab/', false, false, false, true],
  ] as const;
  for (const [path, header, footer, reader, back] of cases) {
    await visit(page, path);
    await expect(page.locator('.site-header')).toHaveCount(header ? 1 : 0);
    await expect(page.locator('.site-footer')).toHaveCount(footer ? 1 : 0);
    await expect(page.locator('[data-reader-controls]')).toHaveCount(reader ? 1 : 0);
    await expect(page.locator('.back-badge')).toHaveCount(back ? 1 : 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('learning notes workbench filters real entries and switches relationship view', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/notes/');
  await expect(page.locator('[data-note-workbench]')).toBeVisible();
  const noteCount = await page.locator('.garden-list [data-note-entry]').count();
  expect(noteCount).toBeGreaterThan(0);
  await expect(page.locator('[data-preview-maturity]').first()).not.toHaveText('—');
  await page.locator('[data-note-search]').fill('不可能匹配的笔记');
  await expect(page.locator('[data-note-empty]')).toBeVisible();
  await expect(page.locator('[data-visible-count]')).toHaveText('0');
  await page.locator('[data-note-search]').fill('');
  await page.locator('[data-note-view="map"]').click();
  await expect(page.locator('[data-map-view]')).toBeVisible();
  await expect(page.locator('[data-index-view]')).toBeHidden();
  await expect(page.locator('[data-map-view] svg line').first()).toBeVisible();
  await expect(page.locator('[data-map-view] > a')).toHaveCount(noteCount);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  assertNoErrors();
});

test('evidence, open-web semantics and shell-scoped telemetry ship together', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/posts/modular-blog/');
  await expect(page.locator('article.h-entry')).toHaveCount(1);
  await expect(page.locator('[data-evidence-ledger]')).toBeVisible();
  await expect(page.locator('script[data-performance-vitals]')).toHaveCount(1);
  expect(await page.evaluate(() => document.fonts.load('600 16px "Site Signature"', 'win98的小站').then((fonts) => fonts.length))).toBeGreaterThan(0);

  await visit(page, '/about/');
  await expect(page.locator('.h-card')).toHaveCount(1);

  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page, '/posts/arcvellum-release/');
  await expect(page.locator('[data-evidence-ledger]')).toBeVisible();
  await expect(page.locator('script[data-performance-vitals]')).toHaveCount(0);
  const order = await page.evaluate(() => ({
    imageTop: document.querySelector('.arc-doc__hero figure')?.getBoundingClientRect().top ?? Infinity,
    titleTop: document.querySelector('.arc-doc__title')?.getBoundingClientRect().top ?? -Infinity,
  }));
  expect(order.imageTop).toBeLessThan(order.titleTop);
  assertNoErrors();
});

test('reader controls persist line height and restore a reading position', async ({ page }) => {
  await visit(page, '/posts/theme-as-data/');
  await page.locator('[data-reader-trigger]').click();
  await page.locator('[data-reader="leading"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-reader-leading', 'relaxed');
  await page.evaluate(() => localStorage.setItem(`someone-site:reading-position:${location.pathname}`, '650'));
  await page.reload();
  await page.locator('[data-reader-trigger]').click();
  await expect(page.locator('[data-reader="resume"]')).toBeVisible();
});

test('article tools report denied clipboard and share operations', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Denied', 'NotAllowedError')) },
    });
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  });
  await visit(page, '/posts/theme-as-data/');
  await page.getByRole('button', { name: '复制链接' }).click();
  await expect(page.locator('[data-tool-status]')).toHaveText('无法访问剪贴板，请手动复制地址栏链接');
  await page.getByRole('button', { name: '分享', exact: true }).click();
  await expect(page.locator('[data-tool-status]')).toHaveText('分享失败，请手动复制地址栏链接');
  assertNoErrors();
});

test('desktop articles expose a live reading route without leaking it onto mobile', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await visit(page, '/posts/theme-as-data/');
  const route = page.locator('[data-reading-route]');
  await expect(route).toBeVisible();
  await expect(route.locator('[data-toc-link][aria-current="location"]')).toHaveCount(1);
  await page.locator('.prose h2').nth(2).evaluate((heading) => heading.scrollIntoView({ block: 'start' }));
  await expect(route.locator('[data-toc-link]').nth(2)).toHaveAttribute('aria-current', 'location');
  expect(Number.parseInt(await route.locator('[data-reading-percent]').innerText(), 10)).toBeGreaterThan(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(route).toBeHidden();
  await expect(page.locator('.reading-progress')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  assertNoErrors();
});

test('reduced motion disables intro particles and preserves access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(page, '/?intro');
  await expect(page.locator('.intro-particles')).toBeHidden();
  await expect(page.locator('[data-site-intro]')).toBeHidden({ timeout: 1500 });
});

test('ArcVellum demo uses a live Pixi 2.5D stage and keeps the whole graph while focusing', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await visit(page, '/columns/arcvellum/');
  await expect(page.locator('.back-badge')).toHaveCount(0);
  const stage = page.locator('[data-orrery-demo] [data-stage]');
  await expect(stage.locator('canvas')).toHaveCount(1, { timeout: 15_000 });
  const before = await page.locator('[data-node="ch1"]').boundingBox();
  await stage.dragTo(stage, { sourcePosition: { x: 250, y: 280 }, targetPosition: { x: 390, y: 210 } });
  await page.waitForTimeout(400);
  const after = await page.locator('[data-node="ch1"]').boundingBox();
  expect(Math.abs((before?.x ?? 0) - (after?.x ?? 0))).toBeGreaterThan(2);
  await page.locator('[data-level="scene"]').click();
  await expect(page.locator('[data-node="book"]')).toBeVisible();
  await expect(stage).toHaveAttribute('data-focus', 'scene');
  assertNoErrors();
});
