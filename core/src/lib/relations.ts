/**
 * A Payload relationship arrives sometimes as an id and sometimes as an already-loaded
 * document, depending on the depth of the query. This normalises both shapes.
 */
export function relationId(value: unknown): number | string | null {
  if (value == null) return null
  if (typeof value === 'object') return (value as { id?: number | string }).id ?? null
  return value as number | string
}
