import { describe, it, expect } from 'vitest'
import type { LegalSettings } from '../src/lib/types.js'
import { cookiePolicy, legalNotice, privacyPolicy } from '../src/lib/legalTexts.js'

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

describe('the shape of the pages', () => {
  it('always writes every section, each with something in it', () => {
    for (const sections of [
      legalNotice(settings(), 'https://ejemplo.es'),
      privacyPolicy(settings()),
      cookiePolicy(settings()),
    ]) {
      expect(sections.length).toBeGreaterThan(3)
      for (const section of sections) {
        expect(section.heading).not.toBe('')
        expect(section.paragraphs.length).toBeGreaterThan(0)
        expect(section.paragraphs.every((p) => p.length > 20)).toBe(true)
      }
    }
  })

  it('names the site where the text speaks about it, or falls back to a neutral wording', () => {
    expect(text(legalNotice(settings({ siteName: 'Subsuelo' }), 'https://ejemplo.es'))).toContain(
      'Subsuelo',
    )
    expect(text(legalNotice(settings({ siteName: null }), 'https://ejemplo.es'))).toContain(
      'este sitio',
    )
  })

  it('prints the site address it is given', () => {
    expect(text(legalNotice(settings(), 'https://subsuelo.example'))).toContain(
      'https://subsuelo.example',
    )
  })

  it('adds each legal detail only when it exists', () => {
    const withId = text(legalNotice(settings({ legalHolder: 'X', legalId: 'G1' }), 'https://e.es'))
    const withoutId = text(legalNotice(settings({ legalHolder: 'X' }), 'https://e.es'))
    const withAddress = text(
      legalNotice(settings({ legalHolder: 'X', legalAddress: 'Calle 1' }), 'https://e.es'),
    )

    expect(withId).toContain('NIF G1')
    expect(withoutId).not.toContain('NIF')
    expect(withoutId).not.toContain('con domicilio en')
    expect(withAddress).toContain('con domicilio en Calle 1')
  })

  it('offers a contact address in the notice only when there is one', () => {
    expect(
      text(legalNotice(settings({ legalHolder: 'X', email: 'hola@e.es' }), 'https://e.es')),
    ).toContain('Contacto: hola@e.es')
    expect(text(legalNotice(settings({ legalHolder: 'X' }), 'https://e.es'))).not.toContain(
      'Contacto:',
    )
  })

  it('falls back to the ordinary contact email for rights when there is no legal one', () => {
    expect(text(privacyPolicy(settings({ email: 'hola@e.es' })))).toContain('hola@e.es')
    // With neither, it must not write a dangling "escribiendo a".
    expect(text(privacyPolicy(settings()))).not.toContain('escribiendo a')
  })
})

describe('with nothing filled in at all', () => {
  it('still writes the three pages instead of blowing up', () => {
    // A site can be deployed before the client fills in "Datos legales", and the pages are
    // linked from the footer from day one.
    expect(() => legalNotice(null, 'https://e.es')).not.toThrow()
    expect(privacyPolicy(undefined).length).toBeGreaterThan(3)
    expect(cookiePolicy(null).length).toBeGreaterThan(3)
    expect(text(legalNotice(undefined, 'https://e.es'))).toContain('este sitio')
  })

  it('keeps the notice whole, saying only what it can say', () => {
    const sections = legalNotice(settings(), 'https://e.es')

    expect(sections.map((s) => s.heading)).toEqual([
      'Titular del sitio',
      'Objeto',
      'Propiedad intelectual',
      'Responsabilidad',
      'Legislación aplicable',
    ])
    // With no holder filled in, that section is the web address and nothing else — never
    // an invented name.
    expect(sections[0].paragraphs).toEqual(['Dirección de la web: https://e.es.'])
  })

  it('keeps every section of the privacy and cookie pages, which never depend on the client', () => {
    expect(privacyPolicy(settings()).map((s) => s.heading)).toEqual([
      'Quién trata tus datos',
      'Qué datos recogemos y para qué',
      'Con qué legitimación',
      'Cuánto tiempo los guardamos',
      'Quién más los ve',
      'Tus derechos',
    ])
    expect(cookiePolicy(settings()).map((s) => s.heading)).toEqual([
      'Qué usamos',
      'Medición de visitas',
      'Reproductores de terceros',
      'Cómo cambiar de opinión',
    ])
  })

  it('treats an unset analytics switch as "ask for consent"', () => {
    // The safe reading has to be the default: a site that never touched the box measures
    // only after the visitor accepts.
    expect(text(cookiePolicy(settings()))).toContain('Vercel Analytics')
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

  it('says that measurement happens without asking when consent is not required', () => {
    // This test used to assert "no medimos las visitas", which was false: with the flag off
    // the site measures, it just does not ask first. A wrong sentence in the page whose job
    // is to be true.
    const body = text(cookiePolicy(settings({ analyticsConsent: false })))

    expect(body).toContain('se carga sin pedirte permiso')
    expect(body).toContain('Vercel Analytics')
  })
})
