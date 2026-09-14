/**
 * Qué se está perdiendo una web ya hecha.
 *
 * `sync-core` trae el núcleo, que va por npm y tiene número de versión. Lo demás —el
 * chasis y los módulos— se copió el día que se generó el sitio y ahí se quedó: la guía del
 * panel se arregló en el repositorio y hubo que llevarla a mano a las dos webs, y con dos
 * se puede. Esto lo mide, que es el paso que faltaba para poder aplicarlo.
 *
 * Sólo mira ficheros que viajan iguales a todas las webs. Lo que el generador escribe a
 * partir del blueprint es de cada cliente y no se compara: ver `generator/generated.js`.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { MODULE_SKIP, TEMPLATE_SKIP, WRITTEN, isShared } from '../../generator/generated.js'

/**
 * El sello: qué le entregó la fábrica a esta web la última vez, fichero por fichero.
 *
 * Sin él, «este fichero no es el de la fábrica» tiene dos causas que no se distinguen y
 * que piden lo contrario: o la fábrica avanzó —y hay que traerlo— o esta web lo
 * personalizó —y copiar encima destruye trabajo—. Guardando el hash de lo entregado, la
 * pregunta se responde sola: si el fichero sigue siendo el entregado, la web no lo ha
 * tocado.
 *
 * Guarda **lo entregado**, nunca lo que hay ahora: sellar una personalización la
 * convertiría en pisable en la siguiente vuelta.
 */
export const SEAL = '.sitewright-sync.json'

export const hashOf = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

export function readSeal(site) {
  try {
    return JSON.parse(readFileSync(join(site, SEAL), 'utf8')).files ?? {}
  } catch {
    return {}
  }
}

/**
 * Por qué difiere un fichero, que es lo único que hace falta saber para decidir.
 *
 * `unknown` es el caso de las webs anteriores al sello, y se trata como personalizado: no
 * saber si alguien lo tocó no es permiso para pisarlo.
 */
export function classify(current, sealed) {
  if (sealed === undefined) return 'unknown'
  return current === sealed ? 'behind' : 'customised'
}

/** Un filtro que no descarta nada: lo regenerado ya viene filtrado por el generador. */
const NADA = /(?!)/

/** Los ficheros de un directorio, en rutas relativas y sin lo que no viaja. */
function filesIn(dir, skip = NADA, prefix = '') {
  if (!existsSync(dir)) return []

  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (skip.test(path)) continue
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) out.push(...filesIn(path, skip, rel))
    else out.push(rel)
  }
  return out
}

const same = (a, b) => existsSync(b) && readFileSync(a).equals(readFileSync(b))

/**
 * Compara lo que la fábrica tiene ahora con lo que la web se llevó.
 *
 * Cada diferencia lleva de dónde sale y adónde va, para que quien la aplique no tenga que
 * volver a razonar la correspondencia, y **por qué difiere**, que es lo que decide si se
 * puede copiar encima: `behind` es la fábrica avanzando y `customised` es esta web
 * habiendo tocado el fichero.
 */
