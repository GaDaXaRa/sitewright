#!/usr/bin/env node
// Lleva a una web ya hecha lo que su propio blueprint dice que es.
//
// `sync-site` trae las correcciones del chasis y de los módulos, que viajan iguales a todas
// las webs. Esto es la otra mitad: los ficheros que el generador **redacta para esta web**
// —la portada, las rutas, los ajustes del panel, la hoja de estilos— y que hasta ahora sólo
// se escribían el día que la web nació. Cambiar el blueprint no cambiaba nada, así que
// añadir una sección era editar a mano los seis ficheros que la arquitectura dice que no se
// editan a mano.
//
// Regenera la web desde el `sitewright.json` que lleva dentro y compara. Sin `--apply` no
// escribe: enseña qué cambiaría.
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEAL, whatToCopy, writeSeal, writtenDrift } from './lib/drift.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Los ficheros sin los cuales una sección nueva no llega a existir.
 *
 * No es decoración: si `site.config.ts` se respeta por llevar una ruta escrita a mano, el
 * módulo se copia entero y no lo renderiza nadie. Vale más decirlo que dejar que alguien lo
 * descubra buscando por qué su sección no sale.
 */
const NEEDED_BY_A_SECTION = [
  'src/site.config.ts',
  'src/site.modules.ts',
  'src/app/(frontend)/page.tsx',
  'src/app/(frontend)/styles.css',
  'src/globals/SiteSettings.ts',
  'scripts/seed.ts',
]

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

