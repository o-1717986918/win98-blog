let pagefind;
let requestId = 0;

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character] ?? character);

document.querySelectorAll('[data-search-index]').forEach((root) => {
  const input = root.querySelector('[data-search-input]');
  const status = root.querySelector('[data-search-status]');
  const list = root.querySelector('[data-search-results]');
  const typeSelect = root.querySelector('[data-search-type]');
  const tagSelect = root.querySelector('[data-search-tag]');
  if (!input || !status || !list || !typeSelect || !tagSelect) return;

  const load = async () => {
    pagefind ??= await import('/pagefind/pagefind.js');
    if (typeSelect.options.length === 1) {
      const filters = await pagefind.filters();
      for (const [select, values] of [[typeSelect, filters.type], [tagSelect, filters.tag]]) {
        for (const [value, count] of Object.entries(values ?? {})) select.add(new Option(`${value} (${count})`, value));
      }
    }
    return pagefind;
  };

  const run = async () => {
    const id = ++requestId;
    const query = input.value.trim();
    const filters = Object.fromEntries([['type', typeSelect.value], ['tag', tagSelect.value]].filter(([, value]) => value));
    if (!query && Object.keys(filters).length === 0) {
      list.replaceChildren();
      status.textContent = '输入关键词或选择筛选条件开始搜索。';
      return;
    }
    status.textContent = '正在搜索…';
    try {
      const api = await load();
      const response = await api.search(query || null, { filters });
      const results = await Promise.all(response.results.slice(0, 20).map((result) => result.data()));
      if (id !== requestId) return;
      list.innerHTML = results.map((result) => `
        <li class="search-result">
          <h2><a href="${escapeHtml(result.url)}">${escapeHtml(result.meta.title ?? result.url)}</a></h2>
          <p>${result.excerpt || escapeHtml(result.meta.description ?? '')}</p>
        </li>`).join('');
      status.textContent = results.length ? `找到 ${results.length} 条结果。` : '没有找到匹配内容。';
    } catch (error) {
      console.error('[site-search]', error);
      status.textContent = '搜索索引加载失败，请稍后刷新重试。';
    }
  };

  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = window.setTimeout(run, 140); });
  input.addEventListener('focus', () => { load().catch(() => undefined); }, { once: true });
  typeSelect.addEventListener('change', run);
  tagSelect.addEventListener('change', run);
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !event.target?.closest?.('input, textarea, select')) { event.preventDefault(); input.focus(); }
  });
});
