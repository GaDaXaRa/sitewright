import type { Finding } from '../types.js'
import { fail, ok, skip, warn } from '../types.js'

/**
 * Lo que axe puede decir de una página sin abrir un navegador.
 *
 * Era la puerta que el plan de la v1 daba por hecha —«axe sin violaciones serias»— y que
 * no existía: lo único que se medía era el contraste de la paleta, leído de la hoja de
 * estilos. Una web podía salir con imágenes sin alternativo, botones sin nombre o un salto
 * de encabezado y pasar la auditoría entera.
 *
 * El HTML ya está descargado, así que esto no cuesta ni una petición más. Se monta un DOM
 * por página y se le **inyecta** axe dentro (`axe.source`) en vez de instalar globales en
 * este proceso: axe se queda con el `Node` del primer DOM que ve, y con globales compartidos
 * la segunda página falla con «arguments are invalid». Inyectándolo, cada página es suya.
 */

/** Lo que hace falta de una página para medirla: nada que no esté ya descargado. */
export type Measurable = { url: string; body: string }

const GATE = 'accesibilidad'
const TITLE = 'Accesibilidad (axe)'

/**
 * Lo que axe no puede juzgar aquí, y por qué.
 *
 * `color-contrast` necesita composición real —qué tapa a qué, qué opacidad tiene— y en un
 * DOM sin pintar da resultados inventados. No se pierde nada: el contraste de la paleta lo
 * mide la puerta `contraste` sobre los tokens, que es donde se decide de verdad.
 */
const WITHOUT_LAYOUT = ['color-contrast', 'color-contrast-enhanced']

/** Una violación que impide usar la página se trata distinta de una que la afea. */
const BLOCKING = ['critical', 'serious']

type AxeNode = { target: unknown[]; html: string }
type AxeViolation = { id: string; impact?: string | null; help: string; nodes: AxeNode[] }

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

/** Cómo se nombra una violación en el informe, sin vomitar el HTML entero. */
function describe(violation: AxeViolation, path: string): string {
  const where = violation.nodes[0]
  const target = Array.isArray(where?.target) ? where.target.join(' ') : ''
  const extra = violation.nodes.length > 1 ? ` y ${violation.nodes.length - 1} más` : ''
  return `${path}: ${violation.help} (${violation.id}${target ? `, en ${target}` : ''}${extra})`
}

export async function checkAccessibility(pages: Measurable[]): Promise<Finding[]> {
  if (!pages.length) return [skip(GATE, TITLE, 'No se descargó ninguna página que medir.')]

  let JSDOM: typeof import('jsdom').JSDOM
  let axeSource: string
  try {
    ;({ JSDOM } = await import('jsdom'))
    // `axe.source` es axe entero como texto, que es como se inyecta en un DOM ajeno. Viene
    // en la exportación por defecto porque axe-core es CommonJS.
    const axe = (await import('axe-core')) as unknown as { default?: { source: string }; source?: string }
    const resolved = axe.default?.source ?? axe.source
    if (!resolved) throw new Error('axe-core no expone `source`')
    axeSource = resolved
  } catch (err) {
    // Una puerta que no puede medir tiene que decirlo: en silencio se lee igual que pasar.
    return [skip(GATE, TITLE, `No se pudo cargar axe-core o jsdom: ${err}`)]
  }

  const blocking: string[] = []
  const cosmetic: string[] = []
  const unmeasured = new Set<string>()
  let measured = 0

  for (const page of pages) {
    const path = pathOf(page.url)
    let dom: InstanceType<typeof JSDOM> | null = null
    try {
      dom = new JSDOM(page.body, {
        url: page.url,
        // Sin ejecutar lo que traiga la página: se inyecta axe y nada más. Auditar no es
        // correr el JavaScript de un tercero en esta máquina.
        runScripts: 'outside-only',
        pretendToBeVisual: true,
      })
      const window = dom.window as unknown as {
        eval: (code: string) => void
        document: unknown
        axe: { run: (ctx: unknown, opts: unknown) => Promise<{ violations: AxeViolation[]; incomplete: AxeViolation[] }> }
      }
      window.eval(axeSource)

      const result = await window.axe.run(window.document, {
        resultTypes: ['violations', 'incomplete'],
        rules: Object.fromEntries(WITHOUT_LAYOUT.map((id) => [id, { enabled: false }])),
      })
      measured += 1

      for (const violation of result.violations) {
        const line = describe(violation, path)
        if (BLOCKING.includes(violation.impact ?? '')) blocking.push(line)
        else cosmetic.push(line)
      }
      // Lo que axe empieza y no termina: casi siempre porque hace falta ver la página
      // pintada. Se cuenta y se dice, en vez de dejarlo pasar por bueno.
      for (const doubt of result.incomplete) unmeasured.add(doubt.id)
    } catch (err) {
      cosmetic.push(`${path}: no se pudo analizar (${err})`)
    } finally {
      dom?.window.close()
    }
  }

  const findings: Finding[] = []
  const scope = `${measured} ${measured === 1 ? 'página' : 'páginas'}`

  findings.push(
    blocking.length
      ? fail(GATE, TITLE, `${blocking.length} en ${scope}. ${blocking.slice(0, 3).join(' · ')}`)
      : ok(GATE, TITLE, `Sin violaciones graves en ${scope}.`),
  )

  if (cosmetic.length) {
    findings.push(
      warn(
        GATE,
        'Detalles de accesibilidad',
        `${cosmetic.length} de impacto medio o bajo. ${cosmetic.slice(0, 3).join(' · ')}`,
      ),
    )
  }

  // Lo que esta puerta **no** ha mirado, dicho en voz alta. Sin esto, un informe en verde
  // parece cubrir más de lo que cubre, que es la forma más cara de tranquilidad.
  findings.push(
    skip(
      GATE,
      'Lo que axe no puede ver sin navegador',
      `${WITHOUT_LAYOUT.join(', ')} necesitan la página pintada —el contraste de la paleta lo mide la puerta «contraste»—` +
        (unmeasured.size ? `; y quedaron sin resolver: ${[...unmeasured].sort().join(', ')}.` : '.'),
    ),
  )

  return findings
}
