import { type Fetched, type Finding, fail, ok, skip, warn } from '../types.js'
import { contrastRatio } from '../../lib/color.js'

/**
 * Lo que ve quien entra: imágenes servidas como deben, ningún texto de relleno olvidado,
 * contraste suficiente para leer y una página que no pese de más.
 */

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
  'Lugar por decidir',
  'cámbialo',
  // Frases enteras del seed, no trozos. `'Aquí va'` y `'de ejemplo'` estaban aquí sueltas
  // y son español corriente: una web que explique con un ejemplo cómo se apunta alguien a
  // un taller salía marcada por escribir bien.
  'Aquí va la explicación larga',
  'Aquí va la respuesta',
  'Pieza de ejemplo',
  'Aviso de ejemplo',
  'Cámbiala por la tuya',
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

// ── portada ─────────────────────────────────────────────────────────────────────────────

const GATE_HERO = 'portada'

/**
 * Que el título de la portada se lea encima de la foto.
 *
 * Es el hueco que dejaba la puerta de contraste: mide pares de la paleta, y «texto sobre
 * foto» no es un par de tokens —depende de una imagen que alguien sube después—. Sin
 * descargar la foto sí se puede juzgar el caso que de verdad rompió una web: quitar el
 * velo y dejar un texto del mismo color que el fondo del sitio. El título existe, está en
 * el código, y no se ve.
 */
export function checkHeroLegibility(home: Fetched, css: string): Finding[] {
  const title = 'El título de la portada se lee sobre la foto'
  const hero = home.body.match(/<header[^>]*class="([^"]*hero[^"]*)"/)?.[1]

  if (!hero || !/\bhero-has-image\b/.test(hero)) {
    return [skip(GATE_HERO, title, 'La portada no lleva foto de fondo.')]
  }

  const veil = hero.match(/\bshade-(full|text|none)\b/)?.[1] ?? 'full'
  if (veil !== 'none') {
    return [ok(GATE_HERO, title, veil === 'full' ? 'La foto se oscurece entera.' : 'Se oscurece detrás del texto.')]
  }

  const tokens = cssTokens(css)
  const ground: string | undefined = tokens['ground']
  const ink: string | undefined = /\bink-dark\b/.test(hero)
    ? tokens['on-photo-alt']
    : tokens['on-photo']

  if (!ground || !ink) {
    return [skip(GATE_HERO, title, 'No se pudo leer el color del texto en la hoja de estilos.')]
  }

  // Sin velo, lo único medible es el propio color del texto. Si además coincide con el
  // fondo de la web, no hay foto que lo salve: es el fallo exacto que llegó a producción.
  // Un color que no se entiende no se juzga: `contrastRatio` devuelve null y se pasa.
  const ratio = contrastRatio(ink, ground)
  if (ratio !== null && ratio < 1.5) {
    return [
      fail(
        GATE_HERO,
        title,
        `Sin oscurecer la foto y con el texto en ${ink}, que es el color del fondo de la web. ` +
          'Elige el otro color de texto, o vuelve a oscurecer la foto.',
      ),
    ]
  }

  return [
    warn(
      GATE_HERO,
      title,
      'La foto no se oscurece, así que la legibilidad depende de la imagen. Míralo antes de publicar.',
    ),
  ]
}
