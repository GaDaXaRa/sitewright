import { type Fetched, type Finding, fail, ok, skip, warn } from './types.js'
import { contrastRatio } from '../lib/color.js'

/**
 * The rest of the gates: GEO, legal, consent, images, contrast and weight.
 *
 * Same rule as the others — each one is here because it went wrong somewhere real.
 */

// ── GEO ─────────────────────────────────────────────────────────────────────────────────

const GATE_GEO = 'geo'

/**
 * `/llms.txt` is what an assistant reads instead of guessing from HTML. Two things can be
 * checked cheaply and both have bitten: that it exists at all, and that nothing leaked into
 * it that the CMS never said — "undefined", "null" or an empty euro sign.
 */
export function checkLlmsTxt(llms: Fetched, siteName?: string): Finding[] {
  if (llms.status !== 200) {
    return [fail(GATE_GEO, 'Hay /llms.txt', `Devuelve ${llms.status}.`)]
  }

  const findings: Finding[] = [ok(GATE_GEO, 'Hay /llms.txt', `${llms.body.length} caracteres.`)]

  const leaks = ['undefined', 'null', 'NaN', 'Invalid Date', '[object Object]'].filter((leak) =>
    llms.body.includes(leak),
  )
  findings.push(
    leaks.length
      ? fail(GATE_GEO, 'No se cuela nada que el CMS no dijo', `Aparece: ${leaks.join(', ')}.`)
      : ok(GATE_GEO, 'No se cuela nada que el CMS no dijo'),
  )

  if (siteName) {
    findings.push(
      llms.body.includes(siteName)
        ? ok(GATE_GEO, 'El resumen nombra al negocio')
        : warn(GATE_GEO, 'El resumen nombra al negocio', `No aparece "${siteName}".`),
    )
  }

  return findings
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

// ── imágenes ────────────────────────────────────────────────────────────────────────────

const GATE_IMG = 'imagenes'

/**
 * Every image needs alternative text, and photos need responsive sizes.
 *
 * A decorative image says so with an empty alt; one with no alt attribute at all is a
 * screen reader reading out a file name.
 */
export function checkImages(pages: Fetched[]): Finding[] {
  const tags = pages.flatMap((page) =>
    [...page.body.matchAll(/<img\b[^>]*>/g)].map((m) => ({ tag: m[0], page: page.url })),
  )

  if (!tags.length) return [ok(GATE_IMG, 'Las imágenes llevan texto alternativo', 'No hay <img>.')]

  // Sin distinguir mayúsculas: React sirve `srcSet` con la S grande, y buscando `srcset` la
  // puerta marcaba como sin optimizar cada imagen que sí lo estaba.
  const noAlt = tags.filter(({ tag }) => !/\balt=/i.test(tag))
  const noSizes = tags.filter(({ tag }) => !/\bsrcset=/i.test(tag) && !/\bwidth=/i.test(tag))

  return [
    noAlt.length
      ? fail(
          GATE_IMG,
          'Las imágenes llevan texto alternativo',
          `${noAlt.length} de ${tags.length} sin alt (${new URL(noAlt[0]!.page).pathname}).`,
        )
      : ok(GATE_IMG, 'Las imágenes llevan texto alternativo', `${tags.length} imágenes.`),
    noSizes.length
      ? warn(
          GATE_IMG,
          'Las fotos se sirven a la medida de la pantalla',
          `${noSizes.length} sin srcset ni width: se descargan enteras en el móvil.`,
        )
      : ok(GATE_IMG, 'Las fotos se sirven a la medida de la pantalla'),
  ]
}

// ── contenido ───────────────────────────────────────────────────────────────────────────

const GATE_CONTENT = 'contenido'

/**
 * The example text the seed writes, still live on the site.
 *
 * It warns rather than fails: a site under construction is allowed to have placeholders,
 * and a gate that blocks a legitimate work-in-progress deploy gets switched off. But
 * shipping "Dos o tres líneas contando de qué va" to a real audience is the kind of thing
 * nobody notices until a client does, because drafted copy reads exactly like written copy.
 */
export const PLACEHOLDERS = [
  'Esto es un ejemplo',
  'Dos o tres líneas contando',
  'Nombre Apellido',
  'Su papel aquí',
  'Aquí va',
  'Lugar por decidir',
  'de ejemplo',
  'cámbialo',
]

export function checkPlaceholders(pages: Fetched[]): Finding[] {
  const found = pages.flatMap((page) =>
    PLACEHOLDERS.filter((text) => page.body.includes(text)).map((text) => ({
      text,
      path: new URL(page.url).pathname,
    })),
  )

  if (!found.length) return [ok(GATE_CONTENT, 'No queda texto de ejemplo publicado')]

  const unique = [...new Set(found.map((f) => `"${f.text}" (${f.path})`))]
  return [
    warn(
      GATE_CONTENT,
      'No queda texto de ejemplo publicado',
      `Sigue el relleno del seed: ${unique.slice(0, 3).join(', ')}${unique.length > 3 ? `, y ${unique.length - 3} más` : ''}.`,
    ),
  ]
}

// ── contraste ───────────────────────────────────────────────────────────────────────────

const GATE_CONTRAST = 'contraste'

/** Reads the `--token: #hex` declarations out of a stylesheet. */
export function cssTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  for (const [, name, value] of css.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*[;}]/g)) {
    if (!(name! in tokens)) tokens[name!] = value!
  }
  return tokens
}

