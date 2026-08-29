import { expect, test, type Page } from '@playwright/test';

function rejectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

test('homepage intro is escapable and desktop content stays inside the viewport', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?intro');
  await expect(page.locator('[data-site-intro]')).toBeVisible();
  await expect(page.locator('.site-header')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-site-intro]')).toBeHidden({ timeout: 2500 });
  await expect(page.locator('.site-header')).not.toHaveAttribute('inert', '');
  await expect(page.locator('.spotlight')).toBeVisible();
  const copyBox = await page.locator('.spotlight-main').boundingBox();
  const coverBox = await page.locator('.spotlight [data-content-cover]').boundingBox();
  expect(coverBox?.x ?? 0).toBeGreaterThan(copyBox?.x ?? Infinity);
  await page.locator('.spotlight').hover({ position: { x: 420, y: 120 } });
  await expect(page.locator('.spotlight')).toHaveAttribute('data-pointer', 'true');
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, spotlight: document.querySelector('.spotlight')?.getBoundingClientRect().height ?? 0 }));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.spotlight).toBeGreaterThan(360);
  expect(dimensions.spotlight).toBeLessThan(560);
  const headerAlignment = await page.evaluate(() => {
    const header = document.querySelector('.header-inner')?.getBoundingClientRect();
    const content = document.querySelector('.home-page')?.getBoundingClientRect();
    const search = document.querySelector('.header-search')?.getBoundingClientRect();
    return {
      leftDelta: Math.abs((header?.left ?? 0) - (content?.left ?? 0)),
      rightDelta: Math.abs((header?.right ?? 0) - (content?.right ?? 0)),
      searchCenterDelta: Math.abs(((search?.left ?? 0) + (search?.width ?? 0) / 2) - innerWidth / 2),
    };
  });
  expect(headerAlignment.leftDelta).toBeLessThan(1);
  expect(headerAlignment.rightDelta).toBeLessThan(1);
  expect(headerAlignment.searchCenterDelta).toBeLessThan(1);
  const editorialGrid = await page.evaluate(() => ({
    recentWidth: document.querySelector('.recent-writing')?.getBoundingClientRect().width ?? 0,
    columnsWidth: document.querySelector('.column-browser')?.getBoundingClientRect().width ?? 0,
    recentCoverWidth: document.querySelector('.recent-writing [data-content-cover]')?.getBoundingClientRect().width ?? 0,
    recentCount: document.querySelectorAll('.recent-writing .post-row').length,
    notesTop: document.querySelector('.notes-feature')?.getBoundingClientRect().top ?? 0,
    notesLeft: document.querySelector('.notes-feature')?.getBoundingClientRect().left ?? 0,
    notesWidth: document.querySelector('.notes-feature')?.getBoundingClientRect().width ?? 0,
    columnsLeft: document.querySelector('.column-browser')?.getBoundingClientRect().left ?? 0,
    recentBottom: document.querySelector('.recent-writing')?.getBoundingClientRect().bottom ?? Infinity,
    columnOverflow: (() => { const element = document.querySelector('.column-directory'); return element ? getComputedStyle(element).overflowY : ''; })(),
  }));
  expect(editorialGrid.columnsWidth).toBeGreaterThan(editorialGrid.recentWidth * 1.45);
  expect(editorialGrid.recentCoverWidth).toBeGreaterThan(editorialGrid.recentWidth * .88);
  expect(editorialGrid.recentCount).toBe(3);
  expect(editorialGrid.notesTop).toBeGreaterThan(editorialGrid.recentBottom);
  expect(editorialGrid.notesLeft).toBeGreaterThan(editorialGrid.columnsLeft + editorialGrid.columnsWidth * .32);
  expect(editorialGrid.notesWidth).toBeGreaterThan(editorialGrid.recentWidth * 1.6);
  expect(editorialGrid.columnOverflow).toBe('auto');
  await expect(page.locator('.notes-feature')).toBeVisible();
  await page.locator('[data-note-mode]').nth(1).click();
  await expect(page.locator('[data-note-panel="links"]')).toBeVisible();
  await expect(page.locator('[data-note-panel="note"]')).toBeHidden();
  assertNoErrors();
});

