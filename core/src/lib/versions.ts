/**
 * La deriva entre lo que una web tiene instalado y lo que hay publicado.
 *
 * Hace falta porque las webs no se actualizan solas y nadie lleva la cuenta: una lleva
 * meses cinco versiones por detrás, con arreglos que le harían falta, y no hay nada que
 * lo diga. Todo esto son funciones puras; quién pregunta al registro es otro asunto.
 */

export type Diagnosis = {
  level: 'ok' | 'warn' | 'fail'
  title: string
  detail: string
}

/**
 * Los números de una versión, en orden, ignorando lo que la acompañe.
 *
 * Una dependencia se declara `^0.7.0` y una publicada se llama `0.7.0`: si cada sitio se
 * inventa cómo quitarle el acento circunflejo, dos partes del programa acaban comparando
 * cosas distintas. Se lee en un único lugar.
 */
function numbers(version: string): number[] {
  return (version.match(/\d+/g) ?? []).map(Number)
}

/** `^0.7.0` y `0.7.0` son la misma versión escrita de dos maneras. */
export function normaliseVersion(version: string): string {
  const [major = 0, minor = 0, patch = 0] = numbers(version)
  return `${major}.${minor}.${patch}`
}

/** Compara dos versiones. Sólo cuentan los tres primeros números. */
export function compareVersions(a: string, b: string): number {
  const [x, y] = [numbers(a), numbers(b)]
  for (let i = 0; i < 3; i += 1) {
    const left = x[i] ?? 0
    const right = y[i] ?? 0
    if (left < right) return -1
    if (left > right) return 1
  }
  return 0
}

/** Las versiones publicadas después de la que se tiene, de la más antigua a la más nueva. */
export function versionsAfter(current: string, all: string[]): string[] {
  return all.filter((v) => compareVersions(v, current) > 0).sort(compareVersions)
}

/**
 * El registro de cambios partido por versión.
 *
 * Se lee el markdown tal cual: cada `## <versión>` abre una sección y lo que va debajo es
 * lo que esa versión trajo. Una cabecera sin número —«Sin publicar»— no es una versión.
 */
export function changelogSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>()
  const parts = markdown.split(/^## +/m)

  for (const part of parts) {
    const [heading, ...rest] = part.split('\n')
    const version = heading!.match(/^\d+\.\d+\.\d+/)?.[0]
    if (version) sections.set(version, rest.join('\n').trim())
  }

  return sections
}

/**
 * El estado de una web frente al núcleo.
 *
 * Son tres preguntas distintas y sólo la última es de mantenimiento: lo instalado ¿es lo
 * que dice el `package.json`?, ¿es lo último?, y si no, ¿cuánto falta? La primera es la
 * que más ha dolido: npm no refresca una dependencia local que conserva su versión, y una
 * web puede estar ejecutando un núcleo distinto del que declara sin que nada proteste.
 */
export function diagnose({
  declared,
  installed,
  published,
}: {
  /** Lo que pide el `package.json` de la web, con su `^` si lo lleva. */
  declared: string | null
  /** Lo que hay de verdad en `node_modules`, si está instalado. */
  installed: string | null
  /** Todas las versiones que existen en el registro, si se pudo preguntar. */
  published: string[] | null
}): Diagnosis[] {
  const out: Diagnosis[] = []

  if (!declared) {
    return [{ level: 'fail', title: 'La web usa el núcleo', detail: 'No depende de sitewright-core.' }]
  }

  const wanted = normaliseVersion(declared)

  if (installed && compareVersions(installed, wanted) !== 0) {
    out.push({
      level: 'fail',
      title: 'Lo instalado es lo declarado',
      detail: `El package.json pide ${declared} y en node_modules hay ${installed}.`,
    })
  } else if (installed) {
    out.push({ level: 'ok', title: 'Lo instalado es lo declarado', detail: `sitewright-core ${installed}.` })
  }

  if (!published) {
    out.push({ level: 'warn', title: 'Al día con el núcleo', detail: 'No se pudo preguntar al registro.' })
    return out
  }

  const current = installed ?? wanted
  const behind = versionsAfter(current, published)

  out.push(
    behind.length
      ? {
          level: 'warn',
          title: 'Al día con el núcleo',
          detail: `${behind.length} ${behind.length === 1 ? 'versión' : 'versiones'} por detrás: ${current} → ${behind[behind.length - 1]}.`,
        }
      : { level: 'ok', title: 'Al día con el núcleo', detail: `${current} es la última.` },
  )

  return out
}
