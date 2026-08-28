#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sectionOrder, validateBlueprint } from './schema.js'

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

function siteConfig(bp, modules) {
  const routes = Object.entries(modules)
    .filter(([, m]) => m.route)
    .map(([id, m]) => `    ${id}: '${m.route}',`)

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
import { alternateTones, mediaAlt, mediaFocal, mediaUrl${usesSplit ? ', splitEvents' : ''} } from '@sitewright/core'

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
        links={[
${navLinks.join('\n')}
        ]}${cta ? `\n        cta={{ href: '${cta.href}', label: '${cta.label}' }}` : ''}
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

      <Footer
        settings={settings}
        links={[
${navLinks.join('\n')}
        ]}
      />
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
  filter: (src) => !/node_modules|\.next|payload-types\.ts|tsconfig\.tsbuildinfo/.test(src),
})

const modules = bp.modules
const order = sectionOrder(bp)
const wirings = []
for (const id of Object.keys(modules)) {
  const { wiring } = await import(join(ROOT, 'modules', id, 'wiring.js'))
  wirings.push(wiring)
  cpSync(join(ROOT, 'modules', id), join(target, 'src/modules', id), {
    recursive: true,
    filter: (src) => !/module\.json|wiring\.js/.test(src),
  })
  // Titles default to the plural label: the client's own word for the thing.
  modules[id].title = modules[id].title ?? modules[id].labels.plural
}

const read = (path) => readFileSync(join(target, path), 'utf8')
const write = (path, content) => writeFileSync(join(target, path), content)

write('src/site.config.ts', siteConfig(bp, modules))
write('src/payload.config.ts', payloadConfig(read('src/payload.config.ts'), bp, modules, wirings))
write('src/globals/SiteSettings.ts', siteSettings(read('src/globals/SiteSettings.ts'), bp, modules, wirings))
write('src/lib/data.ts', dataLoader(bp, modules, wirings))
write('src/app/(frontend)/page.tsx', homePage(bp, modules, wirings, order))
write('src/app/llms.txt/route.ts', llmsRoute(bp, modules, wirings))
write('src/app/(frontend)/styles.css', applyPalette(read('src/app/(frontend)/styles.css'), bp.design))
write('src/app/(frontend)/layout.tsx', applyFonts(read('src/app/(frontend)/layout.tsx'), bp.design))

const pkg = JSON.parse(read('package.json'))
pkg.name = bp.identity.id
pkg.description = `Web de ${bp.identity.name}`
pkg.scripts.audit = pkg.scripts.audit.replace('http://localhost:3000', bp.identity.url)
pkg.dependencies['@sitewright/core'] = arg('core') ?? 'file:../sitewright/core'
write('package.json', JSON.stringify(pkg, null, 2) + '\n')

console.log(`
Sitio generado en ${target}

  ${Object.keys(modules).length} módulos: ${Object.keys(modules).join(', ')}
  Paleta y tipografías aplicadas · rutas y etiquetas escritas en src/site.config.ts

Lo que falta, y no lo hace el generador:

  1. cp .env.example .env  y pon DATABASE_URL (una rama de Neon para este sitio)
  2. npm install --install-links && npm run generate:types
  3. npm run migrate:create -- initial && npm run migrate
  4. npm run seed        (usuario del panel y ajustes)
  5. npm run dev         y escribe los textos en /admin
  6. npm run audit -- --url http://localhost:3000

Lo que sigue siendo trabajo de una persona: el hero, los textos y las fotos.
`)
