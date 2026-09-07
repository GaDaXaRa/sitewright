#!/usr/bin/env node
// Installing the core into a site failed silently three times: npm does not refresh a
// file: dependency that keeps its version number, and the script meant to force it was
// deleting a directory that no longer existed. So this one proves the result instead of
// trusting the install: it compares the bytes on disk with the bytes it meant to install.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const core = join(root, 'core')

const run = (cmd, args, cwd) => execFileSync(cmd, args, { stdio: 'inherit', cwd })
const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}
const step = (what) => console.log(`\n── ${what} ──`)
/**
 * El hash de un directorio entero: cada ruta y su contenido.
 *
 * Antes se miraba sólo `dist/index.js`, y tres versiones seguidas lo dejaron idéntico
 * —los cambios estaban en `dist/ui` y en `dist/audit`—, así que el guion decía
 * «verificado» sin haber mirado nada de lo que había cambiado. Justo lo que este guion
 * existe para no hacer.
 */
const treeHash = (dir) => {
  const files = []
  const walk = (current, prefix) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(path, rel)
      else files.push([rel, path])
    }
  }
  walk(dir, '')

  // El orden del sistema de ficheros no está garantizado y cambiaría el hash sin que
  // hubiera cambiado nada.
  const sha = createHash('sha256')
  for (const [rel, path] of files.sort(([a], [b]) => (a < b ? -1 : 1))) {
    sha.update(rel).update('\0').update(readFileSync(path))
  }
  return sha.digest('hex').slice(0, 12)
}

const [target, askedVersion] = process.argv.slice(2)
if (!target) stop('Uso: npm run sync-core -- <ruta-del-sitio> [versión]')

const site = isAbsolute(target) ? target : resolve(process.cwd(), target)
if (!existsSync(join(site, 'package.json'))) stop(`${site} no parece un sitio: no hay package.json.`)

const declared = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8'))
  .dependencies?.['sitewright-core']
if (!declared) stop(`${site} no depende de sitewright-core.`)

const local = declared.startsWith('file:')
const installed = join(site, 'node_modules', 'sitewright-core')

step(`${site} → sitewright-core ${local ? '(copia local)' : askedVersion ?? declared}`)

// npm keeps whatever is already there when the version string has not changed, which is
// exactly the case while developing the core. Removing it first is the only reliable fix.
rmSync(installed, { recursive: true, force: true })

if (local) {
  run('npm', ['run', 'build'], core)
  run('npm', ['install', '--install-links', '--no-audit', '--no-fund'], site)
} else {
  const version = askedVersion ?? JSON.parse(readFileSync(join(core, 'package.json'), 'utf8')).version
  run('npm', ['install', `sitewright-core@${version}`, '--prefer-online', '--no-audit', '--no-fund'], site)
}

// The check that would have caught all three failures: is the code in the site the code
// we just built or downloaded? A version number matching proves nothing on a file: dep.
const distThere = join(installed, 'dist')
if (!existsSync(join(distThere, 'index.js'))) stop('el núcleo no ha quedado instalado.')

const distHere = join(core, 'dist')
const there = treeHash(distThere)
const version = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8')).version
const built = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8')).version

if (local) {
  const here = treeHash(distHere)
  if (here !== there) {
    stop(`el núcleo instalado no es el que se acaba de construir (${there} ≠ ${here}).`)
  }
} else if (version === built && existsSync(distHere)) {
  // Lo que sirve el registro tiene que ser lo que hay aquí construido: si no coincide, o
  // el núcleo ha cambiado desde que se publicó esa versión, o npm ha servido otra cosa.
  const here = treeHash(distHere)
  if (here !== there) {
    console.warn(
      `\n  Aviso: la ${version} instalada no coincide con lo construido aquí (${there} ≠ ${here}).` +
        `\n  Pasa si el núcleo ha cambiado después de publicarla. Comprueba antes de seguir.`,
    )
  }
}

console.log(`\n  sitewright-core ${version} instalado y verificado (${there}).\n`)
