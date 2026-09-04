import { arg } from '../src/audit/args.js'
import { describe, it, expect } from 'vitest'
import type { Fetched } from '../src/audit/types.js'
import {
  checkCanonicalAnswers,
  checkIdentity,
  checkSecurityHeaders,
  checkSitemapAndRobots,
  checkStructuredData,
} from '../src/audit/checks/index.js'
import {
  checkConsentGating,
  checkPlaceholders,
  checkReachable,
  checkAdvertisedEmpty,
  isEmptyPage,
  internalLinks,
  checkContrast,
  checkImages,
  checkLegalPages,
  checkLlmsTxt,
  cssTokens,
} from '../src/audit/checks/index.js'
import { contrastRatio } from '../src/lib/color.js'
import { exitCode, renderReport } from '../src/audit/report.js'

const SITE = 'https://ejemplo.es'

const page = (extra: Partial<Fetched> = {}): Fetched => ({
  url: `${SITE}/`,
  status: 200,
  finalUrl: `${SITE}/`,
  headers: {},
  body: '',
  ...extra,
})

const failures = (findings: { status: string; what: string }[]) =>
  findings.filter((f) => f.status === 'fail').map((f) => f.what)

const assertWarn = (findings: { status: string }[]) => {
  expect(findings.filter((f) => f.status === 'fail')).toEqual([])
  expect(findings.some((f) => f.status === 'warn')).toBe(true)
}

/**
 * The audit is the promise of this whole system, so what has to be tested is not that it
 * runs: it is that **it catches the specific things that went wrong in production**. Every
 * case below is one of those.
 */
describe('identidad', () => {
  it('caza el canonical apuntando a otro dominio', () => {
    // Organic Yoga spent weeks telling Google the good version was a *.vercel.app subdomain.
    const html = '<link rel="canonical" href="https://sitio-abc123.vercel.app/"/>'
    expect(failures(checkIdentity(page({ body: html }), SITE))).toContain(
      'El canonical apunta al dominio del sitio',
    )
  })

  it('pasa cuando el canonical es el del sitio', () => {
    const html = `<link rel="canonical" href="${SITE}/"/>`
    expect(failures(checkIdentity(page({ body: html }), SITE))).toEqual([])
  })

  it('caza que no haya canonical en absoluto', () => {
    expect(failures(checkIdentity(page({ body: '<html></html>' }), SITE))).toHaveLength(1)
  })

  it('caza el dominio canónico que se redirige a sí mismo', () => {
    // The loop that took the first deploy down: the middleware matched the *.vercel.app
    // suffix, and the canonical host was one.
    const redirected = page({ status: 308, finalUrl: `${SITE}/` })
    expect(failures(checkCanonicalAnswers(redirected))).toHaveLength(1)
    expect(failures(checkCanonicalAnswers(page()))).toEqual([])
  })

  it('caza un sitemap que nombra otro host', () => {
    const sitemap = page({ body: '<loc>https://otro.es/</loc><loc>https://ejemplo.es/x</loc>' })
    const robots = page({ body: `Sitemap: ${SITE}/sitemap.xml` })
    expect(failures(checkSitemapAndRobots(sitemap, robots, SITE))).toContain(
      'El sitemap solo nombra el dominio del sitio',
    )
  })
})