/**
 * The colours a person reads, measured instead of eyeballed.
 *
 * A grey picked by eye fails AA more often than not: on the first site built this way,
 * `--ink-faint` came out at 3.67:1 against the background — below the 4.5:1 normal text
 * needs — and it was used for the footer, the breadcrumbs and every small label.
 *
 * **Pass text pairs only.** A border or a divider is not read, and WCAG asks 3:1 of it, not
 * 4.5:1: measuring `--line` here reports a failure that is not one.
 */
export function checkContrast(
  css: string,
  pairs: [string, string][] = [
    ['ink', 'ground'],
    ['ink-soft', 'ground'],
    ['ink-faint', 'ground'],
    ['accent', 'ground'],
    // The one nobody was measuring: text on the loud button.
    ['on-accent', 'accent'],
    ['ink-soft', 'surface'],
    ['ink-faint', 'surface'],
  ],
): Finding[] {
  const tokens = cssTokens(css)

  const findings = pairs
    .map(([fg, bg]) => {
      const [a, b] = [tokens[fg], tokens[bg]]
      if (!a || !b) return null
      const ratio = contrastRatio(a, b)
      if (ratio === null) return null

      const label = `--${fg} sobre --${bg}`
      const value = `${ratio.toFixed(2)}:1 (${a} sobre ${b})`
      return ratio >= 4.5
        ? ok(GATE_CONTRAST, label, value)
        : fail(GATE_CONTRAST, label, `${value}, por debajo del 4,5:1 que pide el AA.`)
    })
    .filter(Boolean) as Finding[]

  // A gate that measures nothing has to say so. With different token names this check used
  // to vanish from the report, which reads exactly like passing.
  return findings.length
    ? findings
    : [
        skip(
          GATE_CONTRAST,
          'Contraste de la paleta',
          `Ninguna pareja de tokens coincide (${pairs.map(([a, b]) => `--${a}/--${b}`).join(', ')}). Pásalas con --contrast-pairs si esta paleta los llama de otra forma.`,
        ),
      ]
}

// ── peso ────────────────────────────────────────────────────────────────────────────────

const GATE_WEIGHT = 'peso'

/** A rough ceiling on the HTML itself, which is what has to arrive before anything paints. */
export function checkWeight(pages: Fetched[], maxBytes = 250_000): Finding[] {
  return pages.map((page) => {
    const bytes = Buffer.byteLength(page.body, 'utf8')
    const path = new URL(page.url).pathname
    return bytes <= maxBytes
      ? ok(GATE_WEIGHT, `HTML de ${path}`, `${Math.round(bytes / 1024)} KB`)
      : warn(
          GATE_WEIGHT,
          `HTML de ${path}`,
          `${Math.round(bytes / 1024)} KB, por encima de ${Math.round(maxBytes / 1024)} KB.`,
        )
  })
}
