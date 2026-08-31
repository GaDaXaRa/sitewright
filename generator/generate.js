#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sectionOrder, validateBlueprint } from './schema.js'
import { defaultIconSvg } from '../core/dist/index.js'

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
  url: '${bp.identity.url}',

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

// ── payload.config.ts ───────────────────────────────────────────────────────────────────

function payloadConfig(template, bp, modules, wirings) {
  const imports = wirings.map((w) => w.collectionImport).join('\n')
  const calls = wirings
    .map((w) => `    ${w.collectionCall(modules[w.id], bp)},`)
    .join('\n')

  return template
    .replace(
      "import { site } from './site.config'",
      `import { site } from './site.config'\n${imports}`,
    )
    .replace(
      `  // The generator appends each module's collection here.\n  collections: [Users, Media],`,
      `  collections: [\n    Users,\n    Media,\n${calls}\n  ],`,
    )
    .replace(
      "altExample: 'Una foto del equipo trabajando',",
      `altExample: '${bp.design.altExample ?? 'Una foto del equipo trabajando'}',`,
    )
}

// ── lib/data.ts ─────────────────────────────────────────────────────────────────────────

function dataLoader(bp, modules, wirings) {
  const queried = wirings.filter((w) => w.dataQuery)
  const names = queried.map((w) => (w.id === 'notices' ? 'notices' : w.variable))
  const queries = queried.map((w) => `        ${w.dataQuery(modules[w.id], bp)},`).join('\n')
  const notices = wirings.find((w) => w.id === 'notices')
  const returned = queried
    .map((w) => (w.id === 'notices' ? null : `      ${w.variable}: ${w.variable}.docs,`))
    .filter(Boolean)
  const empties = queried
    .map((w) => (w.id === 'notices' ? null : `      ${w.variable}: [],`))
    .filter(Boolean)

  return `import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { site } from '@/site.config'
import type { SiteSetting } from '@/payload-types'

/**
 * What the public pages read from the CMS, cached per render.
 *
 * Two things it guarantees. First, \`generateMetadata\` and the page share a single query
 * instead of asking twice. Second, **the site degrades instead of breaking**: if the
 * database is unreachable while a page is generated, the build still produces a page with
 * the defaults rather than failing.
 */
const FALLBACK = { id: 0, siteName: site.name } as SiteSetting

export const loadSettings = cache(async (): Promise<SiteSetting> => {
  try {
    const payload = await getPayload({ config: await config })
    return (await payload.findGlobal({ slug: 'site-settings' })) ?? FALLBACK
  } catch (err) {
    console.error('No se pudieron leer los ajustes del sitio:', err)
    return FALLBACK
  }
})

export const loadSiteContent = cache(async () => {
  try {
    const payload = await getPayload({ config: await config })
    const [settings${names.length ? ', ' + names.join(', ') : ''}] = await Promise.all([
        payload.findGlobal({ slug: 'site-settings' }),
${queries}
      ])
${notices ? `\n    ${notices.dataPick}\n` : `\n    // The moment the page is generated: a component must not read the clock while
    // rendering, or the same render would place a dated item differently.
    const now = Date.now()\n`}
    return {
      settings: settings ?? FALLBACK,
${returned.join('\n')}${notices ? '\n      notice,' : ''}
      now,
    }
  } catch (err) {
    console.error('No se pudo cargar el contenido del sitio:', err)
    return {
      settings: FALLBACK,
${empties.join('\n')}${notices ? '\n      notice: null,' : ''}
      now: Date.now(),
    }
  }
})
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

import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { site } from '@/site.config'
import { alternateTones, mediaAlt, mediaFocal, mediaUrl${usesSplit ? ', splitEvents' : ''} } from 'sitewright-core'

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
        links={[...site.nav]}
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

      <Footer settings={settings} links={[...site.nav]} />
    </>
  )
}
`
}

// ── llms.txt ────────────────────────────────────────────────────────────────────────────

