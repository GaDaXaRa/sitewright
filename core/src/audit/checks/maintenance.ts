import { type Finding, fail, ok, skip, warn } from '../types.js'
import { diagnose } from '../../lib/versions.js'

/**
 * Lo que se estropea con el tiempo sin que nadie toque nada.
 *
 * Una web no se degrada sola, pero el mundo alrededor sí: salen versiones del núcleo con
 * arreglos que le harían falta y nadie lleva la cuenta. Aquí no se falla por estar
 * atrasado —una web atrasada sigue funcionando— pero sí se dice.
 */

const GATE_CORE = 'nucleo'

export function checkCoreVersion(core: {
  declared: string | null
  installed: string | null
  published: string[] | null
}): Finding[] {
  if (!core.declared && !core.installed) {
    return [skip(GATE_CORE, 'Al día con el núcleo', 'No se pudo leer el package.json de la web.')]
  }

  return diagnose(core).map((d) =>
    d.level === 'fail'
      ? fail(GATE_CORE, d.title, d.detail)
      : d.level === 'warn'
        ? warn(GATE_CORE, d.title, d.detail)
        : ok(GATE_CORE, d.title, d.detail),
  )
}
