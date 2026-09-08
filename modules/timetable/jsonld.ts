import { ORG_ID } from '@/lib/jsonLd'
import { SITE_URL } from '@/lib/site'
import type { ClassItem } from './Section'
import { DAY_URLS, className, linkedPrice, sortedDays } from './classes'

/**
 * Cada clase como un `Course` con su `CourseInstance`.
 *
 * Es el vocabulario que schema.org tiene para algo que se imparte y se repite, y es lo que
 * separa un cuadrante de una lista de párrafos: `Schedule` con `byDay` dice qué días, y el
 * buscador puede contestar «los martes a las 20:00» sin que nadie escriba esa frase.
 *
 * `Event` no vale aquí, y es la confusión fácil: un evento ocurre una vez y tiene fecha.
 * Esto se repite hasta que alguien lo cambia — de eso se ocupa el módulo `schedule`.
 */
export function timetableNodes(items: ClassItem[], route: string, mode: 'online' | 'onsite' = 'onsite') {
  return items.map((item) => {
    const url = `${SITE_URL}${route}#${item.id}`
    const price = linkedPrice(item)
    const days = sortedDays(item)

    return {
      '@type': 'Course',
      '@id': url,
      name: className(item),
      url,
      inLanguage: 'es-ES',
      provider: { '@id': ORG_ID },
      ...(item.description ? { description: item.description } : {}),
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: mode === 'online' ? 'online' : 'onsite',
        location:
          mode === 'online'
            ? { '@type': 'VirtualLocation', url: `${SITE_URL}${route}` }
            : { '@id': ORG_ID },
        ...(item.teacher ? { instructor: { '@type': 'Person', name: item.teacher } } : {}),
        courseSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'P1W',
          ...(days.length ? { byDay: days.map((day) => DAY_URLS[day]).filter(Boolean) } : {}),
          ...(item.startTime ? { startTime: item.startTime } : {}),
          ...(item.endTime ? { endTime: item.endTime } : {}),
        },
      },
      // El precio sale de la tarifa enlazada, no de un número escrito aquí: emparejar por
      // nombre es lo que hace divergir las dos listas.
      ...(price ? { offers: { '@type': 'Offer', name: price.name ?? undefined, priceCurrency: 'EUR' } } : {}),
    }
  })
}
