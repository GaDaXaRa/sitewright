/**
 * Los tres ficheros que describen la web: su configuración, sus módulos y su portada.
 *
 * Funciones puras: reciben el blueprint y devuelven el texto del fichero. No leen el disco
 * ni escriben nada — de eso se ocupa `generate.js`—, y por eso se pueden probar sin generar
 * una web entera.
 */

import { capitalise, replaceOrDie } from './text.js'

// ── site.config.ts ──────────────────────────────────────────────────────────────────────

export function siteConfig(bp, modules, wirings) {
  const routes = Object.entries(modules)
    .filter(([, m]) => m.route)
    .map(([id, m]) => `    ${id}: '${m.route}',`)

  // The menu belongs to the site, not to a page: the home and every inner page paint the
  // same one, and an inner page that quietly loses it is a dead end.
  const nav = wirings
    .map((w) => w.navLink?.(modules[w.id]))
    .filter(Boolean)
    .map((link) => `    { href: '${link.href}', label: '${link.label}' },`)
  const cta = wirings.map((w) => w.navCta?.(modules[w.id])).find(Boolean)

  return `/**
 * Everything the core cannot know, in one file. Written by the generator from the blueprint
 * of ${bp.identity.name}; edit it by hand and nothing else has to move.
 */
export const site = {
  id: '${bp.identity.id}',
  name: '${bp.identity.name}',
  ${
    bp.identity.url
      ? `url: '${bp.identity.url}',`
      : `// Sin dominio propio todavía: el sitio usa la dirección que Vercel da al proyecto,
  // que es real desde el primer despliegue y pasa a ser la de verdad en cuanto se compre
  // el dominio y se configure ahí. Cuando eso ocurra, se escribe aquí.
  url: '',`
  }

  routes: {
${routes.join('\n')}
    legalNotice: '/aviso-legal',
    privacy: '/privacidad',
    cookies: '/cookies',
  } as Record<string, string>,

  nav: [
${nav.join('\n')}
  ] as { href: string; label: string }[],

  support: ${bp.support ? JSON.stringify(bp.support) : 'null'} as { name?: string; email?: string } | null,

  /** El ejemplo de texto alternativo que lee quien sube una foto, en sus propias palabras. */
  altExample: '${bp.design.altExample ?? 'Una foto del equipo trabajando'}',

  cta: ${cta ? `{ href: '${cta.href}', label: '${cta.label}' }` : 'null'} as { href: string; label: string } | null,
} as const

/** Routes whose content is generated and therefore goes stale with any edit. */
export const ALWAYS_STALE = ['/', '/llms.txt']
`
}

// ── src/site.modules.ts ─────────────────────────────────────────────────────────────────

/**
 * El manifiesto: el único fichero que cambia al añadir o quitar una sección.
 *
 * Antes cada módulo se enchufaba a mano en la configuración de Payload, el cargador, el
 * sitemap y `llms.txt`, y llevarlo a una web ya desplegada eran quince ediciones. Todo eso
 * lo recorren ahora bucles genéricos que leen esto.
 */
export function siteModules(bp, modules, wirings) {
  const imports = []
  const entradas = []
  const tipos = []

  for (const w of wirings) {
    const m = modules[w.id]
    if (w.collectionImport) imports.push(w.collectionImport)
    if (w.llmsImport) imports.push(w.llmsImport)
    if (w.pickImport) imports.push(w.pickImport)

    const campos = [`id: '${w.id}'`, `variable: ${JSON.stringify(w.variable)}`, `title: ${JSON.stringify(m.title)}`]
    if (m.labels?.plural) campos.push(`plural: ${JSON.stringify(m.labels.plural)}`)
    if (m.route) campos.push(`route: '${m.route}'`)
    if (w.collectionCall) campos.push(`collection: ${w.collectionCall(m, bp)}`)
    if (w.query) campos.push(`query: ${JSON.stringify(w.query).replace(/"([a-zA-Z_$][\w$]*)":/g, '$1:')}`)
    if (w.pickName) campos.push(`pick: ${w.pickName}`)
    if (w.llmsName) campos.push(`llms: ${w.llmsName}`)
    if (w.options) campos.push(`options: ${JSON.stringify(w.options(m, bp))}`)
    if (w.pagePath) campos.push(`Page: () => import('${w.pagePath}')`)
    if (w.detailPath) campos.push(`Detail: () => import('${w.detailPath}')`)
    if (w.indexPage) campos.push('indexPage: true')
    if (w.detailPath) campos.push('documentPages: true')

    entradas.push(`  {\n    ${campos.join(',\n    ')},\n  },`)

    // El tipo sale del esquema de Payload, así que no puede quedarse viejo.
    if (w.query) {
      const docs = `Config['collections']['${w.query.collection}']`
      tipos.push(`  ${w.variable}: ${w.pickName ? `${docs} | null` : `${docs}[]`}`)
    }
  }

  return `import type { Config, SiteSetting } from '@/payload-types'
import type { SiteModule } from '@/lib/modules'
${imports.join('\n')}

/**
 * Los módulos de esta web. **Lo escribe el generador**: es el único fichero que cambia
 * cuando se añade o se quita una sección.
 */
export const modules: SiteModule[] = [
${entradas.join('\n')}
]

/**
 * La forma de lo que devuelve el cargador. Los tipos salen del esquema de Payload, así que
 * no pueden quedarse viejos, y la portada se sigue comprobando llamada por llamada.
 */
export type Content = {
  settings: SiteSetting
  now: number
${tipos.join('\n')}
}
`
}

