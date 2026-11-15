import { expect, test } from '@playwright/test';

const path = '/posts/github-onboarding/';

test('实验栏目中的 GitHub 教程在手机和桌面可阅读并支持截图交互', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/columns/lab/');
  await page.getByRole('link', { name: /Git 与 GitHub 入门/ }).click();
  await expect(page).toHaveURL(new RegExp(path + '$'));
  await expect(page.getByRole('heading', { level: 1, name: 'Git 与 GitHub 入门' })).toBeVisible();

  const screenshot = page.getByRole('link', { name: /放大查看：GitHub 邮箱设置/ });
  await screenshot.focus();
  await expect(screenshot).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(screenshot).toBeFocused();

  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    const width = await page.locator('html').evaluate((html) => html.scrollWidth);
    expect(width).toBeLessThanOrEqual(viewport.width);
  }
  await expect(page.getByRole('button', { name: '复制命令' }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('访客可直接提交用户名并按 GitHub 的响应显示登记结果', async ({ page }) => {
  await page.goto(path);
  const form = page.locator('[data-registration]');
  if ((await form.count()) === 0) {
    await expect(page.getByRole('link', { name: '前往正式站点登记' }))
      .toHaveAttribute('href', 'https://win98.site/posts/github-onboarding/#register');
    return;
  }

  let available = false;
  await page.route('**/api/github-onboarding/register', (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      github_username: '@Example-User',
      website: '',
    });
    return available
      ? route.fulfill({ json: { github_username: 'example-user', message: 'GitHub 已确认登记。' } })
      : route.fulfill({ status: 503, json: { error: '请稍后重试。' } });
  });
  await form.getByLabel('GitHub 用户名或个人主页链接').fill('@Example-User');
  await expect(form.getByRole('textbox')).toHaveCount(1);
  const submit = form.getByRole('button', { name: '提交并获取邀请' });
  await submit.click();
  await expect(form.getByRole('status')).toHaveText('请稍后重试。');
  await expect(form.locator('[data-continue]')).toBeHidden();

  available = true;
  await submit.click();
  await expect(form.getByRole('status')).toHaveText('GitHub 已确认登记。');
  await expect(form.locator('[data-continue]')).toBeVisible();
  await expect(page.locator('pre').filter({ hasText: 'git switch -c student/example-user' })).toBeVisible();
});
