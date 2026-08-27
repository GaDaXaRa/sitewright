import { describe, it, expect } from 'vitest'
import { formatEventDate, formatLineup, groupByYear, isUpcoming, splitEvents } from '../src/lib/events.js'

const at = (iso: string) => Date.parse(iso)

describe('when an event stops being upcoming', () => {
  it('stays upcoming while it is happening, until its end time', () => {
    const party = { startsAt: '2027-03-05T22:00:00.000Z', endsAt: '2027-03-06T04:00:00.000Z' }

    // Two in the morning: the party is on. This is the case that made a site look
    // abandoned by lunchtime — the night's own date vanishing before the night.
    expect(isUpcoming(party, at('2027-03-06T02:00:00.000Z'))).toBe(true)
    expect(isUpcoming(party, at('2027-03-06T05:00:00.000Z'))).toBe(false)
  })

  it('is not upcoming when there is no date at all', () => {
    expect(isUpcoming({}, at('2027-03-05T22:00:00.000Z'))).toBe(false)
    expect(isUpcoming({ startsAt: null }, at('2027-03-05T22:00:00.000Z'))).toBe(false)
  })

  it('is still upcoming at the exact instant it ends, not a second before', () => {
    const party = { startsAt: '2027-03-05T22:00:00.000Z', endsAt: '2027-03-06T04:00:00.000Z' }

    expect(isUpcoming(party, at('2027-03-06T04:00:00.000Z'))).toBe(true)
    expect(isUpcoming(party, at('2027-03-06T04:00:00.001Z'))).toBe(false)
  })

  it('with no end time, the start is the boundary', () => {
    const date = { startsAt: '2027-03-05T22:00:00.000Z' }

    expect(isUpcoming(date, at('2027-03-05T21:00:00.000Z'))).toBe(true)
    expect(isUpcoming(date, at('2027-03-05T23:00:00.000Z'))).toBe(false)
  })
})

describe('splitEvents', () => {
  const events = [
    { id: 1, startsAt: '2027-05-01T20:00:00.000Z' },
    { id: 2, startsAt: '2026-01-10T20:00:00.000Z' },
    { id: 3, startsAt: '2027-01-15T20:00:00.000Z' },
    { id: 4, startsAt: '2026-06-20T20:00:00.000Z' },
  ]
  const now = at('2027-01-01T00:00:00.000Z')

  it('sorts what is coming soonest first, and what happened most recent first', () => {
    const { upcoming, past } = splitEvents(events, now)

    expect(upcoming.map((e) => e.id)).toEqual([3, 1])
    expect(past.map((e) => e.id)).toEqual([4, 2])
  })

  it('drops events with no usable date instead of placing them wrongly', () => {
    const { upcoming, past } = splitEvents(
      [...events, { id: 5, startsAt: null }, { id: 6, startsAt: 'pronto' }],
      now,
    )

    expect([...upcoming, ...past].map((e) => e.id)).not.toContain(5)
    expect([...upcoming, ...past].map((e) => e.id)).not.toContain(6)
  })
})

describe('groupByYear', () => {
  it('groups the archive newest year first', () => {
    const grouped = groupByYear([
      { id: 1, startsAt: '2025-05-01T20:00:00.000Z' },
      { id: 2, startsAt: '2026-02-01T20:00:00.000Z' },
      { id: 3, startsAt: '2025-11-01T20:00:00.000Z' },
    ])

    expect(grouped.map((g) => g.year)).toEqual([2026, 2025])
    expect(grouped[1].events.map((e) => e.id)).toEqual([1, 3])
  })
})

describe('formatEventDate', () => {
  it('writes the time in the venue timezone, not the visitor one', () => {
    // 23:30 in Madrid is 21:30 UTC in summer. A visitor abroad must read the door time.
    const text = formatEventDate('2027-07-10T21:30:00.000Z')

    expect(text).toContain('23:30')
  })

  it('adds the year only when asked, which is what the archive needs', () => {
    const upcoming = formatEventDate('2027-07-10T21:30:00.000Z')
    const archived = formatEventDate('2027-07-10T21:30:00.000Z', null, { showYear: true })

    expect(upcoming).not.toContain('2027')
    expect(archived).toContain('2027')
  })

  it('joins both ends when there is an end time', () => {
    expect(formatEventDate('2027-07-10T21:30:00.000Z', '2027-07-11T03:00:00.000Z')).toContain(
      '23:30–05:00',
    )
  })
})

describe('formatLineup', () => {
  it('writes the line-up the way Spanish reads it', () => {
    expect(formatLineup(['Nea Kore'])).toBe('Nea Kore')
    expect(formatLineup(['Nea Kore', 'Kilo'])).toBe('Nea Kore y Kilo')
    expect(formatLineup(['Nea Kore', 'Kilo', 'Tere'])).toBe('Nea Kore, Kilo y Tere')
  })

  it('ignores empty names, which is what an unfilled guest row leaves behind', () => {
    expect(formatLineup(['Nea Kore', '', 'Kilo'])).toBe('Nea Kore y Kilo')
  })
})