test('theme switch exposes only mist and abyss', async ({ page }) => {
  await page.addInitScript(() => { localStorage.removeItem('someone-site:theme'); sessionStorage.setItem('someone-site:intro-seen:v4', 'true'); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mist');
  await expect(page.locator('[data-theme-name]')).toHaveText('MIST');
  await page.locator('[data-theme-button]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'abyss');
  await expect(page.locator('[data-theme-name]')).toHaveText('ABYSS');
  await page.locator('[data-theme-button]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'mist');
});

test('profile drawer keeps the portrait square and all content visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => sessionStorage.setItem('someone-site:intro-seen:v4', 'true'));
  await page.goto('/');
  await page.getByRole('button', { name: '某人的小站 · 打开个人资料' }).click();
  const geometry = await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>('[data-profile-dialog]');
    const portrait = dialog?.querySelector<HTMLImageElement>('.profile-dialog__identity img');
    const box = portrait?.getBoundingClientRect();
    return { width: box?.width ?? 0, height: box?.height ?? 0, clientHeight: dialog?.clientHeight ?? 0, scrollHeight: dialog?.scrollHeight ?? Infinity };
  });
  expect(Math.abs(geometry.width - geometry.height)).toBeLessThan(1);
  expect(geometry.width).toBeGreaterThanOrEqual(110);
  expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
});

test('mobile spotlight keeps a legible 16:9 cover without horizontal overflow', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => sessionStorage.setItem('someone-site:intro-seen:v4', 'true'));
  await page.goto('/');
  const layout = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    spotlight: document.querySelector('.spotlight')?.getBoundingClientRect().height ?? 0,
    cover: document.querySelector('.spotlight [data-content-cover]')?.getBoundingClientRect().height ?? 0,
    notesTop: document.querySelector('.notes-feature')?.getBoundingClientRect().top ?? Infinity,
  }));
  expect(layout.width).toBeLessThanOrEqual(390);
  expect(layout.spotlight).toBeLessThan(520);
  expect(layout.cover).toBeGreaterThanOrEqual(150);
  expect(layout.cover).toBeLessThanOrEqual(230);
  expect(layout.notesTop).toBeGreaterThan(layout.spotlight);
  assertNoErrors();
});

test('search only returns article routes', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.goto('/search/');
  await page.locator('[data-search-input]').fill('主题');
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  for (const link of await page.locator('[data-search-results] a').evaluateAll((items) => items.map((item) => item.getAttribute('href')))) expect(link).toMatch(/^\/posts\//u);
  assertNoErrors();
});

test('chrome levels keep their isolation contracts', async ({ page }) => {
  const cases = [
    ['/posts/theme-as-data/', true, true, true],
    ['/posts/reader-control/', false, false, true],
    ['/posts/particle-field/', false, false, false],
    ['/columns/engineering/', true, true, false],
    ['/notes/', false, false, false],
    ['/columns/lab/', false, false, false],
  ] as const;
  for (const [path, header, footer, reader] of cases) {
    await page.goto(path);
    await expect(page.locator('.site-header')).toHaveCount(header ? 1 : 0);
    await expect(page.locator('.site-footer')).toHaveCount(footer ? 1 : 0);
    await expect(page.locator('[data-reader-controls]')).toHaveCount(reader ? 1 : 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('learning notes workbench filters real entries and switches relationship view', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.goto('/notes/');
  await expect(page.locator('[data-note-workbench]')).toBeVisible();
  await expect(page.locator('[data-note-entry]').first()).toBeVisible();
  await page.locator('[data-note-search]').fill('不可能匹配的笔记');
  await expect(page.locator('[data-note-empty]')).toBeVisible();
  await expect(page.locator('[data-visible-count]')).toHaveText('0');
  await page.locator('[data-note-search]').fill('');
  await page.locator('[data-note-view="map"]').click();
  await expect(page.locator('[data-map-view]')).toBeVisible();
  await expect(page.locator('[data-index-view]')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  assertNoErrors();
});

test('reader controls persist line height and restore a reading position', async ({ page }) => {
  await page.goto('/posts/theme-as-data/');
  await page.locator('[data-reader-trigger]').click();
  await page.locator('[data-reader="leading"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-reader-leading', 'relaxed');
  await page.evaluate(() => localStorage.setItem(`someone-site:reading-position:${location.pathname}`, '650'));
  await page.reload();
  await page.locator('[data-reader-trigger]').click();
  await expect(page.locator('[data-reader="resume"]')).toBeVisible();
});

test('reduced motion disables intro particles and preserves access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?intro');
  await expect(page.locator('.intro-particles')).toBeHidden();
  await expect(page.locator('[data-site-intro]')).toBeHidden({ timeout: 1500 });
});

test('ArcVellum demo uses a live Pixi 2.5D stage and keeps the whole graph while focusing', async ({ page }) => {
  const assertNoErrors = rejectConsoleErrors(page);
  await page.goto('/columns/arcvellum/');
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
