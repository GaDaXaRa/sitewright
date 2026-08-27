import { describe, it, expect } from 'vitest'
import { escapeHtml } from '../src/lib/html.js'

/**
 * Public forms end up in someone's inbox. Unescaped, anyone could slip a link — or an
 * alarming notice dressed as a system message — into an email signed by the site itself.
 */
describe('escapeHtml', () => {
  it('neutralises a script tag', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('escapes the ampersand first, so nothing is escaped twice', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('escapes both kinds of quote, which is what breaks out of an attribute', () => {
    expect(escapeHtml(`"onmouseover='x'`)).toBe('&quot;onmouseover=&#39;x&#39;')
  })

  it('writes an empty string for nothing at all, never "null"', () => {
    expect(escapeHtml(null)).toBe('')
    expect(escapeHtml(undefined)).toBe('')
  })

  it('leaves ordinary text alone', () => {
    expect(escapeHtml('Nea Kore & Kilo')).toBe('Nea Kore &amp; Kilo')
    expect(escapeHtml(42)).toBe('42')
  })
})
