type Notice = { startsAt?: string | null; endsAt?: string | null }

/**
 * De todos los avisos activos, el que toca hoy.
 *
 * Es una decisión, no una consulta: la ventana de fechas se compara contra el reloj del
 * render, que viaja con los datos precisamente para que dos componentes de la misma
 * página no puedan discrepar sobre qué hora es.
 */
export function pickNotice(docs: Record<string, unknown>[], now: number): unknown {
  return (
    (docs as Notice[]).find((notice) => {
      const from = notice.startsAt ? new Date(notice.startsAt).getTime() : null
      const to = notice.endsAt ? new Date(notice.endsAt).getTime() : null
      return (from === null || from <= now) && (to === null || to >= now)
    }) ?? null
  )
}