describe('seguridad', () => {
  it('caza cada cabecera que falta', () => {
    expect(failures(checkSecurityHeaders(page()))).toHaveLength(4)
  })

  it('pasa con las cuatro puestas', () => {
    const headers = {
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'content-security-policy': "frame-ancestors 'none'",
      'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    }
    expect(failures(checkSecurityHeaders(page({ headers })))).toEqual([])
  })

  it('no se conforma con una CSP que no diga frame-ancestors', () => {
    const headers = { 'content-security-policy': "default-src 'self'" }
    expect(failures(checkSecurityHeaders(page({ headers })))).toContain(
      'Cabecera content-security-policy',
    )
  })
})

describe('datos estructurados', () => {
  const ld = (graph: object[]) =>
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`

  it('caza una referencia @id que no existe en el grafo', () => {
    const html = ld([
      { '@type': 'Organization', '@id': `${SITE}/#organization` },
      { '@type': 'Event', '@id': `${SITE}/e1`, performer: [{ '@id': `${SITE}/miembros/x#person` }] },
    ])
    expect(failures(checkStructuredData(page({ body: html }), SITE))).toContain(
      'Las referencias del grafo resuelven',
    )
  })

  it('pasa cuando cada referencia está declarada', () => {
    const html = ld([
      { '@type': 'Organization', '@id': `${SITE}/#organization` },
      { '@type': 'Person', '@id': `${SITE}/equipo/ana#person` },
      { '@type': 'Event', '@id': `${SITE}/e1`, performer: [{ '@id': `${SITE}/equipo/ana#person` }] },
    ])
    expect(failures(checkStructuredData(page({ body: html }), SITE))).toEqual([])
  })

  it('caza un @id de otro dominio', () => {
    const html = ld([{ '@type': 'Organization', '@id': 'https://otro.es/#organization' }])
    expect(failures(checkStructuredData(page({ body: html }), SITE))).toContain(
      'Los @id son del dominio del sitio',
    )
  })

  it('caza que no haya marcado ninguno', () => {
    expect(failures(checkStructuredData(page({ body: '<html></html>' }), SITE))).toHaveLength(1)
  })

  it('avisa de una oferta sin precio, que los buscadores descartan', () => {
    const html = ld([{ '@type': 'Service', offers: { '@type': 'Offer', priceCurrency: 'EUR' } }])
    const findings = checkStructuredData(page({ body: html }), SITE)
    expect(findings.some((f) => f.status === 'warn')).toBe(true)
  })
})

describe('geo', () => {
  it('caza lo que se coló y el CMS nunca dijo', () => {
    const llms = page({ body: '# Sitio\n- Tarifa: undefined €' })
    expect(failures(checkLlmsTxt(llms))).toContain('No se cuela nada que el CMS no dijo')
  })

  it('caza que no exista', () => {
    expect(failures(checkLlmsTxt(page({ status: 404 })))).toHaveLength(1)
  })
})

describe('legal y consentimiento', () => {
  const legal = ['/aviso-legal', '/privacidad', '/cookies'].map((path) =>
    page({ url: `${SITE}${path}` }),
  )

  it('caza una página legal que no existe', () => {
    const missing = [...legal.slice(0, 2), page({ url: `${SITE}/cookies`, status: 404 })]
    const home = page({ body: legal.map((p) => `<a href="${new URL(p.url).pathname}">x</a>`).join('') })
    expect(failures(checkLegalPages(missing, home))).toContain('Existe /cookies')
  })

  it('caza una página legal que existe pero no se enlaza', () => {
    const home = page({ body: '<a href="/aviso-legal">x</a><a href="/privacidad">x</a>' })
    expect(failures(checkLegalPages(legal, home))).toContain(
      'Las páginas legales se enlazan desde la portada',
    )
  })

  it('caza un reproductor de terceros servido antes de aceptar', () => {
    // The gate that turns the cookie banner from theatre into something real.
    const withPlayer = page({
      body: '<iframe src="https://w.soundcloud.com/player/?url=x" title="p"></iframe>',
    })
    expect(failures(checkConsentGating([withPlayer]))).toHaveLength(1)
  })

  it('deja pasar el marcador de posición, que no es un iframe', () => {
    const blocked = page({ body: '<div class="embed-blocked">Aceptar y reproducir</div>' })
    expect(failures(checkConsentGating([blocked]))).toEqual([])
  })
})