// ── (frontend)/page.tsx ─────────────────────────────────────────────────────────────────

export function homePage(bp, modules, wirings, order) {
  const sectioned = order.map((id) => wirings.find((w) => w.id === id)).filter((w) => w?.sectionRender)
  const toned = sectioned.filter((w) => w.renders)
  const overlays = wirings.filter((w) => w.overlay)

  const imports = [...new Set(wirings.map((w) => w.sectionImport).filter(Boolean))].join('\n')
  const jsonldImports = [...new Set(wirings.map((w) => w.jsonldImport).filter(Boolean))].join('\n')

  const jsonldNodes = [
    ...wirings.filter((w) => w.jsonldFirst && w.jsonldNodes),
    ...wirings.filter((w) => !w.jsonldFirst && w.jsonldNodes),
  ]
    .map((w) => `          ${w.jsonldNodes(modules[w.id], bp)},`)
    .join('\n')

  const toneNames = toned.map((w) => `${w.id === 'faq' ? 'faq' : w.id}Tone`)
  const toneConditions = toned.map((w) => `      ${w.renders},`)

  const navLinks = wirings
    .map((w) => w.navLink?.(modules[w.id]))
    .filter(Boolean)
    .map((link) => `          { href: '${link.href}', label: '${link.label}' },`)
  const cta = wirings.map((w) => w.navCta?.(modules[w.id])).find(Boolean)

  const usesSplit = wirings.some((w) => w.id === 'schedule')

  return `import React from 'react'
import type { Metadata } from 'next'

import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'
import JsonLd from './components/JsonLd'
${imports}

${jsonldImports}

import { loadSiteContent, visibleNav } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { site } from '@/site.config'
import { alternateTones, mediaAlt, mediaFocal, mediaSize, mediaUrl${usesSplit ? ', splitEvents' : ''} } from 'sitewright-core'

// ISR: the home page is generated statically and revalidated every five minutes at most. A
// hook also revalidates it the instant the client edits content, so changes show up.
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadSiteContent()
  const title =
    settings.seoTitle?.trim() ||
    (settings.tagline?.trim() ? \`\${settings.siteName} — \${settings.tagline.trim()}\` : undefined)
  const description = settings.seoDescription || settings.heroText || undefined
  const image = mediaUrl(settings.heroImage) || mediaUrl(settings.logo)

  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function HomePage() {
  const { settings, ${[...new Set(wirings.map((w) => w.variable).filter(Boolean))].join(', ')}, now } =
    await loadSiteContent()
  const links = await visibleNav()

  // The tones alternate over the sections that are really painted: most disappear when the
  // client runs out of content, and then different pairs become neighbours.
  const [${toneNames.join(', ')}] = alternateTones([
${toneConditions.join('\n')}
  ])

  return (
    <>
      <JsonLd
        data={buildHomeJsonLd(settings, [
${jsonldNodes}
        ])}
      />

${overlays.map((w) => `      ${w.overlayRender()}`).join('\n')}

      <Nav
        name={settings.siteName}
        logoUrl={mediaUrl(settings.logo)}
        logoSize={mediaSize(settings.logo)}
        links={links}
        cta={site.cta ?? undefined}
      />

      <Hero
        eyebrow={settings.heroEyebrow}
        title={settings.heroTitle || settings.siteName}
        text={settings.heroText}
        imageUrl={mediaUrl(settings.heroImage)}
        imageAlt={mediaAlt(settings.heroImage)}
        focalX={mediaFocal(settings.heroImage).x}
        focalY={mediaFocal(settings.heroImage).y}
        textPosition={settings.heroTextPosition}
        textHeight={settings.heroTextHeight}
        shade={settings.heroShade}
        textColour={settings.heroTextColour}
${cta ? `        actions={[{ href: '${cta.href}', label: '${cta.label}' }]}\n` : ''}      />

${sectioned.map((w) => `      ${w.sectionRender(modules[w.id], bp)}`).join('\n\n')}

      <Footer settings={settings} links={links} />
    </>
  )
}
`
}