const stop = (why) => {
  console.error(`\n  ${why}\n`)
  process.exit(1)
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
// Aquí `--force` pisa la portada y la hoja de estilos de una web viva, que es donde vive
// casi todo lo que alguien escribe a mano. Tiene que ser una decisión, no una inercia.
const force = args.includes('--force')
/**
 * Traer un fichero y no los demás.
 *
 * Apareció en el primer uso real: una web anterior al sello tiene todo lo redactado «sin
 * sello», y ahí `--force` es la única forma de traer nada — pero fuerza **todo**, incluida
 * la hoja de estilos con el trabajo de diseño de esa web. Mirar un diff, comprobar que la
 * única diferencia es la de la fábrica y traer ese fichero es una operación legítima; sin
 * esto había que hacerla copiando a mano, que es justo lo que estos guiones existen para
 * que nadie tenga que hacer.
 */
const only = args.filter((a, i) => args[i - 1] === '--only')
const target = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--only')
if (!target) stop('Uso: npm run sync-written -- <ruta-del-sitio> [--apply] [--force] [--only <fichero>]')

const site = isAbsolute(target) ? target : resolve(process.cwd(), target)
if (!existsSync(join(site, 'package.json'))) stop(`${site} no parece un sitio: no hay package.json.`)

const name = JSON.parse(readFileSync(join(site, 'package.json'), 'utf8')).name ?? '(sin nombre)'

const drift = writtenDrift(root, site, { keep: true })
if (!drift.available) stop(`No se puede comparar: ${drift.why}`)

// El cuerpo va en una función porque hay que borrar lo regenerado pase lo que pase, y
// `process.exit` en mitad de un `try` **no ejecuta el `finally`**: cada salida temprana
// dejaba una copia entera de la web en el directorio temporal.
try {
  main()
} finally {
  rmSync(drift.out, { recursive: true, force: true })
}

function main() {
  const { checked, added, removed, pairs } = drift
  // El sello se escribe con **todos** los pares aunque se traiga uno: sellar es comprobar
  // que el contenido es el de la fábrica, y eso vale para cada fichero por separado.
  const chosen = (list) => (only.length ? list.filter(({ rel }) => only.includes(rel)) : list)
  const [behind, customised, unknown, missing] = [
    chosen(drift.behind),
    chosen(drift.customised),
    chosen(drift.unknown),
    chosen(drift.missing),
  ]

  console.log(`\n  ${name}  ${site}`)
  console.log(`  ${checked} ficheros redactados para esta web, regenerados desde su blueprint`)
  if (only.length) {
    const desconocidos = only.filter((rel) => !pairs.some((pair) => pair.rel === rel))
    if (desconocidos.length) stop(`--only no reconoce: ${desconocidos.join(', ')}`)
    console.log(`  Sólo se mira: ${only.join(', ')}`)
  }
  console.log('')

  if (added.length) console.log(`  módulo nuevo         ${added.join(', ')}`)
  if (removed.length) {
    // Borrar un directorio del que alguien puede haber editado la mitad no es ponerla al
    // día. Se dice, y lo quita una persona si de verdad quiere quitarlo.
    console.log(`  ya no lo enciende    ${removed.join(', ')}  (sigue en el disco: bórralo tú si toca)`)
  }
  if (added.length || removed.length) console.log('')

  const { copy: aCopiar, respected, seals } = whatToCopy(
    { behind, customised, unknown, missing },
    { apply, force },
  )
  const traibles = [...behind, ...missing]
  const propios = [...customised, ...unknown]

  if (!traibles.length && !propios.length) {
    console.log('  Esta web es exactamente lo que su blueprint dice que es.')
    if (seals) {
      console.log(`  Sello al día: ${writeSeal(site, pairs, { scope: 'written' })} ficheros en ${SEAL}.`)
    }
    console.log('')
    return
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
      ? `\n  Los "sin sello" son de antes de que el sello cubriera lo redactado: no se puede\n  saber si alguien los tocó, y no saberlo no es permiso para pisarlos.`
      : ''
  }
    git -C ${target} diff -- <fichero>    para ver qué tiene de propio
    npm run sync-written -- ${target} --apply --force    para pisarlos de todas formas
    npm run sync-written -- ${target} --apply --force --only <fichero>    para uno solo`)
  }

  if (!apply) {
    console.log(`\n  Nada escrito. Para aplicarlo:  npm run sync-written -- ${target} --apply\n`)
    return
  }

  for (const { from, to } of aCopiar) {
    mkdirSync(dirname(to), { recursive: true })
    copyFileSync(from, to)
  }

  const sellados = writeSeal(site, pairs, { scope: 'written' })

  console.log(`\n  ${plural(aCopiar.length, 'fichero copiado', 'ficheros copiados')}${
    respected.length ? `, y ${plural(respected.length, 'respetado', 'respetados')}` : ''
  }. Sello al día: ${sellados} ficheros.`)

  console.log('\n  Queda por hacer, y esto no lo puede hacer un guion:')

  // Un módulo nuevo trae una colección nueva. El despliegue no se cae por eso —Payload
  // arranca igual— y el panel revienta más tarde, que es la peor forma de enterarse.
  if (added.length && aCopiar.some(({ rel }) => rel.startsWith('src/modules/'))) {
    console.log(`
    npm run migrate:create -- ${added.join('-')}
      ${added.length === 1 ? 'El módulo nuevo trae colección nueva' : 'Los módulos nuevos traen colecciones nuevas'}, y sin migración el despliegue
      sale bien y el panel revienta más tarde. Luego: npm run migrate
      Y npm run seed si quieres ${added.length === 1 ? 'su' : 'sus'} contenido de ejemplo.`)
  }

  // Lo que se respetó puede ser justo lo que la sección nueva necesitaba para existir.
  const claves = respected.filter(({ rel }) => NEEDED_BY_A_SECTION.includes(rel))
  if (added.length && claves.length) {
    // Se señala el comando que **vuelve a producir** lo regenerado, no la copia temporal
    // que este proceso borra al salir: una ruta que ya no existe no es una instrucción.
    const copia = `/tmp/${name}-regenerado`
    console.log(`
    A mano: ${claves.map(({ rel }) => rel).join(', ')}
      ${claves.length === 1 ? 'Se respetó' : 'Se respetaron'} por llevar cambios de esta web, y ${
        added.length === 1 ? 'el módulo nuevo' : 'los módulos nuevos'
      } ${claves.length === 1 ? 'lo' : 'los'} ${added.length === 1 ? 'necesita' : 'necesitan'}
      para existir: hasta que no entre lo que falta, la sección no sale. Para verlo al lado:
        node generator/generate.js --blueprint '${join(site, 'sitewright.json')}' --out ${copia} --force
        diff -u '${join(site, claves[0].rel)}' '${join(copia, claves[0].rel)}'`)
  }

  console.log(`
    npm run typecheck        en el sitio, que es lo que caza un cambio incompatible
    git diff                 mirar lo que ha entrado, no fiarse
`)
}
