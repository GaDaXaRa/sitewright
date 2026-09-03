#!/usr/bin/env node
// Qué versión del núcleo tiene una web, cuántas se está perdiendo y qué hay en medio.
// Existe porque nadie lleva esa cuenta: subsuelo lleva desde agosto cinco versiones por
// detrás y nada lo dice hasta que alguien va a mirarlo a mano.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { changelogSections, diagnose, versionsAfter } from '../core/dist/index.js'

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