describe('imágenes', () => {
  it('caza una imagen sin texto alternativo', () => {
    const html = '<img src="/a.webp" alt="Una foto"/><img src="/b.webp"/>'
    expect(failures(checkImages([page({ body: html })]))).toContain(
      'Las imágenes llevan texto alternativo',
    )
  })

  it('reconoce el srcSet que sirve React, con la S grande', () => {
    // Marcaba como sin optimizar cada next/image de cada web: React emite `srcSet`.
    const html = '<img alt="foto" srcSet="/a.webp 640w, /b.webp 750w" sizes="100vw"/>'

    expect(checkImages([page({ body: html })]).every((f) => f.status === 'ok')).toBe(true)
  })

  it('acepta el alt vacío de una imagen decorativa', () => {
    expect(failures(checkImages([page({ body: '<img src="/a.webp" alt="" width="10"/>' })]))).toEqual(
      [],
    )
  })
})

describe('contenido', () => {
  it('avisa cuando sigue publicado el relleno del seed', () => {
    const page1 = page({ body: '<p>Dos o tres líneas contando de qué va. Esto es un ejemplo.</p>' })
    const findings = checkPlaceholders([page1])

    // Avisa, no falla: una web en construcción puede tener relleno, y una puerta que
    // bloquea un despliegue legítimo acaba desactivada.
    assertWarn(findings)
  })

  it('pasa cuando los textos son de verdad', () => {
    const real = page({ body: '<p>Damos clases de teatro los martes en el local de la calle Mayor.</p>' })

    expect(checkPlaceholders([real]).every((f) => f.status === 'ok')).toBe(true)
  })
})

describe('navegación', () => {
  it('lee los enlaces internos y descarta los de fuera', () => {
    const html =
      '<a href="/sesiones">x</a><a href="https://ejemplo.es/bolos/">y</a>' +
      '<a href="https://otro.es/z">fuera</a><a href="/sesiones#abajo">repetido</a>'

    expect(internalLinks(html, SITE).sort()).toEqual(['/bolos', '/sesiones'])
  })

  it('caza una página del sitemap a la que no lleva ningún enlace', () => {
    // Le pasó a la página de preguntas de la tercera web: existía, entraba en el sitemap,
    // y solo se llegaba escribiendo la dirección. Google la encuentra y una persona no.
    const findings = checkReachable(
      [`${SITE}/`, `${SITE}/sesiones`, `${SITE}/preguntas-frecuentes`],
      new Set(['/', '/sesiones']),
    )

    expect(failures(findings)).toHaveLength(1)
    expect(findings[0]!.detail).toContain('/preguntas-frecuentes')
  })

  it('pasa cuando todo lo publicado tiene por dónde llegarse', () => {
    expect(
      failures(checkReachable([`${SITE}/`, `${SITE}/sesiones`], new Set(['/', '/sesiones']))),
    ).toEqual([])
  })

  it('no juzga un sitemap vacío: dice que no lo ha comprobado', () => {
    expect(checkReachable([], new Set(['/'])).every((f) => f.status === 'skip')).toBe(true)
  })
})

describe('conexión a la base', () => {
  it('caza el endpoint directo de Neon, que agota conexiones en producción', async () => {
    const { checkPooled } = await import('../src/audit/migrations.js')

    expect(
      failures(checkPooled('postgresql://u:p@ep-calm-mud-b1uz3k5f.c-5.eu-central-1.aws.neon.tech/db')),
    ).toHaveLength(1)
  })

  it('pasa con la agrupada y no opina de otros proveedores', async () => {
    const { checkPooled } = await import('../src/audit/migrations.js')

    expect(failures(checkPooled('postgresql://u:p@ep-x-pooler.c-5.eu-central-1.aws.neon.tech/db'))).toEqual([])
    expect(checkPooled('postgresql://u:p@localhost:5432/db')).toEqual([])
    expect(checkPooled(undefined)).toEqual([])
  })
})

