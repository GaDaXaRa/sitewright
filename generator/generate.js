#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sectionOrder, validateBlueprint, validateWiring } from './schema.js'
import { buttonColors, defaultIconSvg } from '../core/dist/index.js'

/**
 * From a blueprint to a site on disk.
 *
 * Everything here is **deterministic**: the same blueprint writes the same files, so a
 * generated site can be regenerated, diffed and argued with. The parts that cannot be
 * derived — the copy, the hero, whatever the business does that nothing else does — are
 * left for a person (or a conversation) to write afterwards, in files that are then theirs.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

// Boolean flags carry no value, so `arg('force')` reads whatever comes next — or undefined
// when the flag is last, which is exactly how `--force` did nothing at all.
const flag = (name) => process.argv.includes(`--${name}`)

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)
const fontImport = (font) => (typeof font === 'string' ? font : font.family).replaceAll(' ', '_')
const fontWeights = (font, fallback) =>
  typeof font === 'string' ? fallback : (font.weights ?? fallback)

// ── site.config.ts ──────────────────────────────────────────────────────────────────────

function siteConfig(bp, modules, wirings) {
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
function siteModules(bp, modules, wirings) {
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
    if (w.indexPage) campos.push('indexPage: true')
    if (w.detailPage) campos.push('documentPages: true')

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

function homePage(bp, modules, wirings, order) {
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
${cta ? `        actions={[{ href: '${cta.href}', label: '${cta.label}' }]}\n` : ''}      />

${sectioned.map((w) => `      ${w.sectionRender(modules[w.id], bp)}`).join('\n\n')}

      <Footer settings={settings} links={links} />
    </>
  )
}
`
}

// ── globals/SiteSettings.ts ─────────────────────────────────────────────────────────────

function siteSettings(template, bp, modules, wirings) {
  const fields = wirings
    .filter((w) => w.settingsFields)
    .map((w) => w.settingsFields(modules[w.id], bp))
    .join('\n')

  return fields
    ? template.replace(
        "    // The generator appends each module's own settings here.",
        fields,
      )
    : template
}

// ── scripts/seed.ts ─────────────────────────────────────────────────────────────────────

/**
 * The copy the interview drafted for the settings — cover title, intro, section headings.
 *
 * It goes through the seed like everything else so the site is reproducible: regenerating
 * and reseeding gives the same site, and nothing has to be typed into the panel twice.
 */
/**
 * Los ajustes que se siembran, decididos en un solo sitio.
 *
 * Antes se concatenaban por trozos, y el blueprint podía escribir en `content.settings`
 * una clave que ya salía de `identity` —la ciudad, sin ir más lejos—: el resultado era un
 * objeto con la misma propiedad dos veces, que TypeScript rechaza. Ahora es un mapa, y lo
 * que se redactó en la entrevista pisa a lo que se dedujo, que es el orden correcto.
 */
function seedSettings(bp) {
  const settings = new Map([['siteName', 'site.name']])
  const add = (key, value) => {
    if (value !== undefined && value !== null && value !== '') settings.set(key, JSON.stringify(value))
  }

  add('tagline', bp.identity.tagline)
  add('email', bp.identity.email)
  add('city', bp.identity.city)
  add('schemaType', bp.identity.schemaType)
  add('legalHolder', bp.legal.holder)
  add('legalId', bp.legal.id)
  add('legalAddress', bp.legal.address)

  for (const [key, value] of Object.entries(bp.content?.settings ?? {})) add(key, value)
  settings.set('analyticsConsent', 'true')

  return [...settings].map(([key, value]) => `${key}: ${value},`).join('\n      ')
}