function llmsRoute(bp, modules, wirings) {
  const contributors = wirings.filter((w) => w.llmsSection || w.llmsSpread)
  const imports = contributors.map((w) => w.llmsImport).join('\n')
  const vars = [...new Set(contributors.map((w) => w.variable))]
  const usesNow = contributors.some((w) => w.llmsSpread)
  const sections = contributors
    .map((w) =>
      w.llmsSpread ? `    ${w.llmsSpread(modules[w.id], bp)},` : `    ${w.llmsSection(modules[w.id], bp)},`,
    )
    .join('\n')

  return `import { loadSiteContent } from '@/lib/data'
import { buildLlmsTxt } from '@/lib/llmsTxt'
${imports}

/**
 * /llms.txt — a plain-text summary for AI assistants.
 *
 * Generated from the CMS, so it cannot fall out of date, and **nothing is invented**: what
 * the client has not written does not appear. A made-up detail here is what an assistant
 * repeats as fact.
 */
export const revalidate = 3600

export async function GET() {
  const { settings${vars.length ? ', ' + vars.join(', ') : ''}${usesNow ? ', now' : ''} } = await loadSiteContent()

  const text = buildLlmsTxt({
    settings,
    sections: [
${sections}
    ],
  })

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
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
function settingsContent(bp) {
  const entries = Object.entries(bp.content?.settings ?? {})
  return entries.length
    ? entries.map(([key, value]) => `${key}: ${JSON.stringify(value)},`).join('\n      ') + '\n      '
    : ''
}

function seedScript(bp, modules, wirings) {
  // Written copy wins over the module's generic example: what the interview drafted for
  // this business is worth more than "Primera actividad", and it is what the client will
  // correct rather than write from scratch.
  const written = (id) => {
    const items = bp.content?.[id]
    if (!Array.isArray(items) || !items.length) return null
    const collection = { catalog: 'catalog', schedule: 'schedule', pricing: 'pricing', team: 'team', media: 'embeds', reviews: 'reviews', faq: 'faqs', notices: 'notices' }[id]
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
      siteName: site.name,
      ${bp.identity.tagline ? `tagline: '${bp.identity.tagline}',\n      ` : ''}${bp.identity.email ? `email: '${bp.identity.email}',\n      ` : ''}${bp.identity.city ? `city: '${bp.identity.city}',\n      ` : ''}${bp.identity.schemaType ? `schemaType: '${bp.identity.schemaType}',\n      ` : ''}legalHolder: '${bp.legal.holder}',
      ${bp.legal.id ? `legalId: '${bp.legal.id}',\n      ` : ''}${bp.legal.address ? `legalAddress: '${bp.legal.address}',\n      ` : ''}${settingsContent(bp)}analyticsConsent: true,
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
    for (const build of [w.indexPage, w.detailPage]) {
      if (!build) continue
      const page = build(modules[w.id], bp)
      mkdirSync(join(target, dirname(page.path)), { recursive: true })
      write(page.path, page.source)
      written.push(page.path)
    }
  }
  return written
}

// ── sitemap ─────────────────────────────────────────────────────────────────────────────

function sitemap(template, bp, modules, wirings) {
  const fixed = Object.values(modules)
    .filter((m) => m.route)
    .map(
      (m) =>
        `    {\n      url: \`\${SITE_URL}${m.route}\`,\n      lastModified: new Date(),\n      changeFrequency: 'weekly',\n      priority: 0.8,\n    },`,
    )
    .join('\n')

  // Modules with a page per document need the database, so they go inside the try/catch:
  // with it unreachable the fixed pages must still come out.
  const perDocument = wirings
    .filter((w) => w.detailPage)
    .map((w) => {
      const m = modules[w.id]
      const collection = w.id === 'team' ? 'team' : 'catalog'
      return `      const ${w.id}Docs = await payload.find({ collection: '${collection}', limit: 200, depth: 0 })
      for (const doc of ${w.id}Docs.docs) {
        if (doc.slug) {
          entries.push({
            url: \`\${SITE_URL}${m.route}/\${doc.slug}\`,
            lastModified: doc.updatedAt ? new Date(doc.updatedAt) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          })
        }
      }`
    })
    .join('\n\n')

  let out = template.replace(
    "  // The generator adds one entry per module page here.",
    fixed,
  )

  if (perDocument) {
    out = out.replace(
      `import type { MetadataRoute } from 'next'`,
      `import type { MetadataRoute } from 'next'\nimport { getPayload } from 'payload'\nimport config from '@/payload.config'`,
    ).replace(
      `  // Modules with a page per document (a member, a project) add their entries here, inside
  // a try/catch: with the database unavailable, the fixed pages must still be returned.
`,
      `  try {
    const payload = await getPayload({ config: await config })

${perDocument}
  } catch {
    // With the database unavailable, at least the fixed pages are returned.
  }

`,
    )
  }

  return out
}

