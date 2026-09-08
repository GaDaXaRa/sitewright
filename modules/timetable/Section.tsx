import React from 'react'
import Link from 'next/link'
import type { Tone } from 'sitewright-core'
import { className, enrolLink, formatDays, formatTime, sortByWhen } from './classes'

/** Lo que la tarifa enlazada aporta: su nombre, que es el público, y su id. */
export type LinkedPrice = { id: number | string; name?: string | null }

export type ClassItem = {
  id: number | string
  title?: string | null
  /** La tarifa: un id con `depth: 0`, el documento entero con `depth: 1`. */
  belongsTo?: unknown
  description?: string | null
  level?: string | null
  days?: string[] | null
  startTime?: string | null
  endTime?: string | null
  teacher?: string | null
}

const LEVELS: Record<string, string> = {
  beginner: 'Iniciación',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all: 'Todos los niveles',
}

/**
 * El cuadrante semanal: lo que se da, qué días y a qué hora.
 *
 * No es la agenda (`schedule`), que son fechas concretas que pasan y se archivan. Esto se
 * repite cada semana hasta que alguien lo cambia, y por eso no caduca solo.
 */
export default function TimetableSection({
  items,
  title,
  route,
  tone,
  ctaHref,
  moreLabel = 'Ver el horario completo',
  context = 'home',
}: {
  items: ClassItem[]
  title: string
  route?: string
  tone?: Tone
  /** El ancla del formulario. Sin él, una clase con tarifa no lleva a ninguna parte. */
  ctaHref?: string
  moreLabel?: string
  /** En su página el <h1> es de la página, así que la sección se queda sin encabezado. */
  context?: 'home' | 'page'
}) {
  if (!items.length) return null
  const ordered = sortByWhen(items)

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="horario">
      <div className="container">
        {context === 'home' ? (
          <div className="section-head">
            <h2>{title}</h2>
          </div>
        ) : null}

        <ul className="classes">
          {ordered.map((item) => {
            const link = ctaHref ? enrolLink(item, ctaHref) : null
            const body = (
              <>
                <div className="class-when">
                  <strong>{formatDays(item)}</strong>
                  <span>{formatTime(item)}</span>
                </div>
                <div className="class-body">
                  <h3>{className(item)}</h3>
                  {item.description ? <p>{item.description}</p> : null}
                  <p className="class-meta">
                    {item.level ? <span className="class-level">{LEVELS[item.level] ?? item.level}</span> : null}
                    {item.teacher ? <span className="class-teacher">{item.teacher}</span> : null}
                  </p>
                </div>
              </>
            )

            return (
              <li key={item.id} className="class">
                {/* Con tarifa enlazada, la clase entera lleva al formulario con ella ya
                    elegida. Sin tarifa —una jornada abierta— no hay adónde llevar. */}
                {link ? (
                  <Link href={link} className="class-link">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ul>

        {context === 'home' && route ? (
          <p className="section-more">
            <Link href={route}>{moreLabel} →</Link>
          </p>
        ) : null}
      </div>
    </section>
  )
}
