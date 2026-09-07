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
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { MODULE_SKIP, TEMPLATE_SKIP, WRITTEN, isShared } from '../../generator/generated.js'

/** Los ficheros de un directorio, en rutas relativas y sin lo que no viaja. */
function filesIn(dir, skip, prefix = '') {
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
 * Devuelve las diferencias en un solo saco, cada una con de dónde sale y adónde va, para
 * que quien la aplique no tenga que volver a razonar la correspondencia.
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

  const differ = []
  const missing = []
  for (const pair of pairs) {
    if (!existsSync(pair.to)) missing.push(pair)
    else if (!same(pair.from, pair.to)) differ.push(pair)
  }

  return { checked: pairs.length, modules: installed, differ, missing }
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
 * No se aplica solo, y no debería: aquí un fichero distinto puede ser una corrección que
 * falta o una decisión que alguien tomó a mano, y eso lo dice una persona mirando el diff.
 */
export function writtenDrift(root, site) {
  const blueprint = join(site, 'sitewright.json')
  if (!existsSync(blueprint)) {
    return { available: false, why: 'esta web no lleva su blueprint (sitewright.json)', differ: [] }
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
    return { available: false, why: `no se pudo regenerar: ${err.stderr ?? err}`, differ: [] }
  }

  const differ = []
  for (const rel of WRITTEN) {
    if (SKIP_WRITTEN.includes(rel)) continue
    const fresh = join(out, rel)
    if (!existsSync(fresh) || !existsSync(join(site, rel))) continue
    if (!same(fresh, join(site, rel))) differ.push({ rel })
  }

  rmSync(out, { recursive: true, force: true })
  return { available: true, checked: WRITTEN.length - SKIP_WRITTEN.length, differ }
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

/** Un resumen de una línea, que es lo que cabe en un diagnóstico. */
export function driftSummary({ checked, differ, missing }) {
  const behind = differ.length + missing.length
  return behind
    ? `${behind} de ${checked} ficheros compartidos no son los de la fábrica`
    : `${checked} ficheros compartidos, todos al día`
}

export { relative }
