import { describe, it, expect } from 'vitest'
import type { LegalSettings } from '../src/lib/types'
import { cookiePolicy, legalNotice, privacyPolicy } from '../src/lib/legalTexts'

const settings = (extra: Partial<LegalSettings> = {}) =>
  ({ siteName: 'Subsuelo', ...extra }) as LegalSettings

const text = (sections: { paragraphs: string[] }[]) =>
  sections.flatMap((s) => s.paragraphs).join(' ')

/**
 * The pages are generated so they cannot be forgotten, and they leave out what the client
 * has not filled in: a privacy policy naming the wrong controller is worse than one that
 * names none.
 */
describe('legal notice', () => {
  it('names the holder with the details that were filled in', () => {
    const sections = legalNotice(
      settings({
        legalHolder: 'Asociación Cultural Subsuelo',
        legalId: 'G00000000',
        legalAddress: 'Calle de ejemplo 1, Madrid',
        email: 'hola@subsuelo.es',
      }),
      'https://ejemplo.es',
    )

    expect(text(sections)).toContain('Asociación Cultural Subsuelo')
    expect(text(sections)).toContain('NIF G00000000')
    expect(text(sections)).toContain('Calle de ejemplo 1, Madrid')
  })

  it('says nothing about a holder that has not been filled in', () => {
    const sections = legalNotice(settings(), 'https://ejemplo.es')

    expect(text(sections)).not.toContain('NIF')
    expect(text(sections)).not.toContain('Titular:')
  })
})

describe('privacy policy', () => {
  it('points at the address for exercising rights, preferring the legal one', () => {
    const sections = privacyPolicy(
      settings({ email: 'hola@subsuelo.es', legalEmail: 'datos@subsuelo.es' }),
    )

    expect(text(sections)).toContain('datos@subsuelo.es')
    expect(text(sections)).not.toContain('hola@subsuelo.es')
  })

  it('mentions the processors that really see the data', () => {
    const body = text(privacyPolicy(settings()))

    expect(body).toContain('Vercel')
    expect(body).toContain('Neon')
    expect(body).toContain('Resend')
    expect(body).toContain('Agencia Española de Protección de Datos')
  })
})

describe('cookie policy', () => {
  it('describes measurement as consented when the panel says so', () => {
    expect(text(cookiePolicy(settings({ analyticsConsent: true })))).toContain('Vercel Analytics')
  })

  it('says plainly that nothing is measured when it is switched off', () => {
    const body = text(cookiePolicy(settings({ analyticsConsent: false })))

    expect(body).toContain('No medimos las visitas')
    expect(body).not.toContain('Vercel Analytics')
  })
})
