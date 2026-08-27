import { describe, it, expect } from 'vitest'
import {
  countSince,
  exceedsGlobalCeiling,
  IP_WINDOW_MS,
  MAX_GLOBAL,
  MAX_PER_IP,
  recordSubmission,
  requestIp,
} from '../src/lib/rateLimit'

/**
 * Each submission sends two emails, one to the address typed in the form. Without these
 * brakes the site is a way to mail third parties, which burns the sending domain.
 */
describe('per-IP brake', () => {
  it('allows up to the cap inside the window, then refuses', () => {
    const now = 1_000_000
    let marks: number[] = []

    for (let i = 0; i < MAX_PER_IP; i++) {
      const result = recordSubmission(marks, now + i)
      expect(result.allowed).toBe(true)
      marks = result.marks
    }

    expect(recordSubmission(marks, now + MAX_PER_IP).allowed).toBe(false)
  })

  it('forgets what falls out of the window, so the list cannot grow forever', () => {
    const old = [1, 2, 3]
    // Past the window measured from the *last* mark, so none of the three survives.
    const result = recordSubmission(old, 3 + IP_WINDOW_MS + 1)

    expect(result.allowed).toBe(true)
    expect(result.marks).toHaveLength(1)
  })
})

describe('requestIp', () => {
  it('takes the client, which is the first of the forwarded chain', () => {
    const headers = new Headers({ 'x-forwarded-for': '10.0.0.1, 70.41.3.18, 150.172.238.178' })

    expect(requestIp(headers)).toBe('10.0.0.1')
  })

  it('falls back to x-real-ip, and to nothing at all in local development', () => {
    expect(requestIp(new Headers({ 'x-real-ip': '10.0.0.2' }))).toBe('10.0.0.2')
    // No header means no one to count: the per-IP brake is skipped and the global ceiling
    // still stands. Refusing everything here would break development.
    expect(requestIp(new Headers())).toBeNull()
  })
})

describe('global ceiling', () => {
  it('trips at the cap, not before', () => {
    expect(exceedsGlobalCeiling(MAX_GLOBAL - 1)).toBe(false)
    expect(exceedsGlobalCeiling(MAX_GLOBAL)).toBe(true)
  })

  it('counts backwards from now', () => {
    const now = Date.parse('2027-01-01T12:00:00.000Z')

    expect(countSince(now).toISOString()).toBe('2027-01-01T11:00:00.000Z')
  })
})
