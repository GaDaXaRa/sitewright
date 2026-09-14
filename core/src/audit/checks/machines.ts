import { type Fetched, type Finding, fail, ok, skip, warn } from '../types.js'

/**
 * Lo que leen las máquinas y no las personas: el grafo de datos estructurados, el resumen
 * que se dejan los modelos de lenguaje, y la tarjeta que arma quien pega el enlace en un
 * chat —que la lee una persona, pero la construye un rastreador—.
 */

// ── datos estructurados ─────────────────────────────────────────────────────────────────

const GATE_LD = 'datos-estructurados'

export function jsonLdOf(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => {
      try {
        return JSON.parse(m[1]!)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

type Node = { '@type'?: string; '@id'?: string; [key: string]: unknown }

export function graphOf(blocks: unknown[]): Node[] {
  return blocks.flatMap((block) => {
    const b = block as { '@graph'?: Node[] }
    return Array.isArray(b['@graph']) ? b['@graph'] : [block as Node]
  })
}

/**
 * The markup has to parse, name the business, and **resolve its own references**.
 *
 * A dangling `@id` is worse than no markup: it says "this thing is described elsewhere" and
 * then it is not, so a search engine drops the lot.
 */
export function checkStructuredData(home: Fetched, siteUrl: string): Finding[] {
  const findings: Finding[] = []
  const blocks = jsonLdOf(home.body)

  if (!blocks.length) {
    return [fail(GATE_LD, 'La portada lleva JSON-LD', 'No hay ningún bloque application/ld+json.')]
  }

  const unparsed = (home.body.match(/type="application\/ld\+json"/g) ?? []).length - blocks.length
  if (unparsed > 0) {
    findings.push(fail(GATE_LD, 'El JSON-LD es JSON válido', `${unparsed} bloques no se parsean.`))
  }

  const nodes = graphOf(blocks)
  const types = nodes.map((n) => n['@type']).filter(Boolean) as string[]

  findings.push(
    types.length
      ? ok(GATE_LD, 'El JSON-LD declara tipos', types.join(', '))
      : fail(GATE_LD, 'El JSON-LD declara tipos', 'Ningún nodo tiene @type.'),
  )

  const host = new URL(siteUrl).host
  const strayIds = nodes
    .map((n) => n['@id'])
    .filter((id): id is string => typeof id === 'string')
    .filter((id) => {
      try {
        return new URL(id).host !== host
      } catch {
        return true
      }
    })
  findings.push(
    strayIds.length
      ? fail(GATE_LD, 'Los @id son del dominio del sitio', `El primero: ${strayIds[0]}.`)
      : ok(GATE_LD, 'Los @id son del dominio del sitio'),
  )

  // Every reference has to point at a node that is actually in the graph.
  const declared = new Set(nodes.map((n) => n['@id']).filter(Boolean) as string[])
  const referenced = new Set<string>()
  const walk = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(walk)
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>)
      for (const [key, inner] of entries) {
        if (key === '@id' && typeof inner === 'string') referenced.add(inner)
        else walk(inner)
      }
    }
  }
  nodes.forEach((node) => {
    const { ['@id']: _own, ...rest } = node
    walk(rest)
  })
  const dangling = [...referenced].filter((id) => !declared.has(id))
  findings.push(
    dangling.length
      ? fail(
          GATE_LD,
          'Las referencias del grafo resuelven',
          `${dangling.length} @id que no existen, el primero ${dangling[0]}.`,
        )
      : ok(GATE_LD, 'Las referencias del grafo resuelven'),
  )

  // An offer with no price is noise: search engines drop it, and it hides the real ones.
  const emptyOffers = nodes.filter((node) => {
    const offers = node.offers as { price?: unknown } | { price?: unknown }[] | undefined
    const list = Array.isArray(offers) ? offers : offers ? [offers] : []
    return list.some((offer) => offer?.price === undefined || offer?.price === null)
  })
  findings.push(
    emptyOffers.length
      ? warn(
          GATE_LD,
          'Ninguna oferta se publica sin precio',
          `${emptyOffers.length} nodos con offers sin price (los buscadores los descartan).`,
        )
      : ok(GATE_LD, 'Ninguna oferta se publica sin precio'),
  )

  return findings
}

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

// ── tarjeta social ──────────────────────────────────────────────────────────────────────

const GATE_SOCIAL = 'social'

/** El contenido de un `<meta>`, sin depender del orden en que vengan sus atributos. */
export function metaContent(html: string, key: string, value: string): string | undefined {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
    const matchesKey = new RegExp(`\\b${key}=["']${value}["']`, 'i').test(tag)
    if (!matchesKey) continue
    const content = tag.match(/\bcontent=["']([^"']*)["']/i)?.[1]
    if (content?.trim()) return content.trim()
  }
  return undefined
}

const titleOf = (html: string) => html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()

/**
 * Lo que se ve cuando alguien comparte una página.
 *
 * Es el sitio por el que más llega la gente a una web pequeña, y las páginas de sección
 * salían con **sólo un título**: compartir `/equipo` por WhatsApp daba un enlace pelado.
 *
 * **Falla**, desde que se ganó el derecho. Nació avisando porque el día que se escribió las
 * dos webs en producción no tenían descripción ni imagen en ninguna sección, y una puerta
 * que pone en rojo lo que nadie ha tenido ocasión de arreglar es una puerta que alguien
 * desactiva. Con las dos corregidas y en verde, avisar ya sólo servía para que la siguiente
 * web naciera con el mismo hueco.
 *
 * La imagen siempre se puede dar —la tarjeta dibujada está ahí para eso—, así que lo único
 * que puede faltar de verdad es el texto, y sale de algo que el cliente escribe una vez.
 */
export function checkSocialCard(pages: Fetched[]): Finding[] {
  const live = pages.filter((page) => page.status === 200)
  if (!live.length) {
    return [skip(GATE_SOCIAL, 'La tarjeta al compartir', 'No se descargó ninguna página que mirar.')]
  }

  const missing: string[] = []
  for (const page of live) {
    const path = new URL(page.url).pathname
    const gaps: string[] = []
    if (!titleOf(page.body)) gaps.push('título')
    if (!metaContent(page.body, 'name', 'description')) gaps.push('descripción')
    if (!metaContent(page.body, 'property', 'og:image')) gaps.push('imagen')
    if (gaps.length) missing.push(`${path} (sin ${gaps.join(' ni ')})`)
  }

  const what = 'La tarjeta al compartir'
  const cuantas = (n: number) => `${n} ${n === 1 ? 'página' : 'páginas'}`

  return [
    missing.length
      ? fail(
          GATE_SOCIAL,
          what,
          `${missing.length} de ${cuantas(live.length)} sin todo lo que necesita una tarjeta: ` +
            `${missing.slice(0, 4).join(', ')}${missing.length > 4 ? `, y ${missing.length - 4} más` : ''}. ` +
            // El mensaje dice dónde se arregla: sin esto, «sin descripción» manda a alguien
            // a buscar por el código un texto que se escribe una vez en el panel.
            'La descripción sale de Ajustes —«descripción para buscadores», el lema o el texto ' +
            'de portada—; la imagen, de la foto de portada, del logotipo o de la tarjeta dibujada.',
        )
      : ok(GATE_SOCIAL, what, `${cuantas(live.length)} con título, descripción e imagen.`),
  ]
}
