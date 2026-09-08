#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sectionOrder, validateBlueprint, validateWiring } from './schema.js'
import { MODULE_SKIP, TEMPLATE_SKIP } from './generated.js'
import { siteDrift, writeSeal } from '../scripts/lib/drift.mjs'
import { defaultIconSvg } from '../core/dist/index.js'
import { GeneratorStopped, replaceOrDie } from './lib/text.js'
import { homePage, siteConfig, siteModules } from './lib/site.js'
import { seedScript, siteSettings } from './lib/panel.js'
import { siteGuide, siteReadme } from './lib/docs.js'
import { applyFonts, applyPalette, moduleStyles, nameStylesheet } from './lib/design.js'

/**
 * From a blueprint to a site on disk.
 *
 * Everything here is **deterministic**: the same blueprint writes the same files, so a
 * generated site can be regenerated, diffed and argued with. The parts that cannot be
 * derived — the copy, the hero, whatever the business does that nothing else does — are
 * left for a person (or a conversation) to write afterwards, in files that are then theirs.
 *
 * Aquí sólo está **la dirección**: leer los argumentos, validar, copiar el chasis, pedirle
 * a cada escritor su fichero y guardarlo. Quien redacta vive en `lib/`, en funciones puras
 * que reciben el blueprint y devuelven texto. Estaban aquí dentro, en un guion que se
 * ejecutaba al importarlo: novecientas líneas que ninguna prueba podía llamar, vigiladas
 * sólo por compilar tres webs enteras en la CI.
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

/** El directorio a medio escribir, para no dejarlo ahí cuando algo falla. */
let started = null

/**
 * Parar del todo.
 *
 * Media web generada es peor que ninguna: parece un sitio y no lo es, y quien la abra
 * depurará un problema que no existe. Se borra lo escrito y se dice por qué.
 */
function abort(why) {
  if (started) rmSync(started, { recursive: true, force: true })
  console.error(`\nNo se ha generado nada: ${why}\n`)
  process.exit(1)
}

/**
 * Escribir la web, y parar entera si un escritor no reconoce la plantilla.
 *
 * Los escritores ya no pueden matar el proceso —eso es lo que les impedía tener pruebas—,
 * así que avisan con `TemplateChanged` y la decisión se toma aquí, que es donde se sabe qué
 * hay a medio escribir. El resultado para quien lo ejecuta es el de siempre: nada de media
 * web en el disco, y el motivo por delante.
 */
function writing(work) {
  try {
    return work()
  } catch (err) {
    if (err instanceof GeneratorStopped) abort(err.message)
    throw err
  }
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
started = target

// 1. The chassis, minus what belongs to the generator's own machinery.
cpSync(join(ROOT, 'template'), target, {
  recursive: true,
  // The lockfile goes too: it pins `sitewright-core` to the **template's** own path, and a
  // generated site inheriting it sends npm looking for the core next to itself, with an
  // ENOENT that names a directory nobody wrote. The first `npm install` writes a fresh one.
  filter: (src) => !TEMPLATE_SKIP.test(src),
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
    filter: (src) => !MODULE_SKIP.test(src),
  })
  // Titles default to the plural label: the client's own word for the thing.
  modules[id].title = modules[id].title ?? modules[id].labels?.plural ?? id
}

const read = (path) => readFileSync(join(target, path), 'utf8')
const write = (path, content) => writeFileSync(join(target, path), content)

writing(() => {
  write('src/site.config.ts', siteConfig(bp, modules, wirings))
  write('src/site.modules.ts', siteModules(bp, modules, wirings))
  write('src/globals/SiteSettings.ts', siteSettings(read('src/globals/SiteSettings.ts'), bp, modules, wirings))
  write('src/app/(frontend)/page.tsx', homePage(bp, modules, wirings, order))
  write('scripts/seed.ts', seedScript(bp, modules, wirings))
  // La prosa de los dos vive en `generator/templates/`, en markdown de verdad: dentro de una
  // plantilla literal había que escapar cada comilla invertida, y eso ya se ha subido roto.
  const prosa = (nombre) => readFileSync(join(ROOT, 'generator/templates', nombre), 'utf8')
  write('CLAUDE.md', siteGuide(prosa('site-CLAUDE.md'), bp, modules))
  write('README.md', siteReadme(prosa('site-README.md'), bp, modules))
  write(
    'src/app/(frontend)/styles.css',
    nameStylesheet(
      moduleStyles(applyPalette(read('src/app/(frontend)/styles.css'), bp.design), join(ROOT, 'modules'), modules),
      bp.identity.name,
    ),
  )
  write(
    'src/app/(frontend)/layout.tsx',
    replaceOrDie(
      applyFonts(read('src/app/(frontend)/layout.tsx'), bp.design),
      '<ConsentProvider\n        storageKey={site.id}\n        cookiesHref={site.routes.cookies}',
      `<ConsentProvider\n        storageKey={site.id}${modules.media ? '\n        hasEmbeds' : ''}\n        cookiesHref={site.routes.cookies}`,
      'el consentimiento de los reproductores incrustados',
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
    let env = replaceOrDie(
      read('.env.example'),
      /^EMAIL_FROM_NAME=.*$/m,
      `EMAIL_FROM_NAME=${bp.identity.name}`,
      'el nombre del remitente de los correos',
    )
    if (bp.identity.url) {
      env = replaceOrDie(
        env,
        /^NEXT_PUBLIC_SITE_URL=.*$/m,
        `NEXT_PUBLIC_SITE_URL=${bp.identity.url}`,
        'la dirección pública del sitio',
      )
    }
    write('.env.example', env)
  }

  // El sello de lo que acaba de entregar: sin él, la primera puesta al día no sabría
  // distinguir un fichero que se ha quedado atrás de uno que alguien personalizó aquí, y
  // `sync-site` los trataría igual —copiando encima de los dos—.
  writeSeal(target, siteDrift(ROOT, target).pairs)

  // El blueprint, dentro de la web que ha producido.
  //
  // Vivía sólo en `generator/blueprints/`, y de las dos webs en producción una no tenía el
  // suyo en ninguna parte: sin él no se puede regenerar nada para comparar, así que lo único
  // que quedaba era leer los ficheros generados hacia atrás. Guardado aquí, la receta viaja
  // con la web y no se puede perder por separado.
  write('sitewright.json', JSON.stringify(bp, null, 2) + '\n')

  const pkg = JSON.parse(read('package.json'))
  pkg.name = bp.identity.id
  pkg.description = `Web de ${bp.identity.name}`
  if (bp.identity.url) {
    pkg.scripts.audit = replaceOrDie(
      pkg.scripts.audit,
      'http://localhost:3000',
      bp.identity.url,
      'la dirección que audita npm run audit',
    )
  }
  // The published package by default: a `file:` path does not survive a deploy, because only
  // the site's own repository gets uploaded. `--core file:…` still works for developing the
  // core against a site.
  pkg.dependencies['sitewright-core'] =
    arg('core') ?? `^${JSON.parse(readFileSync(join(ROOT, 'core/package.json'), 'utf8')).version}`
  write('package.json', JSON.stringify(pkg, null, 2) + '\n')
})

console.log(`
Sitio generado en ${target}

  ${Object.keys(modules).length} módulos: ${Object.keys(modules).join(', ')}
  ${wirings.filter((w) => w.pagePath).length} secciones con página propia y ${wirings.filter((w) => w.detailPath).length} con ficha, servidas por [seccion] y [seccion]/[slug]
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