function seedScript(bp, modules, wirings) {
  // Written copy wins over the module's generic example: what the interview drafted for
  // this business is worth more than "Primera actividad", and it is what the client will
  // correct rather than write from scratch.
  const written = (id) => {
    const items = bp.content?.[id]
    if (!Array.isArray(items) || !items.length) return null
    const collection = wirings.find((w) => w.id === id)?.collectionSlug
    if (!collection) return null
    return `  const ${id}Count = await payload.count({ collection: '${collection}' })
  if (${id}Count.totalDocs === 0) {
    for (const data of ${JSON.stringify(items, null, 2).split('\n').join('\n    ')} as never[]) {
      await payload.create({ collection: '${collection}', data })
    }
    payload.logger.info('${items.length} en ${collection}: textos del blueprint')
  }`
  }

  const blocks = wirings
    .filter((w) => w.seed)
    .map((w) => written(w.id) ?? w.seed({ ...modules[w.id], city: bp.identity.city }, bp))
    .join('\n\n')

  return `import { getPayload } from 'payload'
import config from '../src/payload.config'
import { site } from '../src/site.config'

/**
 * Example content, so the site can be looked at before ${bp.identity.name} has written a
 * word — and so the client sees what a filled-in field is supposed to look like.
 *
 * Idempotent by collection: running it twice duplicates nothing. **Never against
 * production**: it leaves a dev-mode mark in \`payload_migrations\` that stops
 * \`payload migrate\` during the build.
 */
export const seed = async () => {
  const payload = await getPayload({ config: await config })

  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs === 0) {
    const email = process.env.SEED_EMAIL || \`admin@\${site.id}.es\`
    const password = process.env.SEED_PASSWORD || 'cambiame-ahora'
    await payload.create({ collection: 'users', data: { email, password } })
    payload.logger.info(\`Usuario creado: \${email}\`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      ${seedSettings(bp)}
    },
  })

${blocks}

  payload.logger.info('Seed completado.')
  process.exit(0)
}

await seed()
`
}

// ── module pages ────────────────────────────────────────────────────────────────────────

function writeModulePages(target, bp, modules, wirings, write) {
  const written = []
  for (const w of wirings) {
    // Las páginas índice ya no se escriben: cada módulo trae la suya y una sola ruta las
    // sirve. Quedan las fichas, que necesitan su propio `generateStaticParams`.
    for (const build of [w.detailPage]) {
      if (!build) continue
      const page = build(modules[w.id], bp)
      mkdirSync(join(target, dirname(page.path)), { recursive: true })
      write(page.path, page.source)
      written.push(page.path)
    }
  }
  return written
}

// ── CLAUDE.md ───────────────────────────────────────────────────────────────────────────

/**
 * The site's own guide.
 *
 * Whoever opens this repository next is most likely another agent, and it will arrive
 * knowing nothing: not that the schema needs a migration, not that development and
 * production are two branches, not that the icon has to keep its address. Every one of
 * those cost a real afternoon somewhere, and writing them down here is cheaper than paying
 * for them again.
 */
/**
 * El README de la web, para la persona que la mantiene.
 *
 * Antes se quedaba el de la plantilla, que habla del chasis y apunta a `../core`, un
 * directorio que no existe al lado de un sitio generado: quien abría el repositorio de su
 * propia web leía la documentación de otra cosa.
 */
function siteReadme(bp, modules) {
  const rows = Object.entries(modules)
    .filter(([, m]) => m.route)
    .map(([, m]) => `- **${m.labels?.plural ?? m.title}** — \`${m.route}\``)
    .join('\n')

  return `# ${bp.identity.name}

${bp.identity.tagline ? bp.identity.tagline + '\n\n' : ''}Web y gestor de contenidos. **Los textos, las fotos y las fechas se escriben en el panel**,
en \`/admin\`; aquí sólo está el código.

## Secciones

${rows}

Una sección sin contenido no aparece ni en el menú ni en el sitemap: se publica sola en
cuanto tiene algo dentro.

## Trabajar en local

\`\`\`bash
cp .env.example .env     # y pon DATABASE_URL (la rama dev) y PAYLOAD_SECRET
npm install
npm run generate:types
npm run dev
\`\`\`

## Antes de dar un cambio por bueno

\`\`\`bash
npm run typecheck && npm run test:int
npm run audit -- --url http://localhost:3000
\`\`\`

La auditoría comprueba lo que se rompe en silencio: canónicos, sitemap, datos
estructurados, páginas legales, consentimiento, contraste y peso.

## Desplegar

\`git push\`. La plataforma construye y publica sola, y al terminar vuelve a pasar la
auditoría contra la web en producción.

---

Generada con [Sitewright](https://www.npmjs.com/package/sitewright-core). Lo que no cambia
entre webs vive en ese paquete y **no se edita desde aquí**.
`
}

