#!/usr/bin/env node
// Lleva a una web ya hecha las correcciones del chasis y de los módulos.
//
// `sync-core` trae el núcleo, que va por npm; esto trae lo que se copió el día que la web
// nació y desde entonces nadie volvía a tocar. Sin `--apply` no escribe nada: enseña qué
// cambiaría, porque copiar encima de una web viva no es algo que se haga a ciegas.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEAL, siteDrift, writeSeal } from './lib/drift.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
// Pisar una personalización tiene que ser una decisión que alguien escribe, no el efecto
// de un comando que parecía inofensivo.
const force = args.includes('--force')
const target = args.find((a) => !a.startsWith('--'))
if (!target) stop('Uso: npm run sync-site -- <ruta-del-sitio> [--apply] [--force]')

const site = isAbsolute(target) ? target : resolve(process.cwd(), target)
if (!existsSync(join(site, 'package.json'))) stop(`${site} no parece un sitio: no hay package.json.`)

const name = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8')).name ?? '(sin nombre)'
const { checked, modules, pairs, behind, customised, unknown, missing } = siteDrift(root, site)

console.log(`\n  ${name}  ${site}`)
console.log(`  ${checked} ficheros compartidos · ${modules.length} módulos: ${modules.join(', ')}\n`)

const traibles = [...behind, ...missing]
const propios = [...customised, ...unknown]

if (!traibles.length && !propios.length) {
  console.log('  Todo lo que viaja igual a todas las webs está al día.')
  if (apply) {
    const sellados = writeSeal(site, pairs)
    console.log(`  Sello al día: ${sellados} ficheros en ${SEAL}.`)
  }
  console.log('')
  process.exit(0)
}

for (const { rel } of behind) console.log(`  se ha quedado atrás  ${rel}`)
for (const { rel } of missing) console.log(`  falta                ${rel}`)

if (propios.length) {
  console.log('')
  for (const { rel } of customised) console.log(`  PERSONALIZADO AQUÍ   ${rel}`)
  for (const { rel } of unknown) console.log(`  sin sello            ${rel}`)
  console.log(`
  ${propios.length === 1 ? 'Ese no se toca' : `Esos ${propios.length} no se tocan`}: su contenido no es el que la fábrica entregó, así que
  copiar encima borraría lo que alguien escribió en esta web.${
    unknown.length
      ? `\n  Los "sin sello" son de antes de que esto se midiera: no se puede saber si\n  alguien los tocó, y no saberlo no es permiso para pisarlos.`
      : ''
  }
    git -C ${target} diff -- <fichero>    para ver qué tiene de propio
    npm run sync-site -- ${target} --apply --force    para pisarlos de todas formas`)
}

if (!apply) {
  console.log(`\n  Nada escrito. Para aplicarlo:  npm run sync-site -- ${target} --apply\n`)
  process.exit(0)
}

const aCopiar = force ? [...traibles, ...propios] : traibles
for (const { from, to } of aCopiar) {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}

const sellados = writeSeal(site, pairs)

console.log(`\n  ${plural(aCopiar.length, 'fichero copiado', 'ficheros copiados')}${
  !force && propios.length ? `, y ${plural(propios.length, 'respetado', 'respetados')}` : ''
}. Sello al día: ${sellados} ficheros.

  Queda por hacer, y conviene hacerlo antes de subir nada:
    npm run typecheck        en el sitio, que es lo que caza un cambio incompatible
    git diff                 mirar lo que ha entrado, no fiarse
`)
