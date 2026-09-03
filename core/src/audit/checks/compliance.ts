import { type Fetched, type Finding, fail, ok } from '../types.js'

/**
 * Lo que puede acabar en una multa o en un disgusto: cabeceras de seguridad, las páginas
 * legales obligatorias y que nada rastree a nadie antes de que lo consienta.
 */

// ── seguridad ───────────────────────────────────────────────────────────────────────────

const GATE_SEC = 'seguridad'

/**
 * The four headers that cost nothing and are always forgotten.
 *
 * `frame-ancestors` is the one that matters most here: without it the admin panel can be
 * framed by another site and someone tricked into clicking where they do not think they are.
 */
export const REQUIRED_HEADERS: { name: string; expect: RegExp; why: string }[] = [
  {
    name: 'x-content-type-options',
    expect: /nosniff/i,
    why: 'Sin esto, una imagen subida al panel puede acabar interpretándose como script.',
  },
  {
    name: 'referrer-policy',
    expect: /strict-origin|no-referrer|same-origin/i,
    why: 'Al salir del sitio se manda la ruta completa, que puede llevar datos.',
  },
  {
    name: 'content-security-policy',
    expect: /frame-ancestors/i,
    why: 'Es lo que impide que el panel se meta en un iframe ajeno (clickjacking).',
  },
  {
    name: 'permissions-policy',
    expect: /camera|microphone|geolocation/i,
    why: 'Niega cámara, micrófono y ubicación, que la web no usa.',
  },
]

export function checkSecurityHeaders(page: Fetched): Finding[] {
  return REQUIRED_HEADERS.map(({ name, expect, why }) => {
    const value = page.headers[name]
    if (!value) return fail(GATE_SEC, `Cabecera ${name}`, `No viaja. ${why}`)
    return expect.test(value)
      ? ok(GATE_SEC, `Cabecera ${name}`, value)
      : fail(GATE_SEC, `Cabecera ${name}`, `Vale "${value}", que no cumple. ${why}`)
  })
}

// ── legal y consentimiento ──────────────────────────────────────────────────────────────

const GATE_LEGAL = 'legal'
const GATE_CONSENT = 'consentimiento'

/**
 * A site with a form needs the three pages, and needs them **linked**: one that exists but
 * is reachable only by typing the address protects nobody.
 */
export function checkLegalPages(pages: Fetched[], home: Fetched): Finding[] {
  const findings: Finding[] = pages.map((page) => {
    const path = new URL(page.url).pathname
    return page.status === 200
      ? ok(GATE_LEGAL, `Existe ${path}`)
      : fail(GATE_LEGAL, `Existe ${path}`, `Devuelve ${page.status}.`)
  })

  const unlinked = pages
    .map((page) => new URL(page.url).pathname)
    .filter((path) => !home.body.includes(`href="${path}"`))
  findings.push(
    unlinked.length
      ? fail(
          GATE_LEGAL,
          'Las páginas legales se enlazan desde la portada',
          `Sin enlace: ${unlinked.join(', ')}.`,
        )
      : ok(GATE_LEGAL, 'Las páginas legales se enlazan desde la portada'),
  )

  return findings
}

const THIRD_PARTY_FRAMES =
  /<iframe[^>]+src="https?:\/\/(?!(?:[a-z0-9-]+\.)*(?:localhost|127\.0\.0\.1))/i

/**
 * **No third-party iframe may be in the HTML before anyone accepts.**
 *
 * This is the gate that turns the cookie banner from theatre into something real: a player
 * that ships in the first response has already set its cookies, whatever the banner says.
 */
export function checkConsentGating(pages: Fetched[]): Finding[] {
  const offenders = pages.filter((page) => THIRD_PARTY_FRAMES.test(page.body))

  return [
    offenders.length
      ? fail(
          GATE_CONSENT,
          'Ningún reproductor de terceros carga antes de aceptar',
          `En ${offenders.map((p) => new URL(p.url).pathname).join(', ')}.`,
        )
      : ok(GATE_CONSENT, 'Ningún reproductor de terceros carga antes de aceptar'),
  ]
}