function siteGuide(bp, modules) {
  const rows = Object.entries(modules)
    .map(([id, m]) => `| ${m.labels?.plural ?? m.title ?? id} | \`${id}\` | ${m.route ?? '—'} |`)
    .join('\n')

  return `# Guía para agentes — ${bp.identity.name}

Web + CMS generada con [Sitewright](https://www.npmjs.com/package/sitewright-core) a partir
de \`${bp.identity.id}.json\`. Lo que no cambia entre sitios vive en el paquete
\`sitewright-core\`; **no lo edites desde aquí**: se toca en el repositorio de Sitewright y
se publica una versión.

## Qué tiene este sitio

| Sección | Módulo | Ruta |
|---|---|---|
${rows}

Lo que el núcleo no puede saber está en [\`src/site.config.ts\`](src/site.config.ts):
identidad, rutas y menú. Se edita ahí y nada más tiene que moverse.

## Convenciones

- **El código va en inglés**: identificadores, comentarios y mensajes de commit.
- **Lo que ve una persona va en español**: etiquetas del panel, textos de la web y correos.
  El cliente final no es técnico.
- Los comentarios explican **por qué**, no qué hace la línea.

## Entorno

- **Dos ramas de Neon**: \`dev\` en tu \`.env\` y la de producción en Vercel. Compartir una
  sola es lo que deja marcas de modo dev en producción y **tumba el despliegue**.
- Sin \`BLOB_READ_WRITE_TOKEN\` las imágenes van a disco local y la copia original no se
  guarda: eso solo se prueba desplegado.

## Cómo verificar

\`\`\`bash
npm run lint && npm run typecheck && npm run test:int && npm run build
npm run audit -- --url http://localhost:3000
\`\`\`

**\`typecheck\` no es opcional**: \`next build\` reutiliza su caché y puede dar por bueno un
fichero que no ha vuelto a comprobar.

## Lo que ya nos ha mordido

- **Todo cambio de esquema necesita migración** (\`npm run migrate:create -- <nombre>\` y
  \`npm run generate:types\`). En desarrollo Payload empuja el esquema solo; producción
  **solo aplica migraciones**.
- **Nunca ejecutes el seed contra producción**: deja una marca de modo dev
  (\`batch = -1\`) que cuelga \`payload migrate\` en el build. Se limpia con
  \`scripts/fix-prod-migration.mjs\`.
- **El favicon vive en \`public/\` con dirección fija.** Dentro de la carpeta de la app Next le
  pone un hash que cambia en cada despliegue, y Google necesita una URL estable. Si el
  cliente sube el suyo desde el panel, se sirve en \`/icono.png\`, que tampoco cambia.
- **Tras tocar un componente del panel, \`npm run generate:importmap\`**, o \`/admin\` se queda
  en blanco.
- **La auditoría antes de desplegar, no después.** Su puerta de esquema es la que caza lo
  que rompe el build; "faltan migraciones" en cambio es normal antes de desplegar, porque
  las aplica el propio build.

## Lo que es de este sitio y no del sistema

Las secciones, la hoja de estilos y los módulos de \`src/modules/\` son **copias**: edítalos
sin pedir permiso. Si el cambio sirve para cualquier web, va al repositorio de Sitewright.
`
}

// ── design ──────────────────────────────────────────────────────────────────────────────

/** La hoja firma de quién es: en el repositorio de un cliente, «Sistema de diseño» a secas
 * no dice nada, y el nombre de otra web dice algo falso. */
function nameStylesheet(css, name) {
  return css.replace(/^\/\* =+\n   Sistema de diseño$/m, (head) => head.replace('Sistema de diseño', `${name} — sistema de diseño`))
}

function applyPalette(css, design) {
  const { palette } = design
  const map = {
    ground: palette.ground,
    'ground-2': palette.ground2 ?? palette.surface,
    surface: palette.surface,
    'surface-2': palette.surface2 ?? palette.surface,
    ink: palette.ink,
    'ink-soft': palette.inkSoft,
    'ink-faint': palette.inkFaint,
    line: palette.line ?? palette.surface,
    accent: palette.accent,
    'accent-soft': palette.accentSoft ?? palette.accent,
    // The hero darkens a photo and puts light text on top regardless of the site's own
    // scheme — "light" here means whichever token actually reads as light in this palette:
    // --ground in a light site, --ink in a dark one, where ground is the near-black.
    'on-photo': design.scheme === 'light' ? palette.ground : palette.ink,
  }

  // Measured, not chosen: which ink reads on this accent has a right answer.
  const button = buttonColors({
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    ink: palette.ink,
    ground: palette.ground,
  })
  map['on-accent'] = button.text
  map['accent-hover'] = button.hover

  const claro = design.scheme === 'light'
  let out = css
    .replace(/color-scheme:\s*\w+;/, `color-scheme: ${claro ? 'light' : 'dark'};`)
    // Un logo monocromo oscuro se ve solo sobre fondo claro y hay que invertirlo sobre uno
    // oscuro; un recuadro blanco desaparece con `multiply` sobre claro y con `screen`
    // sobre oscuro, una vez invertido.
    .replace(/--logo-invert:\s*[^;]+;/, `--logo-invert: ${claro ? 0 : 1};`)
    .replace(/--logo-box-blend:\s*[^;]+;/, `--logo-box-blend: ${claro ? 'multiply' : 'screen'};`)
  for (const [token, value] of Object.entries(map)) {
    // The hover can be a `color-mix(...)` rather than a hex, so the old value is matched up
    // to its semicolon instead of assuming six hex digits.
    out = out.replace(new RegExp(`(--${token}:\\s*)[^;]+;`), `$1${value};`)
  }
  return out
}