describe('contraste', () => {
  it('mide el gris que suspendió de verdad', () => {
    // #6f6a64 sobre #0b0b0d daba 3,67:1 y estaba en el pie, las migas y las etiquetas.
    expect(contrastRatio('#6f6a64', '#0b0b0d')!).toBeCloseTo(3.67, 1)
    expect(contrastRatio('#8b857d', '#0b0b0d')!).toBeGreaterThan(4.5)
  })

  it('lee los tokens del CSS aunque haya varios bloques', () => {
    const css = ':root { --ground: #0b0b0d; --ink: #f2efe9; }\n@media x { :root { --ground: #fff; } }'
    expect(cssTokens(css)).toMatchObject({ ground: '#0b0b0d', ink: '#f2efe9' })
  })

  it('falla la paleta que suspende y pasa la que no', () => {
    const bad = ':root { --ground: #0b0b0d; --ink: #f2efe9; --ink-faint: #6f6a64; }'
    const good = ':root { --ground: #0b0b0d; --ink: #f2efe9; --ink-faint: #8b857d; }'

    expect(failures(checkContrast(bad))).toContain('--ink-faint sobre --ground')
    expect(failures(checkContrast(good))).toEqual([])
  })

  it('no inventa una medida cuando el token no está', () => {
    const findings = checkContrast(':root { --ground: #0b0b0d; }')

    expect(failures(findings)).toEqual([])
    // And it says so instead of vanishing: a check that disappears reads like one that
    // passed. Organic Yoga names its tokens --washi and --sumi, and the gate went silent.
    expect(findings.every((f) => f.status === 'skip')).toBe(true)
  })

  it('mide las parejas que se le pasen, para una paleta con otros nombres', () => {
    const css = ':root { --washi: #f4efe4; --sumi: #262019; }'

    expect(failures(checkContrast(css, [['sumi', 'washi']]))).toEqual([])
  })
})

describe('esquema', () => {
  it('una base sin migraciones no es un fallo: es una web sin desplegar', async () => {
    const { checkMigrations } = await import('../src/audit/migrations.js')
    // Una cadena que no conecta a nada devuelve un fallo real; lo que no puede pasar es que
    // "la tabla no existe" —que es el estado normal antes del primer despliegue— se cuente
    // como rojo y mande a alguien a depurar un problema que no existe.
    const findings = await checkMigrations({ databaseUrl: undefined })

    expect(findings.every((f) => f.status === 'skip')).toBe(true)
  })
})

describe('el informe', () => {
  it('sale con código 1 en cuanto algo falla, que es lo que lo hace una puerta', () => {
    const findings = checkSecurityHeaders(page())
    expect(exitCode(findings)).toBe(1)
    expect(exitCode(checkSecurityHeaders(page({ headers: {
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin',
      'content-security-policy': 'frame-ancestors none',
      'permissions-policy': 'camera=()',
    } })))).toBe(0)
  })

  it('dice qué se encontró, no solo que falla', () => {
    const report = renderReport(checkSecurityHeaders(page()))
    expect(report).toContain('NO pasa la auditoría')
    expect(report).toContain('No viaja')
  })
})

