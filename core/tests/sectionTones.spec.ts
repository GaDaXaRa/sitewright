import { describe, it, expect } from 'vitest'
import { alternateTones } from '../src/lib/sectionTones.js'

/**
 * Fixing a background per section breaks as soon as the collective runs out of content:
 * two sections that were never neighbours become neighbours, and if they share a
 * background their two paddings read as one large void.
 */
describe('alternateTones', () => {
  it('alternates over the sections that are actually painted', () => {
    expect(alternateTones([true, true, true])).toEqual(['light', 'mid', 'light'])
  })

  it('keeps neighbours different when a section in the middle disappears', () => {
    const [first, , third] = alternateTones([true, false, true])

    expect(first).not.toBe(third)
  })

  it('returns nothing for what is not painted', () => {
    expect(alternateTones([false, true])).toEqual([null, 'light'])
  })
})
