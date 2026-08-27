import { describe, it, expect } from 'vitest'
import { relationId, relationPointsTo } from '../src/lib/relations.js'

/**
 * The same relationship arrives as an id or as a loaded document depending on the depth of
 * the query, and hooks receive it already loaded. Code that assumed one shape broke on the
 * other more than once.
 */
describe('relationId', () => {
  it('takes the id out of a loaded document', () => {
    expect(relationId({ id: 7, alias: 'Kilo' })).toBe(7)
  })

  it('passes a bare id through, number or string', () => {
    expect(relationId(7)).toBe(7)
    expect(relationId('7')).toBe('7')
  })

  it('returns null when there is no relationship, and for a loaded object without id', () => {
    expect(relationId(null)).toBeNull()
    expect(relationId(undefined)).toBeNull()
    expect(relationId({ alias: 'sin id' })).toBeNull()
  })
})

describe('relationPointsTo', () => {
  it('compares across shapes, because a form sends "7" where the CMS holds 7', () => {
    expect(relationPointsTo({ id: 7 }, 7)).toBe(true)
    expect(relationPointsTo('7', 7)).toBe(true)
    expect(relationPointsTo(7, '7')).toBe(true)
  })

  it('is false for a different document and for no relationship at all', () => {
    expect(relationPointsTo({ id: 8 }, 7)).toBe(false)
    expect(relationPointsTo(null, 7)).toBe(false)
  })
})