describe('nada de lo anunciado está vacío', () => {
  const lleno = '<section><h2>Bolos</h2><p>El sábado en la sala.</p></section>'
  const vacio = '<section><p class="empty">Todavía no hay bolos confirmados.</p></section>'

  it('protesta cuando el sitemap anuncia una página sin nada', () => {
    const [finding] = checkAdvertisedEmpty(
      ['https://x.es/bolos', 'https://x.es/sesiones'],
      new Map([
        ['/bolos', vacio],
        ['/sesiones', lleno],
      ]),
    )
    expect(finding!.status).toBe('fail')
    expect(finding!.detail).toContain('/bolos')
    expect(finding!.detail).not.toContain('/sesiones')
  })

  it('pasa cuando todo lo anunciado tiene contenido', () => {
    const [finding] = checkAdvertisedEmpty(['https://x.es/sesiones'], new Map([['/sesiones', lleno]]))
    expect(finding!.status).toBe('ok')
    expect(finding!.detail).toContain('1 páginas')
  })

  it('no afirma nada de lo que no llegó a descargar', () => {
    const [finding] = checkAdvertisedEmpty(['https://x.es/bolos'], new Map())
    expect(finding!.status).toBe('skip')
  })

  it('la barra final no hace que una página parezca otra', () => {
    const [finding] = checkAdvertisedEmpty(['https://x.es/bolos/'], new Map([['/bolos', vacio]]))
    expect(finding!.status).toBe('fail')
  })

  it('la portada se comprueba como cualquier otra', () => {
    const [finding] = checkAdvertisedEmpty(['https://x.es/'], new Map([['/', vacio]]))
    expect(finding!.status).toBe('fail')
    expect(finding!.detail).toContain('/')
  })

  it('una dirección que no es una dirección se ignora', () => {
    const [finding] = checkAdvertisedEmpty(['no-es-una-url'], new Map([['/', lleno]]))
    expect(finding!.status).toBe('skip')
  })

  it('una clase que sólo contiene "empty" dentro de otra palabra no cuenta', () => {
    const [finding] = checkAdvertisedEmpty(
      ['https://x.es/a'],
      new Map([['/a', '<section class="not-emptyish">hola</section>']]),
    )
    expect(finding!.status).toBe('ok')
  })

  it('el marco de una foto que falta no vacía la página', () => {
    // Doce fichas sin retrato son doce personas, no una página hueca.
    const fichas = '<section>' + '<div class="member-photo-empty"></div>'.repeat(12) + '</section>'
    expect(isEmptyPage(fichas)).toBe(false)
  })

  it('la clase tiene que ser exactamente empty, esté donde esté en la lista', () => {
    expect(isEmptyPage('<section><p class="lead empty small">nada</p></section>')).toBe(true)
    expect(isEmptyPage('<section><p class="empty-state">nada</p></section>')).toBe(false)
  })

  it('una sección vacía entre secciones llenas no vacía la página', () => {
    const portada = `${lleno}${vacio}${lleno}`
    const [finding] = checkAdvertisedEmpty(['https://x.es/'], new Map([['/', portada]]))
    expect(finding!.status).toBe('ok')
  })

  it('una página sin secciones no se juzga vacía', () => {
    expect(isEmptyPage('<main><p class="empty">nada</p></main>')).toBe(false)
  })

  it('todas las secciones vacías sí vacían la página', () => {
    expect(isEmptyPage(`${vacio}${vacio}`)).toBe(true)
  })

  it('enumera hasta cuatro y luego cuenta', () => {
    const urls = ['a', 'b', 'c', 'd', 'e', 'f'].map((p) => `https://x.es/${p}`)
    const bodies = new Map(['a', 'b', 'c', 'd', 'e', 'f'].map((p) => [`/${p}`, vacio]))
    const [finding] = checkAdvertisedEmpty(urls, bodies)
    expect(finding!.detail).toContain('y 2 más')
  })
})

describe('leer un argumento de la línea de órdenes', () => {
  const base = ['node', 'cli.js']

  it('devuelve el valor que sigue a la bandera', () => {
    expect(arg([...base, '--url', 'https://x.es'], 'url')).toBe('https://x.es')
  })

  it('el último gana, que es el que escribe una persona', () => {
    // El guion `audit` de cada web trae ya su propio --url por defecto.
    const argv = [...base, '--url', 'http://localhost:3000', '--url', 'https://x.es']
    expect(arg(argv, 'url')).toBe('https://x.es')
  })

  it('una bandera que no está no vale nada', () => {
    expect(arg(base, 'url')).toBeUndefined()
  })

  it('una bandera sin valor al final no se lleva lo que no hay', () => {
    expect(arg([...base, '--url'], 'url')).toBeUndefined()
  })

  it('la bandera siguiente no es el valor de esta', () => {
    expect(arg([...base, '--url', '--css', 'estilos.css'], 'url')).toBeUndefined()
    expect(arg([...base, '--url', '--css', 'estilos.css'], 'css')).toBe('estilos.css')
  })

  it('no confunde una bandera con otra que empieza igual', () => {
    expect(arg([...base, '--url-canonica', 'no', '--url', 'sí'], 'url')).toBe('sí')
  })
})
