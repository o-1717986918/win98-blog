import { describe, expect, it } from 'vitest';
import { buildNoteGraph, type NoteEntry } from './note-graph';

const note = (id: string, title: string, body: string, relations: string[] = [], aliases: string[] = []) => ({
  id,
  body,
  data: { title, aliases, relations, tags: [], publish: true, draft: false, maturity: 'growing', created: new Date('2026-08-30') },
}) as unknown as NoteEntry;

describe('note graph', () => {
  it('parses explicit, wiki and markdown links into one deduplicated graph', () => {
    const notes = [
      note('alpha', '甲', '参见 [[乙|第二条]] 与 [第三条](/notes/gamma/)。', ['beta']),
      note('beta', '乙', '', [], ['第二条']),
      note('gamma', '丙', ''),
    ];
    const graph = buildNoteGraph(notes);
    expect(graph.relations).toEqual(expect.arrayContaining([
      { source: 'alpha', target: 'beta', kind: 'explicit' },
      { source: 'alpha', target: 'gamma', kind: 'markdown' },
    ]));
    expect(graph.relations).toHaveLength(2);
    expect(graph.incoming.get('beta')?.map((entry) => entry.id)).toEqual(['alpha']);
    expect(new Set(graph.outgoing.get('alpha')?.map((entry) => entry.id))).toEqual(new Set(['beta', 'gamma']));
  });

  it('records unresolved public relations without inventing nodes', () => {
    const graph = buildNoteGraph([note('alpha', '甲', '[[不存在]]', ['missing'])]);
    expect(graph.relations).toHaveLength(0);
    expect(graph.unresolved).toEqual([
      { source: 'alpha', target: 'missing' },
      { source: 'alpha', target: '不存在' },
    ]);
  });
});
