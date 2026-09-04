import { loadSiteContent } from '@/lib/data'
import { buildLlmsTxt, type LlmsSection } from '@/lib/llmsTxt'
import { modules } from '@/site.modules'

/**
 * /llms.txt — un resumen en texto plano para asistentes.
 *
 * Un modelo que contesta preguntas («¿quién pincha el sábado en Madrid?») cita mejor lo
 * que puede leer sin interpretar HTML. Sale del CMS, así que no puede quedarse viejo:
 * cambia una fecha en el panel y cambia aquí.
 *
 * Cada módulo aporta su sección desde el manifiesto; escribir el texto es cosa de
 * `lib/llmsTxt.ts`, que es puro y está probado.
 */
export const revalidate = 3600

export async function GET() {
  const content = await loadSiteContent()

  const sections: LlmsSection[] = []
  const todo = content as unknown as Record<string, unknown>

  for (const module of modules) {
    if (!module.llms) continue
    // Un módulo sin consulta —la presentación, por ejemplo— escribe desde los ajustes.
    const items = module.variable ? todo[module.variable] : []
    const aporta = module.llms(items as never[], {
      title: module.title,
      route: module.route,
      now: content.now,
      settings: content.settings,
      options: module.options,
    })
    sections.push(...(Array.isArray(aporta) ? aporta : [aporta]))
  }

  const text = buildLlmsTxt({ settings: content.settings, sections })

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
