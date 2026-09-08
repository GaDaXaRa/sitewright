#!/usr/bin/env node
// Qué versión del núcleo tiene una web, cuántas se está perdiendo y qué hay en medio.
// Existe porque nadie lleva esa cuenta: subsuelo lleva desde agosto cinco versiones por
// detrás y nada lo dice hasta que alguien va a mirarlo a mano.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { changelogSections, diagnose, versionsAfter } from './lib/versions.mjs'
import { driftSummary, siteDrift, writtenDrift } from './lib/drift.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

const target = process.argv[2]
if (!target) stop('Uso: npm run doctor -- <ruta-del-sitio>')

const site = isAbsolute(target) ? target : resolve(process.cwd(), target)
const pkg = readJson(join(site, 'package.json'))
if (!pkg) stop(`${site} no parece un sitio: no hay package.json.`)

const declared = pkg.dependencies?.['sitewright-core'] ?? null
const installed = readJson(join(site, 'node_modules/sitewright-core/package.json'))?.version ?? null

let published = null
try {
  // --prefer-online, porque npm contesta de caché y ya ha mentido sobre qué existe.
  published = JSON.parse(
    execFileSync('npm', ['view', 'sitewright-core', 'versions', '--json', '--prefer-online'], {
      encoding: 'utf8',
    }),
  )
} catch {
  // Sin registro se dice lo que se sabe y no se inventa el resto.
}

const SYMBOL = { ok: '·', warn: '!', fail: '✗' }

console.log(`\n  ${pkg.name ?? '(sin nombre)'}  ${site}\n`)
for (const d of diagnose({ declared, installed, published })) {
  console.log(`  ${SYMBOL[d.level]} ${d.title.padEnd(30)} ${d.detail}`)
}

// El núcleo no es lo único que se queda atrás: el chasis y los módulos se copiaron el día
// que nació la web, y una corrección posterior no llega sola.
const drift = siteDrift(root, site)
const atrasados = drift.behind.length + drift.missing.length
const propios = drift.customised.length + drift.unknown.length
console.log(
  `  ${atrasados || propios ? SYMBOL.warn : SYMBOL.ok} ${'Ficheros de la fábrica'.padEnd(30)} ${driftSummary(drift)}`,
)
for (const { rel } of drift.behind) console.log(`      se ha quedado atrás  ${rel}`)
for (const { rel } of drift.missing) console.log(`      falta                ${rel}`)
// Personalizado y atrasado piden cosas contrarias, así que no se cuentan juntos: uno se
// trae con un comando y el otro es una decisión que alguien tomó aquí.
for (const { rel } of drift.customised) console.log(`      personalizado aquí   ${rel}`)
for (const { rel } of drift.unknown) console.log(`      sin sello            ${rel}`)
if (atrasados) console.log(`      Para traerlos:  npm run sync-site -- ${target} --apply`)
if (propios) console.log(`      Los personalizados no los toca sync-site: mira su git diff antes de nada.`)

// Y los que el generador escribe para esta web: se regenera desde su blueprint y se mira
// en qué difieren. Aquí no hay nada que copiar automáticamente, porque un fichero distinto
// puede ser una corrección que falta o una decisión que alguien tomó a mano.
const written = writtenDrift(root, site)
if (!written.available) {
  console.log(`  ${SYMBOL.warn} ${'Ficheros de esta web'.padEnd(30)} no se pueden comparar: ${written.why}`)
} else {
  const summary = written.differ.length
    ? `${written.differ.length} de ${written.checked} no son lo que el generador escribiría hoy`
    : `${written.checked} ficheros, iguales a lo que se generaría hoy`
  console.log(`  ${written.differ.length ? SYMBOL.warn : SYMBOL.ok} ${'Ficheros de esta web'.padEnd(30)} ${summary}`)
  for (const { rel } of written.differ) console.log(`      distinto  ${rel}`)
  if (written.differ.length) {
    console.log('      Míralos antes de tocar nada: puede ser una mejora que falta o algo hecho a mano.')
  }
}

const pending = published ? versionsAfter(installed ?? (declared ?? '').replace(/^[^\d]*/, ''), published) : []
if (pending.length) {
  const changelog = changelogSections(
    existsSync(join(root, 'core/CHANGELOG.md')) ? readFileSync(join(root, 'core/CHANGELOG.md'), 'utf8') : '',
  )
  console.log('\n  Lo que se está perdiendo:\n')
  for (const version of pending) {
    const notes = changelog.get(version)
    console.log(`  ${version}`)
    console.log(notes ? notes.replace(/^/gm, '    ') : '    (sin nota en el registro de cambios)')
    console.log('')
  }
  console.log(`  Para ponerla al día:  npm run sync-core -- ${target} ${pending[pending.length - 1]}\n`)
} else if (published) {
  console.log('')
}
