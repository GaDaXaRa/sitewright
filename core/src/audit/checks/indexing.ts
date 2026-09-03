import { type Fetched, type Finding, fail, ok, skip } from '../types.js'

/**
 * Que la web se pueda encontrar: quién dice ser, qué dirección declara suya, qué ofrece a
 * los buscadores y si desde la portada se llega a todo lo que anuncia.
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

// ── alcanzables ──────────────────────────────────────────────────────────────────────────

const GATE_REACH = 'navegacion'

/** The internal paths a page links to, normalised and without fragments or trailing slashes. */
export function internalLinks(html: string, siteUrl: string): string[] {
  const host = new URL(siteUrl).host
  const paths = new Set<string>()

  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)) {
    try {
      const url = new URL(href, siteUrl)
      if (url.host !== host) continue
      const path = url.pathname.replace(/\/$/, '') || '/'
      paths.add(path)
    } catch {
      // A malformed href links nowhere; the browser agrees.
    }
  }

  return [...paths]
}

/**
 * Everything in the sitemap has to be reachable by clicking.
 *
 * A page that is generated, indexed and linked from nowhere is a page nobody reads: it
 * happened to the questions page of the third site built with this, which existed, ranked
 * and could only be reached by typing the address. Search engines will find it through the
 * sitemap and people will not, which is the wrong way round.
 */
export function checkReachable(sitemapUrls: string[], reachable: Set<string>): Finding[] {
  if (!sitemapUrls.length) {
    return [skip(GATE_REACH, 'Todo lo del sitemap se alcanza pinchando', 'El sitemap está vacío.')]
  }

  const orphans = sitemapUrls
    .map((url) => {
      try {
        return new URL(url).pathname.replace(/\/$/, '') || '/'
      } catch {
        return null
      }
    })
    .filter((path): path is string => Boolean(path))
    .filter((path) => !reachable.has(path))

  return [
    orphans.length
      ? fail(
          GATE_REACH,
          'Todo lo del sitemap se alcanza pinchando',
          `Sin ningún enlace que lleve a ${orphans.slice(0, 4).join(', ')}${orphans.length > 4 ? ` y ${orphans.length - 4} más` : ''}.`,
        )
      : ok(
          GATE_REACH,
          'Todo lo del sitemap se alcanza pinchando',
          `${sitemapUrls.length} páginas, todas enlazadas.`,
        ),
  ]
}

/**
 * Una página cuyas secciones están todas vacías.
 *
 * No basta con encontrar un «todavía no hay nada»: la portada de una web recién hecha
 * enseña ese texto en una sección y cinco llenas alrededor, y esa página tiene contenido
 * de sobra. Lo que no lo tiene es la página cuya única sección es el hueco.
 */
export function isEmptyPage(html: string): boolean {
  const sections = html.split(/<section\b/i).slice(1)
  if (!sections.length) return false
  return sections.every(hasEmptyState)
}

/**
 * Si un trozo de html lleva el hueco que se pinta cuando no hay nada.
 *
 * La clase tiene que ser exactamente `empty`, no contenerla: `member-photo-empty` es el
 * marco gris de una persona que aún no ha mandado su foto, y una página con doce de esos
 * está llena de gente, no vacía. Con `\bempty\b` el guion cuenta como frontera de
 * palabra y las doce fichas hacían pasar la página por hueca.
 */
function hasEmptyState(html: string): boolean {
  for (const [, classes] of html.matchAll(/class="([^"]*)"/g)) {
    if (classes!.split(/\s+/).includes('empty')) return true
  }
  return false
}

/**
 * Nada de lo que se anuncia puede estar vacío.
 *
 * Una página que dice «todavía no hay nada publicado» no es contenido fino: es ninguno.
 * Google la descubre, la rastrea y decide no indexarla, y de paso se lleva esa impresión
 * de la web entera. Le pasó a la cuarta web hecha con esto: siete direcciones en el
 * sitemap, tres vacías, tres legales y una sola con algo que leer.
 *
 * Se mira sólo lo que el rastreo llegó a descargar; de lo demás no se afirma nada.
 */
export function checkAdvertisedEmpty(sitemapUrls: string[], bodies: Map<string, string>): Finding[] {
  const title = 'Nada de lo anunciado está vacío'
  const paths = sitemapUrls
    .map((url) => {
      try {
        return new URL(url).pathname.replace(/\/$/, '') || '/'
      } catch {
        return null
      }
    })
    .filter((path): path is string => Boolean(path))
    .filter((path) => bodies.has(path))

  if (!paths.length) return [skip(GATE_REACH, title, 'No se descargó ninguna página del sitemap.')]

  const empty = paths.filter((path) => isEmptyPage(bodies.get(path)!))

  return [
    empty.length
      ? fail(
          GATE_REACH,
          title,
          `Sin nada que enseñar: ${empty.slice(0, 4).join(', ')}${empty.length > 4 ? ` y ${empty.length - 4} más` : ''}.`,
        )
      : ok(GATE_REACH, title, `${paths.length} páginas comprobadas, todas con contenido.`),
  ]
}
