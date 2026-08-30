let pagefind;
let requestId = 0;
const siteRoot = new URL('../', import.meta.url);

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character);

document.querySelectorAll('[data-search-index]').forEach((root) => {
  const input = root.querySelector('[data-search-input]');
  const status = root.querySelector('[data-search-status]');
  const list = root.querySelector('[data-search-results]');
  if (!input || !status || !list) return;

  const load = async () => (pagefind ??= await import(new URL('pagefind/pagefind.js', siteRoot).href));

  const run = async () => {
    const id = ++requestId;
    const query = input.value.trim();
    if (!query) {
      list.replaceChildren();
      status.textContent = '输入关键词开始搜索。';
      root.dataset.active = 'false';
      root.dataset.searched = 'false';
      return;
    }
    root.dataset.active = 'true';
    root.dataset.searched = 'true';
    status.textContent = '正在搜索…';
    try {
      const api = await load();
      const response = await api.search(query, { filters: { type: '文章' } });
      const results = await Promise.all(response.results.slice(0, 8).map((result) => result.data()));
      if (id !== requestId) return;
      list.innerHTML = results.map((result) => `
        <li class="search-result">
          <a href="${escapeHtml(result.url)}">
            <h2>${escapeHtml(result.meta.title ?? result.url)}<span aria-hidden="true">↗</span></h2>
            <p>${result.excerpt || escapeHtml(result.meta.description ?? '')}</p>
          </a>
        </li>`).join('');
      status.textContent = results.length ? `找到 ${results.length} 条结果。` : '没有找到匹配内容。';
    } catch (error) {
      console.warn('[site-search]', error);
      status.textContent = '搜索索引加载失败，请稍后刷新重试。';
    }
  };

  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(run, 140); });
  input.addEventListener('focus', () => { load().catch(() => undefined); }, { once: true });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      input.value = '';
      list.replaceChildren();
      root.dataset.active = 'false';
      root.dataset.searched = 'false';
      input.blur();
      return;
    }
    if (event.key === 'ArrowDown') {
      const first = list.querySelector('a');
      if (first) { event.preventDefault(); first.focus(); }
    }
  });
  list.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...list.querySelectorAll('a')];
    const current = event.target?.closest?.('a');
    const index = links.indexOf(current);
    const next = event.key === 'ArrowDown' ? links[index + 1] : links[index - 1];
    if (next) { event.preventDefault(); next.focus(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); input.focus(); }
  });
  root.addEventListener('focusin', () => { if (input.value.trim()) root.dataset.active = 'true'; });
  root.addEventListener('focusout', () => window.setTimeout(() => {
    if (!root.contains(document.activeElement)) root.dataset.active = 'false';
  }, 0));
});