/**
 * Each module's own styles, appended to the site's stylesheet.
 *
 * The section belongs to the module, and so do the class names it renders: shipping one
 * without the other is how a catalogue ends up on a live page as an unstyled list of links.
 */
function moduleStyles(css, target, modules) {
  const parts = Object.keys(modules)
    .map((id) => join(ROOT, 'modules', id, 'section.css'))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, 'utf8'))

  return parts.length ? `${css}\n${parts.join('\n')}` : css
}

function applyFonts(layout, design) {
  const display = fontImport(design.fonts.display)
  const body = fontImport(design.fonts.body)
  const displayWeights = fontWeights(design.fonts.display, ['400'])
  const bodyWeights = fontWeights(design.fonts.body, ['400', '500', '600'])

  const block = `import { ${[...new Set([display, body])].join(', ')} } from 'next/font/google'`

  const declarations = `const display = ${display}({
  subsets: ['latin'],
  weight: ${JSON.stringify(displayWeights)},
  variable: '--font-display-google',
  display: 'swap',
})

const body = ${body}({
  subsets: ['latin'],
  weight: ${JSON.stringify(bodyWeights)},
  variable: '--font-body-google',
  display: 'swap',
})`

  return layout
    .replace(/import \{[^}]+\} from 'next\/font\/google'/, block)
    .replace(
      /\/\/ The blueprint picks[\s\S]*?const display = body/,
      declarations,
    )
}

// ── main ────────────────────────────────────────────────────────────────────────────────

const blueprintPath = arg('blueprint')
const out = arg('out')
if (!blueprintPath || !out) {
  console.error('Uso: node generate.js --blueprint <fichero.json> --out <directorio>')
  process.exit(2)
}

const bp = JSON.parse(readFileSync(blueprintPath, 'utf8'))
const errors = validateBlueprint(bp)
if (errors.length) {
  console.error(`\nEl blueprint no está listo:\n${errors.map((e) => `  · ${e}`).join('\n')}\n`)
  process.exit(1)
}

const target = resolve(out)
if (existsSync(target) && !flag('force')) {
  console.error(`Ya existe ${target}. Usa --force para reescribirlo.`)
  process.exit(1)
}
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

// 1. The chassis, minus what belongs to the generator's own machinery.
cpSync(join(ROOT, 'template'), target, {
  recursive: true,
  // The lockfile goes too: it pins `sitewright-core` to the **template's** own path, and a
  // generated site inheriting it sends npm looking for the core next to itself, with an
  // ENOENT that names a directory nobody wrote. The first `npm install` writes a fresh one.
  filter: (src) =>
    !/node_modules|\.next|payload-types\.ts|tsconfig\.tsbuildinfo|package-lock\.json/.test(src),
})

const modules = bp.modules
const order = sectionOrder(bp)
const wirings = []
for (const id of Object.keys(modules)) {
  let wiring
  try {
    ;({ wiring } = await import(join(ROOT, 'modules', id, 'wiring.js')))
  } catch (err) {
    // A broken module leaves a directory that looks like a site and is only the empty
    // chassis. Saying so beats letting somebody debug a "generated" site that never was.
    rmSync(target, { recursive: true, force: true })
    console.error(`\nEl módulo "${id}" no se pudo cargar, así que no se ha generado nada:\n\n${err}\n`)
    process.exit(1)
  }
  const wiringErrors = validateWiring(id, wiring)
  if (wiringErrors.length) {
    rmSync(target, { recursive: true, force: true })
    console.error(`\nNo se ha generado nada:\n\n${wiringErrors.map((e) => `  - ${e}`).join('\n')}\n`)
    process.exit(1)
  }
  wirings.push(wiring)
  cpSync(join(ROOT, 'modules', id), join(target, 'src/modules', id), {
    recursive: true,
    filter: (src) => !/module\.json|wiring\.js|package\.json|section\.css/.test(src),
  })
  // Titles default to the plural label: the client's own word for the thing.
  modules[id].title = modules[id].title ?? modules[id].labels?.plural ?? id
}

