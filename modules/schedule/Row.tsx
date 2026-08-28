import React from 'react'
import { formatEventDate } from 'sitewright-core'

export type ScheduleItem = {
  id: number | string
  title: string
  slug?: string | null
  startsAt: string
  endsAt?: string | null
  venue?: string | null
  city?: string | null
  description?: string | null
  free?: boolean | null
  price?: number | null
  ticketsUrl?: string | null
}

/**
 * One dated item, as a row.
 *
 * Past dates keep the same shape as upcoming ones — only the action changes — because the
 * archive is what shows a collective has a history, and rewriting it as a lesser thing
 * would waste it.
 */
export default function ScheduleRow({ event, past = false }: { event: ScheduleItem; past?: boolean }) {
  const price = event.free ? 'Entrada libre' : event.price != null ? `${event.price} €` : ''

  return (
    <article className={`event ${past ? 'event-past' : ''}`} id={event.slug ?? undefined}>
      <div className="event-when">
        <time dateTime={event.startsAt}>
          {formatEventDate(event.startsAt, event.endsAt, { showYear: past })}
        </time>
      </div>
      <div className="event-what">
        <h3>{event.title}</h3>
        {event.venue || event.city ? (
          <p className="event-where">{[event.venue, event.city].filter(Boolean).join(', ')}</p>
        ) : null}
        {event.description ? <p className="event-text">{event.description}</p> : null}
      </div>
      <div className="event-action">
        {price ? <span className="event-price">{price}</span> : null}
        {!past && event.ticketsUrl ? (
          <a className="btn btn-primary" href={event.ticketsUrl} target="_blank" rel="noreferrer">
            Reservar
          </a>
        ) : null}
      </div>
    </article>
  )
}