export function siteDrift(root, site) {
  const pairs = []

  // El chasis, menos lo que se escribe por web.
  for (const rel of filesIn(join(root, 'template'), TEMPLATE_SKIP)) {
    if (isShared(rel)) pairs.push({ rel, from: join(root, 'template', rel), to: join(site, rel) })
  }

  // Los módulos, pero sólo los que esta web tiene: darle uno que no usa no es ponerla al
  // día, es cambiarle la web.
  const modulesDir = join(site, 'src/modules')
  const installed = existsSync(modulesDir)
    ? readdirSync(modulesDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    : []

  for (const id of installed) {
    for (const rel of filesIn(join(root, 'modules', id), MODULE_SKIP)) {
      pairs.push({
        rel: `src/modules/${id}/${rel}`,
        from: join(root, 'modules', id, rel),
        to: join(site, 'src/modules', id, rel),
      })
    }
  }

  const seal = readSeal(site)
  const behind = []
  const customised = []
  const unknown = []
  const missing = []

  for (const pair of pairs) {
    if (!existsSync(pair.to)) {
      // Lo que no está no se puede pisar: traerlo nunca destruye nada.
      missing.push(pair)
      continue
    }
    if (same(pair.from, pair.to)) continue

    const why = classify(hashOf(pair.to), seal[pair.rel])
    if (why === 'behind') behind.push(pair)
    else if (why === 'customised') customised.push(pair)
    else unknown.push(pair)
  }

  // `differ` sigue siendo todo lo que difiere, para quien sólo quiera contarlo.
  const differ = [...behind, ...customised, ...unknown]
  return { checked: pairs.length, modules: installed, pairs, differ, behind, customised, unknown, missing }
}

/**
 * Qué se copia encima de una web viva, y qué no.
 *
 * Es **la línea que separa poner al día de borrar la tarde de alguien**, y vivía suelta
 * dentro del guion, sin nada que la probara: un `filter` en medio de doscientas líneas de
 * texto por pantalla. Aquí es una función con sus casos, incluido el que más duele si se
 * rompe —`--force` sin `--apply` no puede escribir nada—.
 *
 * `seals` va con ellos a propósito: el sello también es escribir, y sin `--apply` no se
 * escribe **nada**, ni siquiera eso. Un sello adelantado convertiría en «entregado» un
 * fichero que nadie copió, y la siguiente vuelta lo pisaría creyendo que se quedó atrás.
 */
export function whatToCopy(
  { behind = [], missing = [], customised = [], unknown = [] },
  { apply = false, force = false } = {},
) {
  // Traerlos no destruye nada: uno se quedó atrás y el otro no está.
  const atrasados = [...behind, ...missing]
  // De esta web: o alguien los tocó, o no se puede saber. No saberlo no es permiso.
  const suyos = [...customised, ...unknown]

  if (!apply) return { copy: [], respected: suyos, seals: false }

  return {
    copy: force ? [...atrasados, ...suyos] : atrasados,
    respected: force ? [] : suyos,
    seals: true,
  }
}

/**
 * Deja constancia de lo que la fábrica acaba de entregar.
 *
 * Sella un fichero **sólo cuando su contenido es el de la fábrica**: o porque se acaba de
 * copiar, o porque ya lo era. Un fichero personalizado conserva el sello de su última
 * entrega —que es lo que lo mantiene reconocible como personalizado— y uno que nunca se
 * entregó no se sella, porque no habría nada que afirmar.
 *
 * `scope` existe porque el sello lo escriben **dos entregas distintas**: el chasis y los
 * módulos (`sync-site`) por un lado, y lo que el generador redacta para esta web
 * (`sync-written`) por otro. Sin separarlas, cada una podaría los sellos de la otra al no
 * verlos entre sus pares, y un fichero sin sello pasa a «no se sabe» —que a efectos de
 * pisarlo es igual que no tenerlo—.
 */
export function writeSeal(site, pairs, { scope = 'shared' } = {}) {
  const previo = readSeal(site)

  // Sin pares no hay nada que sellar, y reescribir aquí vaciaría el sello entero por un
  // error de invocación —una raíz equivocada, un sitio a medio copiar—. El sello es lo que
  // protege el trabajo de alguien: se deja como está.
  if (!pairs.length) return Object.keys(previo).length

  // Lo que la fábrica ya no entrega deja de estar sellado: si un fichero desapareció de la
  // plantilla, su hash no afirma nada sobre nada, y guardarlo para siempre convierte el
  // sello en el mismo archivo de restos que este trabajo existe para evitar.
  const vigentes = new Set(pairs.map((pair) => pair.rel))
  const mio = (rel) => (scope === 'shared' ? isShared(rel) : !isShared(rel))
  const seal = {}
  for (const [rel, hash] of Object.entries(previo)) {
    if (vigentes.has(rel) || !mio(rel)) seal[rel] = hash
  }

  for (const pair of pairs) {
    if (existsSync(pair.to) && same(pair.from, pair.to)) seal[pair.rel] = hashOf(pair.to)
  }

  const ordered = Object.fromEntries(Object.entries(seal).sort(([a], [b]) => (a < b ? -1 : 1)))
  writeFileSync(
    join(site, SEAL),
    JSON.stringify(
      {
        _: 'Qué le entregó la fábrica a esta web, para distinguir lo que se ha quedado atrás de lo que alguien personalizó aquí. Lo escribe npm run sync-site; no se edita a mano.',
        files: ordered,
      },
      null,
      2,
    ) + '\n',
  )
  return Object.keys(ordered).length
}

/**
 * Lo que se regenera pero no se compara.
 *
 * `package.json` lo mueve npm en cada instalación y de la versión del núcleo ya lleva
 * cuenta `sync-core`. `public/icon.svg` es un marcador de posición con las iniciales: la
 * web de Sandunguera tiene uno dibujado a mano y saldría eternamente «distinto». Y el
 * blueprint es el propio origen de la comparación.
 */
const SKIP_WRITTEN = ['package.json', 'public/icon.svg', 'sitewright.json']

/**
 * Lo que el generador acaba de escribir, como entrega que sellar.
 *
 * `from` y `to` son el mismo fichero **a propósito**: lo que la fábrica entregó es,
 * literalmente, lo que hay ahí en este instante. Sellarlo al generar es lo único que
 * permite que la próxima vez se pueda decir si alguien lo ha tocado; sin esto, cada
 * fichero redactado para la web nace «sin sello», y sin sello no se pisa nada.
 */
export function writtenPairs(site) {
  return WRITTEN.filter((rel) => !SKIP_WRITTEN.includes(rel) && existsSync(join(site, rel))).map(
    (rel) => ({ rel, from: join(site, rel), to: join(site, rel) }),
  )
}

/** Los módulos que hay dentro de una web, por su directorio. */
function modulesIn(site) {
  const dir = join(site, 'src/modules')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

/**
 * Lo que el generador escribiría hoy para esta web, comparado con lo que tiene.
 *
 * Es la otra mitad de la deriva: `site.config.ts`, la portada, los ajustes del panel, la
 * hoja de estilos. No se copian de la plantilla —llevan el nombre, las rutas y los textos
 * de cada cliente—, así que la única forma de compararlos es regenerar la web desde su
 * propio blueprint y mirar en qué se diferencia. Por eso el blueprint vive dentro del
 * sitio: sin él esto no se puede ni preguntar.
 *
 * Y es lo que convierte **editar el blueprint** en añadir una sección a una web viva: los
 * módulos que el blueprint enciende y esta web todavía no tiene entran aquí como ficheros
 * que faltan, que es el caso que nunca destruye nada. Los que ya están son de `sync-site`,
 * que para eso los copia iguales a todas las webs.
 *
 * `keep` deja el sitio regenerado en el disco —y devuelve dónde— para quien vaya a copiar
 * de él. **Quien lo pida se encarga de borrarlo**: aquí no se puede saber cuándo terminó
 * de usarlo.
 */
export function writtenDrift(root, site, { keep = false } = {}) {
  const vacio = { pairs: [], differ: [], behind: [], customised: [], unknown: [], missing: [], added: [], removed: [] }

  const blueprint = join(site, 'sitewright.json')
  if (!existsSync(blueprint)) {
    return { available: false, why: 'esta web no lleva su blueprint (sitewright.json)', ...vacio }
  }

  const out = mkdtempSync(join(tmpdir(), 'sitewright-drift-'))
  try {
    execFileSync(
      'node',
      [join(root, 'generator/generate.js'), '--blueprint', blueprint, '--out', out, '--force'],
      { cwd: root, stdio: 'pipe' },
    )
  } catch (err) {
    rmSync(out, { recursive: true, force: true })
    return { available: false, why: `no se pudo regenerar: ${err.stderr ?? err}`, ...vacio }
  }

  const pairs = []
  for (const rel of WRITTEN) {
    if (SKIP_WRITTEN.includes(rel)) continue
    if (!existsSync(join(out, rel))) continue
    pairs.push({ rel, from: join(out, rel), to: join(site, rel) })
  }

  // Un módulo que el blueprint enciende y la web no tiene: todos sus ficheros son nuevos,
  // así que traerlos no pisa nada. Uno que la web tiene y el blueprint ya no enciende se
  // dice y no se toca — borrar un directorio del que alguien puede haber editado la mitad
  // no es una puesta al día.
  const tiene = modulesIn(site)
  const toca = modulesIn(out)
  const added = toca.filter((id) => !tiene.includes(id))
  const removed = tiene.filter((id) => !toca.includes(id))

  for (const id of added) {
    for (const rel of filesIn(join(out, 'src/modules', id))) {
      pairs.push({
        rel: `src/modules/${id}/${rel}`,
        from: join(out, 'src/modules', id, rel),
        to: join(site, 'src/modules', id, rel),
      })
    }
  }

  const seal = readSeal(site)
  const behind = []
  const customised = []
  const unknown = []
  const missing = []

  for (const pair of pairs) {
    if (!existsSync(pair.to)) {
      missing.push(pair)
      continue
    }
    if (same(pair.from, pair.to)) continue

    const why = classify(hashOf(pair.to), seal[pair.rel])
    if (why === 'behind') behind.push(pair)
    else if (why === 'customised') customised.push(pair)
    else unknown.push(pair)
  }

  if (!keep) rmSync(out, { recursive: true, force: true })

  return {
    available: true,
    out: keep ? out : null,
    checked: pairs.length,
    pairs,
    differ: [...behind, ...customised, ...unknown],
    behind,
    customised,
    unknown,
    missing,
    added,
    removed,
  }
}

/**
 * Un resumen de una línea, que es lo que cabe en un diagnóstico.
 *
 * Separa lo que se puede traer solo de lo que no, porque son dos noticias distintas: una
 * es trabajo pendiente y la otra es una decisión que alguien tomó en esta web.
 *
 * `noun` porque lo usan las dos derivas y no son lo mismo: unos ficheros viajan iguales a
 * todas las webs y otros los redacta el generador para ésta. Entró como parámetro después
 * de escribirse una vez como `.replace('compartidos', 'redactados')` sobre el resultado,
 * que es una costura que se descose sola en cuanto alguien reescriba la frase.
 */
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

export function driftSummary({ checked, behind, customised, unknown, missing }, noun = 'compartidos') {
  const atrasados = behind.length + missing.length
  const propios = customised.length + unknown.length

  if (!atrasados && !propios) return `${checked} ficheros ${noun}, todos al día`

  const partes = []
  if (atrasados) partes.push(`${atrasados} por traer`)
  if (propios) partes.push(plural(propios, 'personalizado aquí', 'personalizados aquí'))
  return `${partes.join(' · ')}, de ${checked} ficheros ${noun}`
}

export { relative }
