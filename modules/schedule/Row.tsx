import React from 'react'
import Image from 'next/image'
import { formatEventDate, mediaAlt, mediaUrl } from 'sitewright-core'

export type ScheduleItem = {
  id: number | string
  title: string
  slug?: string | null
  startsAt: string
  endsAt?: string | null
  venue?: string | null
  city?: string | null
  address?: string | null
  description?: string | null
  /** El cartel. La colección lo pedía desde el principio y nadie lo pintaba: llegaba al
      JSON-LD, así que Google lo veía y una persona no. */
  image?: unknown
  free?: boolean | null
  price?: number | null
  ticketsUrl?: string | null
}

/**
 * Si en esta lista hay algún cartel.
 *
 * La columna del cartel se reserva para toda la lista o para ninguna: si sólo la tuvieran
 * las filas que traen imagen, las fechas de unas y otras no quedarían alineadas.
 */
export function conCartel(items: ScheduleItem[]): boolean {
  return items.some((item) => Boolean(item.image))
}

/**
 * Los párrafos de una descripción escrita en el panel.
 *
 * En un campo de texto plano, un párrafo es una línea en blanco: es lo que teclea quien
 * escribe. Sin esto llegaba todo pegado en un solo bloque, y una descripción larga se
 * volvía ilegible.
 */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}

/**
 * Una fecha, como fila.
 *
 * Dos columnas: el cartel a la izquierda y todo lo demás a la derecha, con el botón
 * debajo. Las fechas pasadas conservan la misma forma que las próximas —sólo cambia la
 * acción— porque el archivo es lo que demuestra que un colectivo tiene historia.
 */
export default function ScheduleRow({ event, past = false }: { event: ScheduleItem; past?: boolean }) {
  const price = event.free ? 'Entrada libre' : event.price != null ? `${event.price} €` : ''
  const poster = mediaUrl(event.image)
  const where = [event.venue, event.city].filter(Boolean).join(', ')

  return (
    <article
      className={`event ${poster ? 'event-with-poster' : ''} ${past ? 'event-past' : ''}`}
      id={event.slug ?? undefined}
    >
      {poster ? (
        <div className="event-poster">
          <Image
            src={poster}
            alt={mediaAlt(event.image) || event.title}
            width={480}
            height={480}
            sizes="(max-width: 760px) 60vw, 200px"
          />
        </div>
      ) : null}

      <div className="event-body">
        <div className="event-when">
          <time dateTime={event.startsAt}>
            {formatEventDate(event.startsAt, event.endsAt, { showYear: past })}
          </time>
        </div>

        <h3>{event.title}</h3>

        {where ? <p className="event-where">{where}</p> : null}
        {event.address ? <p className="event-address">{event.address}</p> : null}

        {event.description
          ? paragraphs(event.description).map((p, i) => (
              <p key={i} className="event-text">
                {p}
              </p>
            ))
          : null}

        <div className="event-action">
          {price ? <span className="event-price">{price}</span> : null}
          {!past && event.ticketsUrl ? (
            <a className="btn btn-primary" href={event.ticketsUrl} target="_blank" rel="noreferrer">
              Reservar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
