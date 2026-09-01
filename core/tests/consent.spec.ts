import { describe, it, expect } from 'vitest'
import { BANNER_OFF_WARNING, needsCookieBanner } from '../src/lib/consent.js'
import { cookiePolicy } from '../src/lib/legalTexts.js'
import type { LegalSettings } from '../src/lib/types.js'

const text = (sections: { paragraphs: string[] }[]) => sections.flatMap((s) => s.paragraphs).join(' ')

/**
 * The rule is not "does this site use third-party things" but "is there something the
 * visitor must decide **before** they act". A player asks when someone presses it;
 * measurement does not ask at all unless a banner asks for it.
 */
describe('needsCookieBanner', () => {
  it('hace falta si la medición espera consentimiento', () => {
    expect(needsCookieBanner({ analyticsRequiresConsent: true })).toBe(true)
  })

  it('no hace falta si la medición no lo espera: los reproductores piden en su sitio', () => {
    // Una web llena de audio embebido puede no necesitar banner, y una con solo un contador
    // de visitas sí. Es la distinción que hace útil esta función.
    expect(needsCookieBanner({ analyticsRequiresConsent: false })).toBe(false)
  })

  it('obedece a quien lo fuerza en un sentido o en otro', () => {
    expect(needsCookieBanner({ mode: 'never', analyticsRequiresConsent: true })).toBe(false)
    expect(needsCookieBanner({ mode: 'always', analyticsRequiresConsent: false })).toBe(true)
  })

  it('sin decir nada, decide sola', () => {
    expect(needsCookieBanner({ mode: null, analyticsRequiresConsent: true })).toBe(true)
  })

  it('la advertencia dice las dos consecuencias, no una', () => {
    expect(BANNER_OFF_WARNING).toContain('no se carga nunca')
    expect(BANNER_OFF_WARNING).toContain('reproductores siguen funcionando')
  })
})

describe('la política de cookies dice la verdad en los tres casos', () => {
  const settings = (extra: Partial<LegalSettings>) => ({ siteName: 'X', ...extra }) as LegalSettings

  it('con consentimiento: se mide después de aceptar', () => {
    expect(text(cookiePolicy(settings({ analyticsConsent: true })))).toContain('no se carga hasta que aceptas')
  })

  it('sin consentimiento: se mide sin preguntar, y lo dice', () => {
    // Antes afirmaba "no medimos las visitas" mientras las medía: una frase falsa en la
    // página que existe precisamente para no mentir.
    const body = text(cookiePolicy(settings({ analyticsConsent: false })))

    expect(body).toContain('se carga sin pedirte permiso')
    expect(body).not.toContain('No medimos las visitas')
  })

  it('sin banner y con consentimiento exigido: no se mide, y lo dice', () => {
    const body = text(cookiePolicy(settings({ analyticsConsent: true, cookieBanner: 'never' })))

    expect(body).toContain('No medimos las visitas')
  })
})
