import { describe, expect, it } from 'vitest'
import { describeRenames, pendingRenames } from '../../scripts/schema-renames'

// The shape drizzle writes next to each migration, trimmed to what the check reads.
const snapshot = (tables: Record<string, string[]>, enums: string[] = []) => ({
  version: '7',
  dialect: 'postgresql',
  tables: Object.fromEntries(
    Object.entries(tables).map(([name, columns]) => [
      `public.${name}`,
      {
        name,
        schema: 'public',
        columns: Object.fromEntries(columns.map((column) => [column, { name: column }])),
        policies: {},
      },
    ]),
  ),
  enums: Object.fromEntries(enums.map((name) => [`public.${name}`, { name, values: [] }])),
  schemas: {},
  sequences: {},
  roles: {},
  policies: {},
  views: {},
})

describe('pendingRenames', () => {
  it('flags a renamed column, the case that hung CI', () => {
    const before = snapshot({ media: ['id', 'url_original'] })
    const after = snapshot({ media: ['id', 'original_url'] })
    const found = pendingRenames(before, after)
    expect(found).toEqual([
      {
        kind: 'columna',
        table: 'public.media',
        added: ['original_url'],
        removed: ['url_original'],
      },
    ])
    expect(describeRenames(found)).toEqual([
      'columna de public.media: el código dice original_url; las migraciones, url_original',
    ])
  })

  it('flags renamed tables and enums', () => {
    const before = snapshot({ faqs: ['id'] }, ['enum_a'])
    const after = snapshot({ preguntas: ['id'] }, ['enum_b'])
    expect(pendingRenames(before, after).map(({ kind }) => kind)).toEqual(['enum', 'tabla'])
  })

  // These drizzle resolves without asking, and its statements say what is missing.
  it('stays quiet when something is only added or only removed', () => {
    const base = snapshot({ media: ['id', 'alt'] })
    expect(pendingRenames(base, snapshot({ media: ['id', 'alt', 'caption'] }))).toEqual([])
    expect(pendingRenames(base, snapshot({ media: ['id'] }))).toEqual([])
    expect(pendingRenames(base, snapshot({ media: ['id', 'alt'], faqs: ['id'] }))).toEqual([])
    expect(pendingRenames(base, base)).toEqual([])
  })

  // A new table and a dropped column elsewhere are two separate questions drizzle never asks.
  it('does not pair names across different tables', () => {
    const before = snapshot({ media: ['id', 'alt'], faqs: ['id', 'answer'] })
    const after = snapshot({ media: ['id', 'alt', 'caption'], faqs: ['id'] })
    expect(pendingRenames(before, after)).toEqual([])
  })

  it('says nothing about a snapshot it does not understand', () => {
    expect(pendingRenames({}, {})).toEqual([])
    expect(pendingRenames({ tables: [] }, { tables: 'nope' })).toEqual([])
  })
})