const read = (path) => readFileSync(join(target, path), 'utf8')
const write = (path, content) => writeFileSync(join(target, path), content)

write('src/site.config.ts', siteConfig(bp, modules, wirings))
write('src/site.modules.ts', siteModules(bp, modules, wirings))
write('src/globals/SiteSettings.ts', siteSettings(read('src/globals/SiteSettings.ts'), bp, modules, wirings))
write('src/app/(frontend)/page.tsx', homePage(bp, modules, wirings, order))
write('scripts/seed.ts', seedScript(bp, modules, wirings))
write('CLAUDE.md', siteGuide(bp, modules))
write('README.md', siteReadme(bp, modules))
const pages = writeModulePages(target, bp, modules, wirings, write)
write(
  'src/app/(frontend)/styles.css',
  nameStylesheet(
    moduleStyles(applyPalette(read('src/app/(frontend)/styles.css'), bp.design), target, modules),
    bp.identity.name,
  ),
)
write(
  'src/app/(frontend)/layout.tsx',
  applyFonts(read('src/app/(frontend)/layout.tsx'), bp.design).replace(
    '<ConsentProvider\n        storageKey={site.id}\n        cookiesHref={site.routes.cookies}',
    `<ConsentProvider\n        storageKey={site.id}${modules.media ? '\n        hasEmbeds' : ''}\n        cookiesHref={site.routes.cookies}`,
  ),
)

// The default icon, from what the blueprint already knows. It is a placeholder — the
// client replaces it from the panel — but a placeholder with the site's initials and colour
// beats inheriting somebody else's favicon, which is what every generated site did until a
// third one made it obvious.
write(
  'public/icon.svg',
  defaultIconSvg({
    name: bp.identity.name,
    accent: bp.design.palette.accent,
    ground: bp.design.palette.ground,
  }),
)

// The domain lived in three places and the one nobody wrote was the one that won at
// runtime: `NEXT_PUBLIC_SITE_URL`. It gets written here too, from the same answer.
{
  let env = read('.env.example').replace(
    /^EMAIL_FROM_NAME=.*$/m,
    `EMAIL_FROM_NAME=${bp.identity.name}`,
  )
  if (bp.identity.url) {
    env = env.replace(/^NEXT_PUBLIC_SITE_URL=.*$/m, `NEXT_PUBLIC_SITE_URL=${bp.identity.url}`)
  }
  write('.env.example', env)
}

const pkg = JSON.parse(read('package.json'))
pkg.name = bp.identity.id
pkg.description = `Web de ${bp.identity.name}`
if (bp.identity.url) {
  pkg.scripts.audit = pkg.scripts.audit.replace('http://localhost:3000', bp.identity.url)
}
// The published package by default: a `file:` path does not survive a deploy, because only
// the site's own repository gets uploaded. `--core file:…` still works for developing the
// core against a site.
pkg.dependencies['sitewright-core'] =
  arg('core') ?? `^${JSON.parse(readFileSync(join(ROOT, 'core/package.json'), 'utf8')).version}`
write('package.json', JSON.stringify(pkg, null, 2) + '\n')

console.log(`
Sitio generado en ${target}

  ${Object.keys(modules).length} módulos: ${Object.keys(modules).join(', ')}
  ${pages.length} páginas propias: ${pages.map((p) => p.replace('src/app/(frontend)', '')).join(', ')}
  Paleta y tipografías aplicadas · rutas y etiquetas escritas en src/site.config.ts

Lo que falta, y no lo hace el generador:

  1. cp .env.example .env  y pon DATABASE_URL (una rama de Neon para este sitio)${
    bp.identity.url
      ? ''
      : `
     (sin dominio propio: no pongas NEXT_PUBLIC_SITE_URL y el sitio usará su dirección
      de Vercel; cuando compréis el dominio, ponedlo en Vercel y en src/site.config.ts)`
  }
  2. npm install && npm run generate:types && npm run icons
  3. npm run migrate:create -- initial && npm run migrate
  4. npm run seed        (usuario del panel y ajustes)
  5. npm run dev         y escribe los textos en /admin
  6. npm run audit -- --url http://localhost:3000

Lo que sigue siendo trabajo de una persona: el hero, los textos y las fotos.
`)
