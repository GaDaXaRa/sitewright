import { describe, it, expect } from 'vitest'
import type { LegalSettings } from '../src/lib/types.js'
import {
  cookiePolicy,
  legalNotice,
  privacyPolicy,
  type LegalProfile,
} from '../src/lib/legalTexts.js'

const settings = (extra: Partial<LegalSettings> = {}) =>
  ({ siteName: 'Bajocero', ...extra }) as LegalSettings

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
        legalHolder: 'Asociación Cultural Bajocero',
        legalId: 'G00000000',
        legalAddress: 'Calle de ejemplo 1, Madrid',
        email: 'hola@bajocero.example',
      }),
      'https://ejemplo.es',
    )

    expect(text(sections)).toContain('Asociación Cultural Bajocero')
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
    expect(text(legalNotice(settings({ siteName: 'Bajocero' }), 'https://ejemplo.es'))).toContain(
      'Bajocero',
    )
    expect(text(legalNotice(settings({ siteName: null }), 'https://ejemplo.es'))).toContain(
      'este sitio',
    )
  })

  it('prints the site address it is given', () => {
    expect(text(legalNotice(settings(), 'https://bajocero.example'))).toContain(
      'https://bajocero.example',
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
      settings({ email: 'hola@bajocero.example', legalEmail: 'datos@bajocero.example' }),
    )

    expect(text(sections)).toContain('datos@bajocero.example')
    expect(text(sections)).not.toContain('hola@bajocero.example')
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

/**
 * The pages used to describe the first site, a DJ collective, on every site: sessions,
 * venues and bookings on an association's notice, a city and a date in the policy of a
 * form that asks for neither. What they say now comes from what the site is made of.
 */
describe('what the site is made of', () => {
  const profile = (modules: string[], formFields: string[] = []): LegalProfile => ({
    modules,
    formFields,
  })
  const objeto = (p?: LegalProfile, extra: Partial<LegalSettings> = {}) =>
    legalNotice(settings(extra), 'https://e.es', p)[1].paragraphs[0]

  it('lists what the site publishes, and nothing when it publishes none of it', () => {
    expect(objeto(profile(['about', 'faq']))).toContain('la actividad de Bajocero.')
    expect(objeto(profile(['pricing']))).toContain('de Bajocero: las tarifas.')
    expect(objeto(profile(['timetable', 'pricing']))).toContain(': los horarios y las tarifas.')
    expect(objeto(profile(['contact', 'schedule', 'media']))).toContain(
      ': las grabaciones de audio y vídeo, las fechas anunciadas y la forma de ponerse en contacto.',
    )
  })

  it('speaks of the work of a person and of the activity of anything else', () => {
    expect(objeto(profile([]), { schemaType: 'Person' })).toContain('el trabajo de Bajocero')
    expect(objeto(profile([]), { schemaType: 'NGO' })).toContain('la actividad de Bajocero')
  })

  it('warns that dates can change only on a site that announces dates or timetables', () => {
    const notice = (modules: string[]) => text(legalNotice(settings(), 'https://e.es', profile(modules)))

    expect(notice(['schedule'])).toContain('pueden cambiar')
    expect(notice(['timetable'])).toContain('pueden cambiar')
    expect(notice(['catalog', 'contact'])).not.toContain('pueden cambiar')
    // Not a blank line in its place either: only the sentence about linked sites.
    expect(legalNotice(settings(), 'https://e.es', profile(['catalog']))[3].paragraphs).toHaveLength(1)
  })

  it('mentions third-party players only on a site that embeds them', () => {
    const notice = (modules: string[]) => text(legalNotice(settings(), 'https://e.es', profile(modules)))
    const cookies = (modules: string[]) => cookiePolicy(settings(), profile(modules))

    expect(notice(['media'])).toContain('reproductores incrustados')
    expect(notice(['media'])).toContain('plataformas donde se aloja el contenido incrustado')
    expect(notice(['schedule'])).not.toContain('incrustad')
    expect(legalNotice(settings(), 'https://e.es', profile(['schedule']))[2].paragraphs).toHaveLength(1)
    expect(text(cookies(['media']))).toContain('SoundCloud, Mixcloud, YouTube o Bandcamp')
    expect(cookies(['schedule', 'contact']).map((s) => s.heading)).toEqual([
      'Qué usamos',
      'Medición de visitas',
      'Cómo cambiar de opinión',
    ])
  })

  it('lists the fields the form really asks, in its order, and none of the panel’s own', () => {
    const body = text(
      privacyPolicy(
        settings(),
        profile(['contact'], ['message', 'status', 'email', 'name', 'consentAt', 'phone']),
      ),
    )

    expect(body).toContain('en el formulario: nombre, email, teléfono si lo pones y tu mensaje.')
    expect(body).not.toContain('ciudad')
    expect(body).not.toContain('fecha,')
  })

  it('names each optional field when the form has it', () => {
    const body = text(
      privacyPolicy(
        settings(),
        profile(['contact'], ['name', 'kind', 'interest', 'city', 'eventDate', 'message']),
      ),
    )

    expect(body).toContain(
      'nombre, qué tipo de petición es, qué te interesa de lo que ofrecemos, ciudad, fecha y tu mensaje.',
    )
  })

  it('speaks of the form without listing fields it was not told about', () => {
    expect(text(privacyPolicy(settings(), profile(['contact'])))).toContain(
      'Solo los que escribes en el formulario.',
    )
  })

  it('says that a site with no form asks for nothing, and drops what only a form needs', () => {
    const sections = privacyPolicy(settings(), profile(['about', 'media']))

    expect(sections.map((s) => s.heading)).toEqual([
      'Quién trata tus datos',
      'Qué datos recogemos y para qué',
      'Quién más los ve',
      'Tus derechos',
    ])
    expect(text(sections)).toContain('no te pide ningún dato personal')
    expect(text(sections)).not.toContain('Resend')
    // Someone still sees the visit: whoever hosts the site.
    expect(sections[2].paragraphs.join(' ')).toContain('Vercel')
    expect(text(sections)).not.toContain('del formulario')
    expect(text(sections)).not.toContain('envíos masivos')
  })

  it('points somewhere to write that exists, when no holder is filled in', () => {
    const who = (p: LegalProfile, extra: Partial<LegalSettings> = {}) =>
      privacyPolicy(settings(extra), p)[0].paragraphs

    expect(who(profile(['contact']))).toEqual([
      'Puedes escribirnos a través del formulario de esta web.',
    ])
    expect(who(profile([]), { email: 'hola@e.es' })).toEqual(['Puedes escribirnos a hola@e.es.'])
    expect(who(profile([]))[0]).toContain('medios de contacto')
    expect(who(profile([]), { legalHolder: 'X', email: 'hola@e.es' })[0]).toContain('Titular: X')
  })

  it('keeps every disclosure on a site whose pages do not say what it is made of', () => {
    // Sites whose pages were generated before the profile existed call without it. They
    // must not lose a disclosure on updating the core; they just stop being specific.
    const notice = text(legalNotice(settings(), 'https://e.es'))
    const privacy = privacyPolicy(settings())

    expect(objeto()).toContain('la actividad de Bajocero.')
    expect(notice).toContain('pueden cambiar')
    expect(notice).toContain('reproductores incrustados')
    expect(privacy).toHaveLength(6)
    expect(text(privacy)).toContain('Solo los que escribes en el formulario.')
    expect(text(privacy)).toContain('Resend')
    expect(text(cookiePolicy(settings()))).toContain('Bandcamp')
  })
})
