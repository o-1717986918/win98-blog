interface NoteLink { title: string; href: string }

function renderLinks(container: HTMLElement | null, raw: string | undefined, emptyCopy: string) {
  if (!container) return;
  container.replaceChildren();
  let items: NoteLink[] = [];
  try { items = JSON.parse(raw ?? '[]') as NoteLink[]; } catch { items = []; }
  if (items.length === 0) {
    const empty = document.createElement('small');
    empty.textContent = emptyCopy;
    container.append(empty);
    return;
  }
  for (const item of items) {
    const anchor = document.createElement('a');
    anchor.href = item.href;
    anchor.textContent = `${item.title} ↗`;
    container.append(anchor);
  }
}

export function initNotesWorkbench() {
  const workbench = document.querySelector<HTMLElement>('[data-note-workbench]');
  if (!workbench) return;
  const search = workbench.querySelector<HTMLInputElement>('[data-note-search]');
  const tagButtons = [...workbench.querySelectorAll<HTMLButtonElement>('[data-note-tag]')];
  const entries = [...workbench.querySelectorAll<HTMLElement>('[data-note-entry]')];
  const listEntries = [...workbench.querySelectorAll<HTMLElement>('.garden-list [data-note-entry]')];
  const visibleCount = workbench.querySelector<HTMLElement>('[data-visible-count]');
  const empty = workbench.querySelector<HTMLElement>('[data-note-empty]');
  let activeTag = '';
  const applyFilter = () => {
    const query = search?.value.trim().toLowerCase() ?? '';
    let count = 0;
    entries.forEach((entry) => {
      const matchesText = !query || `${entry.dataset.noteTitle} ${entry.dataset.noteDescription} ${entry.dataset.noteTags}`.includes(query);
      const matchesTag = !activeTag || (entry.dataset.noteTags ?? '').split('|').includes(activeTag.toLowerCase());
      const visible = matchesText && matchesTag;
      entry.hidden = !visible;
      if (visible && listEntries.includes(entry)) count += 1;
    });
    if (visibleCount) visibleCount.textContent = String(count);
    if (empty) empty.hidden = count !== 0;
  };
  search?.addEventListener('input', applyFilter);
  tagButtons.forEach((button) => button.addEventListener('click', () => {
    activeTag = button.dataset.noteTag ?? '';
    tagButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    applyFilter();
  }));

  const indexView = workbench.querySelector<HTMLElement>('[data-index-view]');
  const mapView = workbench.querySelector<HTMLElement>('[data-map-view]');
  const panels = [...workbench.querySelectorAll<HTMLElement>('[data-note-panel]')];
  workbench.querySelectorAll<HTMLButtonElement>('[data-note-view]').forEach((button) => button.addEventListener('click', () => {
    const showMap = button.dataset.noteView === 'map';
    if (indexView) indexView.hidden = showMap;
    if (mapView) mapView.hidden = !showMap;
    workbench.querySelectorAll<HTMLButtonElement>('[data-note-view]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  }));

  const field = (selector: string) => workbench.querySelector<HTMLElement>(selector);
  workbench.querySelectorAll<HTMLAnchorElement>('[data-note-preview]').forEach((link) => {
    const update = () => {
      const values: Record<string, string | undefined> = {
        '[data-preview-number]': link.dataset.previewIndex,
        '[data-preview-file]': link.dataset.previewFile,
        '[data-preview-tags]': link.dataset.previewTags,
        '[data-context-tags]': link.dataset.previewTags,
        '[data-preview-aliases]': link.dataset.previewAliases,
        '[data-preview-maturity]': link.dataset.previewMaturity,
        '[data-preview-incoming]': link.dataset.previewIncoming,
        '[data-preview-outgoing]': link.dataset.previewOutgoing,
      };
      Object.entries(values).forEach(([selector, value]) => {
        workbench.querySelectorAll<HTMLElement>(`${selector}:not([data-note-preview])`).forEach((node) => { node.textContent = value ?? ''; });
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.notePanel !== link.dataset.previewId; });
      workbench.querySelectorAll<HTMLAnchorElement>('[data-note-preview]').forEach((item) => item.toggleAttribute('aria-current', item === link));
      renderLinks(field('[data-backlink-copy]'), link.dataset.previewBacklinks, '尚无公开笔记引用当前条目。');
      renderLinks(field('[data-outgoing-copy]'), link.dataset.previewOutgoingLinks, '当前笔记尚未指向其他公开条目。');
    };
    link.addEventListener('click', (event) => { event.preventDefault(); update(); });
  });

  const status = field('[data-copy-status]');
  workbench.querySelectorAll<HTMLButtonElement>('[data-copy-command]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(button.dataset.copyCommand ?? ''); if (status) status.textContent = '命令已复制，可在项目根目录运行。'; }
    catch { if (status) status.textContent = '浏览器未授权剪贴板，请手动复制上方命令。'; }
  }));
}
