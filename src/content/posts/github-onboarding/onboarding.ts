const guide = document.querySelector<HTMLElement>('.onboarding-page');

for (const button of guide?.querySelectorAll<HTMLButtonElement>('[data-copy-command]') ?? []) {
  const command = button.closest('.code-block')?.querySelector('code');
  const label = button.querySelector('span');
  if (!command || !label) continue;

  let reset: number | undefined;
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(command.textContent ?? '');
      label.textContent = '已复制';
    } catch {
      label.textContent = '请选中下方命令复制';
    }
    window.clearTimeout(reset);
    reset = window.setTimeout(() => { label.textContent = '复制命令'; }, 2400);
  });
}

for (const link of guide?.querySelectorAll<HTMLAnchorElement>('[data-zoom]') ?? []) {
  const dialog = link.closest('figure')?.querySelector('dialog');
  const image = dialog?.querySelector<HTMLImageElement>('[data-enlarged]');
  if (!image || !dialog || typeof dialog.showModal !== 'function') continue;

  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    image.src = link.href;
    dialog.showModal();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

const form = guide?.querySelector<HTMLFormElement>('[data-registration]');
const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
const feedback = form?.querySelector<HTMLElement>('[role="status"]');
const next = form?.querySelector<HTMLAnchorElement>('[data-continue]');
const label = button?.querySelector('span');

if (form && button && feedback && next && label) {
  button.disabled = false;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.disabled) return;

    const fields = Object.fromEntries(new FormData(form));
    const inputs = Array.from(form.querySelectorAll('input'));
    button.disabled = true;
    for (const input of inputs) input.readOnly = true;
    label.textContent = '正在请求邀请…';
    feedback.className = 'form-status';
    feedback.textContent = '正在向 GitHub 请求邀请。';
    next.hidden = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(25_000),
      });
      const fallback = response.status === 429 ? '提交太频繁，请稍后重试。' : '暂时无法确认邀请，请稍后重试。';
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : fallback);
      if (typeof data?.github_username !== 'string' || !/^[a-z0-9-]{1,39}$/.test(data.github_username) ||
          typeof data?.message !== 'string') {
        throw new Error(fallback);
      }

      const username: string = data.github_username;
      const field = form.querySelector<HTMLInputElement>('[name="github_username"]');
      if (field) field.value = username;
      for (const code of guide?.querySelectorAll<HTMLElement>('[data-command-template]') ?? []) {
        code.textContent = (code.dataset.commandTemplate ?? '').replace(/GITHUB_USERNAME|你的GitHub用户名/g, username);
      }
      const note = guide?.querySelector('[data-username-note]');
      if (note) note.textContent = '下方命令已填入本次登记的用户名 ' + username + '。';
      feedback.className = 'form-status success';
      feedback.textContent = data.message;
      next.hidden = false;
    } catch (error) {
      feedback.className = 'form-status error';
      feedback.textContent = error instanceof Error && error.name === 'Error'
        ? error.message : '连接未完成，请稍后用同一个用户名重试。';
    } finally {
      button.disabled = false;
      for (const input of inputs) input.readOnly = false;
      label.textContent = '提交并获取邀请';
    }
  });
}