// ── design ──────────────────────────────────────────────────────────────────────────────

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

  let out = css.replace(
    /color-scheme:\s*\w+;/,
    `color-scheme: ${design.scheme === 'light' ? 'light' : 'dark'};`,
  )
  for (const [token, value] of Object.entries(map)) {
    out = out.replace(new RegExp(`(--${token}:\\s*)#[0-9a-fA-F]{3,8}`), `$1${value}`)
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
  wirings.push(wiring)
  cpSync(join(ROOT, 'modules', id), join(target, 'src/modules', id), {
    recursive: true,
    filter: (src) => !/module\.json|wiring\.js|package\.json|section\.css/.test(src),
  })
  // Titles default to the plural label: the client's own word for the thing.
  modules[id].title = modules[id].title ?? modules[id].labels.plural
}

const read = (path) => readFileSync(join(target, path), 'utf8')
const write = (path, content) => writeFileSync(join(target, path), content)

write('src/site.config.ts', siteConfig(bp, modules, wirings))
write('src/payload.config.ts', payloadConfig(read('src/payload.config.ts'), bp, modules, wirings))
write('src/globals/SiteSettings.ts', siteSettings(read('src/globals/SiteSettings.ts'), bp, modules, wirings))
write('src/lib/data.ts', dataLoader(bp, modules, wirings))
write('src/app/(frontend)/page.tsx', homePage(bp, modules, wirings, order))
write('src/app/llms.txt/route.ts', llmsRoute(bp, modules, wirings))
write('src/app/sitemap.ts', sitemap(read('src/app/sitemap.ts'), bp, modules, wirings))
write('scripts/seed.ts', seedScript(bp, modules, wirings))
const pages = writeModulePages(target, bp, modules, wirings, write)
write(
  'src/app/(frontend)/styles.css',
  moduleStyles(applyPalette(read('src/app/(frontend)/styles.css'), bp.design), target, modules),
)
write(
  'src/app/(frontend)/layout.tsx',
  applyFonts(read('src/app/(frontend)/layout.tsx'), bp.design).replace(
    '<ConsentProvider storageKey={site.id} cookiesHref={site.routes.cookies}>',
    `<ConsentProvider storageKey={site.id} cookiesHref={site.routes.cookies}${modules.media ? ' hasEmbeds' : ''}>`,
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

const pkg = JSON.parse(read('package.json'))
pkg.name = bp.identity.id
pkg.description = `Web de ${bp.identity.name}`
pkg.scripts.audit = pkg.scripts.audit.replace('http://localhost:3000', bp.identity.url)
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

  1. cp .env.example .env  y pon DATABASE_URL (una rama de Neon para este sitio)
  2. npm install && npm run generate:types && npm run icons
  3. npm run migrate:create -- initial && npm run migrate
  4. npm run seed        (usuario del panel y ajustes)
  5. npm run dev         y escribe los textos en /admin
  6. npm run audit -- --url http://localhost:3000

Lo que sigue siendo trabajo de una persona: el hero, los textos y las fotos.
`)
