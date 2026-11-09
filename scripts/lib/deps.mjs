// Lo que doctor dice de las dependencias de una web, sin ejecutar nada: recibe lo que npm
// contestó y los dos package.json, y decide qué se enseña.
//
// Existe porque `package.json` queda fuera de la deriva a propósito —npm lo mueve en cada
// instalación— y el efecto secundario fue que dos webs siguieron con un Next y un Payload
// con avisos críticos publicados mientras la plantilla no sabía nada de ellos.
import { compareVersions } from './versions.mjs'

const ORDER = ['critical', 'high', 'moderate', 'low']

/**
 * Lo que importa de un `npm audit --json`: cuántos hay de cada gravedad y cuáles son
 * dependencias directas, que son las únicas que se arreglan tocando el package.json de la web.
 */
export function auditSummary(report) {
  const counts = Object.fromEntries(ORDER.map((level) => [level, 0]))
  const direct = []
  for (const [name, v] of Object.entries(report?.vulnerabilities ?? {})) {
    if (v.severity in counts) counts[v.severity] += 1
    if (!v.isDirect) continue
    const fix = v.fixAvailable && typeof v.fixAvailable === 'object' ? v.fixAvailable : null
    direct.push({
      name,
      severity: v.severity,
      fix: fix && fix.name === name && !fix.isSemVerMajor ? fix.version : null,
    })
  }
  direct.sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity) || a.name.localeCompare(b.name))
  return { counts, direct, serious: counts.critical + counts.high }
}

/**
 * Las dependencias que la web declara por debajo de la plantilla.
 *
 * Sólo las que la plantilla también declara: lo que una web añadió por su cuenta no tiene
 * con qué compararse. Y sólo hacia atrás: una web que va por delante lo decidió alguien.
 */
export function behindTemplate(sitePkg, templatePkg) {
  const pick = (pkg) => ({ ...pkg?.dependencies, ...pkg?.devDependencies })
  const site = pick(sitePkg)
  const template = pick(templatePkg)
  return Object.keys(template)
    .filter((name) => name in site && name !== 'sitewright-core')
    .filter((name) => compareVersions(site[name], template[name]) < 0)
    .map((name) => ({ name, site: site[name], template: template[name] }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
