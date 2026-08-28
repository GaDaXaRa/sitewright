import { type Fetched, type Finding, fail, ok, warn } from './types.js'

/**
 * The gates, as pure functions.
 *
 * Every one of them exists because something went wrong for real, in production, on a site
 * someone was paying for. That is the bar for adding another: not "this would be nice to
 * check" but "this bit us, and nobody noticed until a client did".
 *
 * They take what was fetched and return findings; nothing here touches the network, so all
 * of it is testable without a site.
 */

// ── identidad ───────────────────────────────────────────────────────────────────────────

const GATE_ID = 'identidad'

function attr(html: string, re: RegExp): string | null {
  return html.match(re)?.[1]?.trim() ?? null
}

export function canonicalOf(html: string): string | null {
  return attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)
}

/**
 * The canonical, the sitemap, robots and the JSON-LD `@id`s must all name the same host.
 *
 * Organic Yoga spent weeks telling Google the good version of the site was the throwaway
 * *.vercel.app subdomain, which is authority handed to a domain nobody owns.
 */
export function checkIdentity(home: Fetched, siteUrl: string): Finding[] {
  const findings: Finding[] = []
  const host = new URL(siteUrl).host

  const canonical = canonicalOf(home.body)
  if (!canonical) {
    findings.push(fail(GATE_ID, 'La portada declara canonical', 'No hay <link rel="canonical">.'))
  } else if (new URL(canonical, siteUrl).host !== host) {
    findings.push(
      fail(
        GATE_ID,
        'El canonical apunta al dominio del sitio',
        `Dice ${canonical} y el sitio es ${siteUrl}.`,
      ),
    )
  } else {
    findings.push(ok(GATE_ID, 'El canonical apunta al dominio del sitio', canonical))
  }

  return findings
}

/**
 * The canonical host has to **answer**, not redirect.
 *
 * Before a domain is bought, the public address is a *.vercel.app one. A middleware that
 * matches on the suffix redirects that host to itself: an infinite loop that takes the site
 * down while every page still says it is the canonical one.
 */
export function checkCanonicalAnswers(canonical: Fetched): Finding[] {
  if (canonical.status >= 300 && canonical.status < 400) {
    return [
      fail(
        GATE_ID,
        'El dominio canónico responde, no redirige',
        `${canonical.url} devuelve ${canonical.status} hacia ${canonical.finalUrl}.`,
      ),
    ]
  }
  if (canonical.status !== 200) {
    return [
      fail(
        GATE_ID,
        'El dominio canónico responde, no redirige',
        `${canonical.url} devuelve ${canonical.status}.`,
      ),
    ]
  }
  return [ok(GATE_ID, 'El dominio canónico responde, no redirige', `200 en ${canonical.url}`)]
}

export function checkSitemapAndRobots(
  sitemap: Fetched,
  robots: Fetched,
  siteUrl: string,
): Finding[] {
  const findings: Finding[] = []
  const host = new URL(siteUrl).host

  if (sitemap.status !== 200) {
    findings.push(fail(GATE_ID, 'Hay sitemap', `/sitemap.xml devuelve ${sitemap.status}.`))
  } else {
    const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)
    const strays = locs.filter((loc) => {
      try {
        return new URL(loc).host !== host
      } catch {
        return true
      }
    })
    findings.push(
      strays.length
        ? fail(
            GATE_ID,
            'El sitemap solo nombra el dominio del sitio',
            `${strays.length} direcciones a otro host, la primera ${strays[0]}.`,
          )
        : ok(GATE_ID, 'El sitemap solo nombra el dominio del sitio', `${locs.length} páginas.`),
    )
  }

  if (robots.status !== 200) {
    findings.push(fail(GATE_ID, 'Hay robots.txt', `/robots.txt devuelve ${robots.status}.`))
  } else {
    const sitemapLine = robots.body.match(/^Sitemap:\s*(.+)$/im)?.[1]?.trim()
    findings.push(
      sitemapLine && new URL(sitemapLine).host === host
        ? ok(GATE_ID, 'robots.txt apunta al sitemap del sitio', sitemapLine)
        : fail(
            GATE_ID,
            'robots.txt apunta al sitemap del sitio',
            sitemapLine ? `Apunta a ${sitemapLine}.` : 'No declara Sitemap.',
          ),
    )
  }

  return findings
}

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
