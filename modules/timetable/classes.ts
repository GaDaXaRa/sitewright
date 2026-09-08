import { relationId } from 'sitewright-core'
import type { ClassItem, LinkedPrice } from './Section'

/**
 * Un cuadrante semanal y su lista de precios son la misma actividad vista de dos maneras:
 * cuándo se da y cuánto cuesta. Todo lo que las relaciona pasa por aquí, para que el
 * horario, los datos estructurados y `/llms.txt` no puedan decir cosas distintas.
 */

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_NAMES: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

/** Lo que schema.org llama a cada día, para el `byDay` de un `Schedule`. */
export const DAY_URLS: Record<string, string> = Object.fromEntries(
  DAYS.map((day) => [day, `https://schema.org/${day[0]!.toUpperCase()}${day.slice(1)}`]),
)

/** La tarifa enlazada, si la consulta la trajo cargada. Con `depth: 0` sólo hay id. */
export function linkedPrice(item: ClassItem): LinkedPrice | null {
  const price = item.belongsTo
  return price && typeof price === 'object' ? (price as LinkedPrice) : null
}

/**
 * El nombre con el que se ve la clase. **Manda la tarifa**: es la que pone el nombre público
 * de la actividad, y así el cuadrante y la lista de precios no pueden discrepar aunque el
 * título diga otra cosa —fue lo que separó «Yoga Hatha-Vinyasa» de «Hatha - Vinyasa Yoga»
 * en la primera web que tuvo las dos listas—.
 *
 * El título propio se queda como etiqueta del panel, y es el nombre público de lo que no
 * tiene tarifa (una jornada abierta). Se resolvió así, y no vaciando los títulos, porque
 * Payload identifica cada ficha por el suyo: sin él, la lista del panel muestra el id.
 */
export function className(item: ClassItem): string {
  return linkedPrice(item)?.name?.trim() || item.title?.trim() || 'Clase'
}

/**
 * Enlace al formulario con esta clase ya elegida, o `null` si no tiene tarifa: sin tarifa
 * no hay nada que preseleccionar.
 */
export function enrolLink(item: ClassItem, anchor: string): string | null {
  const id = relationId(item.belongsTo)
  return id == null ? null : `${anchor}?tarifa=${id}`
}

/** Sus días, de lunes a domingo, venga como venga la multiselección del panel. */
export function sortedDays(item: ClassItem): string[] {
  return [...(item.days ?? [])].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
}

/** «Lunes», «Lunes y miércoles», «Lunes, miércoles y viernes». */
export function formatDays(item: ClassItem): string {
  const names = sortedDays(item).map((day, i) => {
    const name = DAY_NAMES[day] ?? day
    return i === 0 ? name : name.toLowerCase()
  })
  if (!names.length) return ''
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

/** El cuadrante como se lee: por el primer día de cada clase, y a igual día por la hora. */
export function sortByWhen(items: ClassItem[]): ClassItem[] {
  const first = (item: ClassItem) => {
    const days = sortedDays(item).map((day) => DAYS.indexOf(day))
    // Sin días no se puede colocar en la semana, así que va al final en vez de colarse el
    // lunes: un -1 lo pondría el primero, que es justo donde no está.
    return days.length ? days[0]! : DAYS.length
  }
  return [...items].sort(
    (a, b) => first(a) - first(b) || (a.startTime || '').localeCompare(b.startTime || ''),
  )
}

/** «18:00–19:30», o sólo la hora de inicio si no se dijo cuándo termina. */
export function formatTime(item: ClassItem): string {
  return item.endTime ? `${item.startTime}–${item.endTime}` : (item.startTime ?? '')
}
