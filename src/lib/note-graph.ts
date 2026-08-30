import type { CollectionEntry } from 'astro:content';

export type NoteEntry = CollectionEntry<'notes'>;
export type NoteRelationKind = 'explicit' | 'wiki' | 'markdown';

export interface NoteRelation {
  source: string;
  target: string;
  kind: NoteRelationKind;
}

export interface NoteGraph {
  relations: NoteRelation[];
  incoming: Map<string, NoteEntry[]>;
  outgoing: Map<string, NoteEntry[]>;
  unresolved: Array<{ source: string; target: string }>;
}

export const NOTE_MATURITY = {
  seedling: { label: '萌芽', description: '刚公开的想法，仍可能快速变化。' },
  growing: { label: '生长中', description: '已有结构与引用，仍在补充证据。' },
  evergreen: { label: '常青', description: '经过多轮修订，可作为稳定入口。' },
} as const;

const normalized = (value: string) => value.trim().toLocaleLowerCase('zh-CN');
const withoutCode = (body: string) => body
  .replace(/```[\s\S]*?```/gu, '')
  .replace(/~~~[\s\S]*?~~~/gu, '')
  .replace(/`[^`\r\n]*`/gu, '');

export function buildNoteGraph(notes: NoteEntry[]): NoteGraph {
  const byId = new Map(notes.map((note) => [note.id, note]));
  const byName = new Map<string, NoteEntry>();
  for (const note of notes) {
    for (const name of [note.data.title, ...note.data.aliases]) byName.set(normalized(name), note);
  }

  const relations = new Map<string, NoteRelation>();
  const unresolved: NoteGraph['unresolved'] = [];
  const add = (source: NoteEntry, target: NoteEntry | undefined, kind: NoteRelationKind, unresolvedTarget?: string) => {
    if (!target) {
      if (unresolvedTarget) unresolved.push({ source: source.id, target: unresolvedTarget });
      return;
    }
    if (source.id === target.id) return;
    const key = `${source.id}\u0000${target.id}`;
    const current = relations.get(key);
    if (!current || (kind === 'explicit' && current.kind !== 'explicit')) relations.set(key, { source: source.id, target: target.id, kind });
  };

  for (const note of notes) {
    for (const id of note.data.relations) add(note, byId.get(id), 'explicit', id);
    const body = withoutCode(note.body ?? '');
    for (const match of body.matchAll(/(?<!!)\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/gu)) {
      const targetName = String(match[1]).trim();
      add(note, byName.get(normalized(targetName)), 'wiki', targetName);
    }
    for (const match of body.matchAll(/(?:\/notes\/|\.\.\/)([a-z0-9]+(?:-[a-z0-9]+)*)\//gu)) {
      const id = String(match[1]);
      add(note, byId.get(id), 'markdown', id);
    }
  }

  const incoming = new Map(notes.map((note) => [note.id, [] as NoteEntry[]]));
  const outgoing = new Map(notes.map((note) => [note.id, [] as NoteEntry[]]));
  for (const relation of relations.values()) {
    const source = byId.get(relation.source);
    const target = byId.get(relation.target);
    if (!source || !target) continue;
    outgoing.get(source.id)?.push(target);
    incoming.get(target.id)?.push(source);
  }
  for (const entries of [...incoming.values(), ...outgoing.values()]) {
    entries.sort((a, b) => a.data.title.localeCompare(b.data.title, 'zh-CN'));
  }

  return { relations: [...relations.values()], incoming, outgoing, unresolved };
}
