import { CelestialMatrix } from './planisphere.js';

const formatRa = (value) => {
  const hours = Math.floor(value);
  const minutes = Math.floor((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};

const formatDec = (value) => {
  const sign = value >= 0 ? '+' : '−';
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutes = Math.floor((absolute - degrees) * 60);
  return `${sign}${String(degrees).padStart(2, '0')}° ${String(minutes).padStart(2, '0')}′`;
};

const readoutRa = document.querySelector('#readout-ra');
const readoutDec = document.querySelector('#readout-dec');
const readoutSector = document.querySelector('#readout-sector');

const heroMatrix = new CelestialMatrix(document.querySelector('#hero-atlas'), {
  seed: 1247,
  onCoordinate({ ra, dec, sector }) {
    readoutRa.textContent = formatRa(ra);
    readoutDec.textContent = formatDec(dec);
    readoutSector.textContent = `SECTOR / A${String(sector + 1).padStart(2, '0')}`;
  },
});

const labMatrix = new CelestialMatrix(document.querySelector('#lab-atlas'), {
  dense: true,
  inverted: true,
  seed: 20260828,
});

const updateScrollPhase = () => {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  heroMatrix.setScrollPhase(scrollY / max);
  labMatrix.setScrollPhase(scrollY / max);
};

addEventListener('scroll', updateScrollPhase, { passive: true });
updateScrollPhase();

for (const button of document.querySelectorAll('[data-scroll-lab]')) {
  button.addEventListener('click', () => {
    document.querySelector('#observatory').scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  });
}

for (const entry of document.querySelectorAll('.note-entry')) {
  const sector = Number(entry.dataset.sector);
  entry.addEventListener('pointerenter', () => heroMatrix.setActiveSector(sector));
  entry.addEventListener('pointerleave', () => heroMatrix.setActiveSector(null));
  entry.addEventListener('focusin', () => heroMatrix.setActiveSector(sector));
  entry.addEventListener('focusout', () => heroMatrix.setActiveSector(null));
}

const freezeButton = document.querySelector('#freeze-atlas');
let frozen = matchMedia('(prefers-reduced-motion: reduce)').matches;
labMatrix.setPaused(frozen);
freezeButton.textContent = frozen ? '继续换相' : '暂停换相';
freezeButton.addEventListener('click', () => {
  frozen = !frozen;
  labMatrix.setPaused(frozen);
  freezeButton.textContent = frozen ? '继续换相' : '暂停换相';
});

document.querySelector('#regenerate-atlas').addEventListener('click', () => labMatrix.regenerate());

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');

const closeMenu = () => {
  navigation.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('span:last-child').textContent = '＋';
};

menuToggle.addEventListener('click', () => {
  const opening = !navigation.classList.contains('open');
  navigation.classList.toggle('open', opening);
  menuToggle.setAttribute('aria-expanded', String(opening));
  menuToggle.querySelector('span:last-child').textContent = opening ? '−' : '＋';
});

for (const link of navigation.querySelectorAll('a, button')) link.addEventListener('click', closeMenu);

const reader = document.querySelector('#reader-dialog');
const readerContent = document.querySelector('#reader-content');
const readerClose = document.querySelector('#reader-close');
let readerTrigger = null;

const closeReader = () => {
  reader.close();
  readerContent.replaceChildren();
  readerTrigger?.focus();
};

for (const button of document.querySelectorAll('[data-open-post]')) {
  button.addEventListener('click', () => {
    const template = document.querySelector(`#post-${button.dataset.openPost}`);
    if (!template) return;
    readerTrigger = button;
    readerContent.replaceChildren(template.content.cloneNode(true));
    reader.showModal();
    readerClose.focus();
  });
}

readerClose.addEventListener('click', closeReader);
reader.addEventListener('click', (event) => {
  const bounds = reader.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) closeReader();
});

reader.addEventListener('close', () => {
  readerContent.replaceChildren();
  readerTrigger?.focus();
});

addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) closeMenu();
});

requestAnimationFrame(() => {
  document.body.classList.add('ready');
});
