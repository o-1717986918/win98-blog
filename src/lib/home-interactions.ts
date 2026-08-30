export function initHomeInteractions() {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll<HTMLElement>('.spotlight').forEach((spotlight) => {
      spotlight.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const bounds = spotlight.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        spotlight.style.setProperty('--spot-x', `${x}px`);
        spotlight.style.setProperty('--spot-y', `${y}px`);
        spotlight.style.setProperty('--spot-nx', String(x / bounds.width * 2 - 1));
        spotlight.style.setProperty('--spot-ny', String(y / bounds.height * 2 - 1));
        spotlight.dataset.pointer = 'true';
      });
      spotlight.addEventListener('pointerleave', () => { spotlight.dataset.pointer = 'false'; });
    });
  }

  document.querySelectorAll<HTMLElement>('[data-notes-feature]').forEach((feature) => {
    const modes = [...feature.querySelectorAll<HTMLButtonElement>('[data-note-mode]')];
    const panels = [...feature.querySelectorAll<HTMLElement>('[data-note-panel]')];
    const activateMode = (mode: HTMLButtonElement) => {
      modes.forEach((item) => {
        item.setAttribute('aria-selected', String(item === mode));
        item.tabIndex = item === mode ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.notePanel !== mode.dataset.noteMode; });
    };
    modes.forEach((mode) => {
      mode.addEventListener('click', () => activateMode(mode));
      mode.addEventListener('keydown', (event) => {
        const current = modes.indexOf(mode);
        const next = event.key === 'ArrowRight' ? (current + 1) % modes.length
          : event.key === 'ArrowLeft' ? (current - 1 + modes.length) % modes.length
            : event.key === 'Home' ? 0
              : event.key === 'End' ? modes.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        const target = modes[next];
        if (target) { activateMode(target); target.focus(); }
      });
    });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      feature.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const bounds = feature.getBoundingClientRect();
        feature.style.setProperty('--note-x', `${event.clientX - bounds.left}px`);
        feature.style.setProperty('--note-y', `${event.clientY - bounds.top}px`);
      });
    }
  });

  document.querySelectorAll<HTMLOListElement>('[data-home-post-stream]').forEach((stream) => {
    const items = [...stream.querySelectorAll<HTMLElement>('[data-stream-item]')];
    const controls = stream.nextElementSibling instanceof HTMLElement && stream.nextElementSibling.matches('[data-stream-controls]')
      ? stream.nextElementSibling : undefined;
    const status = controls?.querySelector<HTMLElement>('[data-stream-status]');
    const more = controls?.querySelector<HTMLButtonElement>('[data-stream-more]');
    const reset = controls?.querySelector<HTMLButtonElement>('[data-stream-reset]');
    if (!controls || !status || !more || !reset) return;
    const pageSize = Number(stream.dataset.initialLimit ?? 6);
    let visibleLimit = pageSize;
    let activeDate = '';

    const dateLabel = (value: string) => {
      const [year, month, day] = value.split('-');
      return `${year}年${Number(month)}月${Number(day)}日`;
    };
    const apply = () => {
      const matches = activeDate ? items.filter((item) => item.dataset.postDate === activeDate) : items;
      items.forEach((item, index) => { item.hidden = activeDate ? item.dataset.postDate !== activeDate : index >= visibleLimit; });
      more.hidden = Boolean(activeDate) || visibleLimit >= items.length;
      reset.hidden = !activeDate;
      status.textContent = activeDate
        ? `${dateLabel(activeDate)} · ${matches.length} 篇文章`
        : `已显示 ${Math.min(visibleLimit, items.length)} / ${items.length} 篇`;
      document.querySelectorAll<HTMLButtonElement>('[data-calendar-date]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.calendarDate === activeDate)));
      document.querySelectorAll<HTMLButtonElement>('[data-calendar-clear]').forEach((button) => { button.hidden = !activeDate; });
    };
    const clear = () => { activeDate = ''; visibleLimit = pageSize; apply(); };
    const filter = (date: string) => {
      activeDate = activeDate === date ? '' : date;
      apply();
      document.querySelector('.writing-stream')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    };
    more.addEventListener('click', () => { visibleLimit += pageSize; apply(); });
    reset.addEventListener('click', clear);
    document.querySelectorAll<HTMLButtonElement>('[data-calendar-date]').forEach((button) => button.addEventListener('click', () => filter(button.dataset.calendarDate ?? '')));
    document.querySelectorAll<HTMLButtonElement>('[data-calendar-clear]').forEach((button) => button.addEventListener('click', clear));
    controls.hidden = false;
    apply();
  });
}
