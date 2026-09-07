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
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { MODULE_SKIP, TEMPLATE_SKIP, isShared } from '../../generator/generated.js'

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

/** Un resumen de una línea, que es lo que cabe en un diagnóstico. */
export function driftSummary({ checked, differ, missing }) {
  const behind = differ.length + missing.length
  return behind
    ? `${behind} de ${checked} ficheros compartidos no son los de la fábrica`
    : `${checked} ficheros compartidos, todos al día`
}

export { relative }
