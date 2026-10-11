/**
 * Would drizzle stop and ask a question when diffing these two snapshots?
 *
 * When one name disappears and another appears in the same place —`url_original` gone,
 * `original_url` new— drizzle cannot tell a rename from a drop plus a create, so it asks
 * in the terminal. CI has no terminal: `schema:check` waited for an answer until the job
 * timed out.
 *
 * This looks at what drizzle looks at before asking, so the check can say what is missing
 * without ever opening the prompt. A hit here is not doubt: the code has names the
 * migrations lack, so a migration is missing.
 *
 * The snapshot format is not public API. Anything unexpected reads as "nothing found" and
 * leaves the last word to drizzle (and to the prompt guard in `schema-check.ts`).
 */

export type Ambiguity = {
  /** User-facing, hence Spanish: «tabla», «columna», «enum»… */
  kind: string
  /** Set when the ambiguity lives inside a table. */
  table?: string
  /** In the code, not in the migrations. */
  added: string[]
  /** In the migrations, not in the code. */
  removed: string[]
}

type Snapshot = Record<string, unknown>

const keysOf = (value: unknown): string[] =>
  value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : []

const difference = (a: string[], b: string[]) => a.filter((key) => !b.includes(key))

// Drizzle only prompts when the same bucket gains and loses names at once.
const conflict = (kind: string, before: unknown, after: unknown, table?: string) => {
  const added = difference(keysOf(after), keysOf(before))
  const removed = difference(keysOf(before), keysOf(after))
  return added.length && removed.length ? [{ kind, table, added, removed }] : []
}

// Resolved schema-wide by drizzle: a table renamed across schemas is still one question.
const GLOBAL: [key: string, kind: string][] = [
  ['schemas', 'esquema'],
  ['enums', 'enum'],
  ['sequences', 'secuencia'],
  ['roles', 'rol'],
  ['policies', 'política'],
  ['tables', 'tabla'],
  ['views', 'vista'],
]

export function pendingRenames(before: Snapshot, after: Snapshot): Ambiguity[] {
  const found: Ambiguity[] = GLOBAL.flatMap(([key, kind]) =>
    conflict(kind, before[key], after[key]),
  )

  // Only tables present under the same name on both sides: an ambiguous table is already
  // reported above, and drizzle would ask about it first.
  const tablesBefore = (before.tables ?? {}) as Record<string, Snapshot>
  const tablesAfter = (after.tables ?? {}) as Record<string, Snapshot>
  for (const name of keysOf(tablesAfter)) {
    const was = tablesBefore[name]
    const is = tablesAfter[name]
    if (!was || !is) continue
    found.push(
      ...conflict('columna', was.columns, is.columns, name),
      ...conflict('política', was.policies, is.policies, name),
    )
  }
  return found
}

export function describeRenames(found: Ambiguity[]): string[] {
  return found.map(({ kind, table, added, removed }) => {
    const where = table ? ` de ${table}` : ''
    return `${kind}${where}: el código dice ${added.join(', ')}; las migraciones, ${removed.join(', ')}`
  })
}
