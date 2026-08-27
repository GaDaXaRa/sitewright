import React from 'react'
import Link from 'next/link'
import { splitEvents, type Tone } from '@sitewright/core'
import ScheduleRow, { type ScheduleItem } from './Row'

/**
 * What is coming, on the home page.
 *
 * The split is the core's, and it is the rule that keeps a site from looking abandoned:
 * something stops being upcoming when it **ends**, not when it starts.
 */
export default function ScheduleSection({
  items,
  now,
  title,
  route,
  tone,
  limit = 4,
  emptyText,
}: {
  items: ScheduleItem[]
  now: number
  title: string
  route: string
  tone?: Tone
  limit?: number
  /** What to say when there is nothing announced. Silence reads as neglect. */
  emptyText?: string
}) {
  const { upcoming } = splitEvents(items, now)
  if (!upcoming.length && !emptyText) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="agenda">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          <Link className="section-more" href={route}>
            Todo y archivo
          </Link>
        </div>

        {upcoming.length ? (
          <div className="events">
            {upcoming.slice(0, limit).map((item) => (
              <ScheduleRow key={item.id} event={item} />
            ))}
          </div>
        ) : (
          <p className="empty">{emptyText}</p>
        )}
      </div>
    </section>
  )
}
