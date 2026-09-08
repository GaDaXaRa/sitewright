import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
import type { ClassItem } from './Section'
import { className, formatDays, formatTime, sortByWhen } from './classes'

/**
 * El cuadrante en texto. Es de lo que más se pregunta —«¿a qué hora hay clase el martes?»—
 * y lo que peor se lee de una tabla, así que aquí va cada línea entera.
 */
export function timetableSection(items: ClassItem[], ctx: LlmsContext): LlmsSection {
  return {
    title: ctx.title,
    lines: sortByWhen(items).map((item) => {
      const who = item.teacher ? ` · ${item.teacher}` : ''
      return `- ${className(item)} — ${formatDays(item)}, ${formatTime(item)}${who}`
    }),
  }
}
