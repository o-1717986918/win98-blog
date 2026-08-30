import sharp from 'sharp';
import { resolveTheme, type ThemeId } from '../config/site';
import { normalizeAccent, type AccentId } from './visual';
import { withBase } from './site-path';

const PALETTES: Record<ThemeId, { background: string; surface: string; text: string; muted: string; accents: Record<AccentId, string> }> = {
  mist: { background: '#e7eceb', surface: '#f7f8f4', text: '#17262e', muted: '#4c6065', accents: { aqua: '#3579a8', coral: '#c66a43', violet: '#6f6a9b', gold: '#a28449' } },
  abyss: { background: '#091115', surface: '#111e23', text: '#ecf4f1', muted: '#a3b8b4', accents: { aqua: '#4996b9', coral: '#d97c55', violet: '#8b85ae', gold: '#b89960' } },
};

const escapeXml = (value: string) => value.replace(/[<>&"']/gu, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);

function wrapTitle(title: string, limit = 15) {
  const lines: string[] = [];
  let line = '';
  let weight = 0;
  for (const character of Array.from(title.trim())) {
    const nextWeight = /[\u0000-\u00ff]/u.test(character) ? .55 : 1;
    if (line && weight + nextWeight > limit) {
      lines.push(line.trim());
      line = '';
      weight = 0;
    }
    line += character;
    weight += nextWeight;
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 3);
}

interface SocialCardOptions {
  title: string;
  description: string;
  kind: 'post' | 'column';
  theme: ThemeId | string;
  accent?: AccentId | string | null;
}

export async function renderSocialCard({ title, description, kind, theme, accent: requestedAccent }: SocialCardOptions) {
  const palette = PALETTES[resolveTheme(theme)];
  const accent = normalizeAccent(requestedAccent);
  const secondary = accent === 'aqua' ? 'coral' : accent === 'coral' ? 'violet' : accent === 'violet' ? 'gold' : 'aqua';
  const titleSvg = wrapTitle(title).map((line, index) => `<text x="92" y="${220 + index * 82}" class="title">${escapeXml(line)}</text>`).join('');
  const descriptionLine = description.length > 56 ? `${description.slice(0, 55)}…` : description;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <style>.ui{font-family:"Segoe UI","Microsoft YaHei",sans-serif}.title{font-family:"Segoe UI","Microsoft YaHei",sans-serif;font-size:66px;font-weight:650;letter-spacing:-2px;fill:${palette.text}}</style>
      <rect width="1200" height="630" fill="${palette.background}"/>
      <path d="M0 0H520L388 630H0Z" fill="${palette.accents[accent]}" opacity=".2"/>
      <path d="M920 0H1200V630H730Z" fill="${palette.accents[secondary]}" opacity=".24"/>
      <rect x="48" y="48" width="1104" height="534" rx="4" fill="${palette.surface}" stroke="${palette.accents[accent]}" stroke-opacity=".6"/>
      <rect x="48" y="48" width="266" height="9" fill="${palette.accents[accent]}"/><rect x="314" y="48" width="98" height="9" fill="${palette.accents[secondary]}"/>
      <text x="92" y="112" class="ui" font-size="17" letter-spacing="4" fill="${palette.accents[accent]}">${kind === 'post' ? 'ARTICLE / 某人的小站' : 'COLUMN / 某人的小站'}</text>
      ${titleSvg}
      <text x="92" y="520" class="ui" font-size="22" fill="${palette.muted}">${escapeXml(descriptionLine)}</text>
      <path d="M1022 490h72v72h-72zM1038 506h40v40h-40z" fill="none" stroke="${palette.accents[secondary]}" stroke-width="3"/>
      <circle cx="1094" cy="110" r="12" fill="${palette.accents[accent]}"/><rect x="1050" y="98" width="24" height="24" fill="${palette.accents[secondary]}"/>
    </svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

export const socialImagePath = (collection: 'posts' | 'columns', id: string) =>
  withBase(`/og/${collection}/${id.split('/').map(encodeURIComponent).join('/')}.png`);
