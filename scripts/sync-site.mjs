#!/usr/bin/env node
// Lleva a una web ya hecha las correcciones del chasis y de los módulos.
//
// `sync-core` trae el núcleo, que va por npm; esto trae lo que se copió el día que la web
// nació y desde entonces nadie volvía a tocar. Sin `--apply` no escribe nada: enseña qué
// cambiaría, porque copiar encima de una web viva no es algo que se haga a ciegas.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { siteDrift } from './lib/drift.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const target = args.find((a) => !a.startsWith('--'))
if (!target) stop('Uso: npm run sync-site -- <ruta-del-sitio> [--apply]')

const site = isAbsolute(target) ? target : resolve(process.cwd(), target)
if (!existsSync(join(site, 'package.json'))) stop(`${site} no parece un sitio: no hay package.json.`)

const name = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8')).name ?? '(sin nombre)'
const { checked, modules, differ, missing } = siteDrift(root, site)

console.log(`\n  ${name}  ${site}`)
console.log(`  ${checked} ficheros compartidos · ${modules.length} módulos: ${modules.join(', ')}\n`)

if (!differ.length && !missing.length) {
  console.log('  Todo lo que viaja igual a todas las webs está al día.\n')
  process.exit(0)
}

for (const { rel } of differ) console.log(`  distinto  ${rel}`)
for (const { rel } of missing) console.log(`  falta     ${rel}`)

if (!apply) {
  console.log(`\n  Nada escrito. Para aplicarlo:  npm run sync-site -- ${target} --apply\n`)
  process.exit(0)
}

for (const { from, to } of [...differ, ...missing]) {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}

console.log(`\n  ${differ.length + missing.length} ficheros copiados.

  Queda por hacer, y conviene hacerlo antes de subir nada:
    npm run typecheck        en el sitio, que es lo que caza un cambio incompatible
    git diff                 mirar lo que ha entrado, no fiarse
`)
