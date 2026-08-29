import type { ColumnEntry, PostEntry } from './content';

export type AccentId = ColumnEntry['data']['accent'];

const ACCENT_VARIABLES: Record<AccentId, string> = {
  aqua: '--spectrum-aqua-rgb',
  coral: '--spectrum-coral-rgb',
  violet: '--spectrum-violet-rgb',
  gold: '--spectrum-gold-rgb',
};

const ACCENT_RELATIONS: Record<AccentId, [AccentId, AccentId]> = {
  aqua: ['coral', 'gold'],
  coral: ['violet', 'aqua'],
  violet: ['aqua', 'coral'],
  gold: ['coral', 'violet'],
};

const DEFAULT_ACCENT: AccentId = 'aqua';

export const normalizeAccent = (accent: AccentId | string | null | undefined): AccentId =>
  accent && Object.hasOwn(ACCENT_VARIABLES, accent) ? accent as AccentId : DEFAULT_ACCENT;

export const accentStyle = (requestedAccent: AccentId | string | null | undefined) => {
  const accent = normalizeAccent(requestedAccent);
  const [secondary, tertiary] = ACCENT_RELATIONS[accent];
  return [
    `--content-accent-rgb: var(${ACCENT_VARIABLES[accent]})`,
    `--content-secondary-rgb: var(${ACCENT_VARIABLES[secondary]})`,
    `--content-tertiary-rgb: var(${ACCENT_VARIABLES[tertiary]})`,
  ].join(';');
};

export const postAccent = (post: PostEntry, columns: Map<string, ColumnEntry>): AccentId =>
  columns.get(post.data.columns[0]?.id ?? '')?.data.accent ?? 'aqua';
