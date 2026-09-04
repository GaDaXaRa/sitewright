import type { ModulePageProps } from '@/lib/modules'
import type { ScheduleItem } from '@/modules/schedule/Row'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import JsonLd from '@/app/(frontend)/components/JsonLd'
import ScheduleRow, { conCartel } from '@/modules/schedule/Row'
import { scheduleNodes } from '@/modules/schedule/jsonld'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { groupByYear, splitEvents } from 'sitewright-core'

export default function SchedulePage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as ScheduleItem[]
  const { upcoming, past } = splitEvents(list, now)
  const archive = groupByYear(past)

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, scheduleNodes(list, route))} />
      <InnerPage settings={settings} title={title}>
        <section className="section">
          <div className="container">
            <h2 className="sub">Próximas</h2>
            {upcoming.length ? (
              <div className={`events ${conCartel(upcoming) ? 'events-with-posters' : ''}`}>
                {upcoming.map((item) => (
                  <ScheduleRow key={item.id} event={item} />
                ))}
              </div>
            ) : (
              <p className="empty">No hay nada convocado ahora mismo.</p>
            )}
          </div>
        </section>

        {archive.length > 0 && (
          <section className="section tone-mid">
            <div className="container">
              <h2 className="sub">Archivo</h2>
              {archive.map(({ year, events }) => (
                <div key={year} className="archive-year">
                  <h3>{year}</h3>
                  <div className={`events ${conCartel(events) ? 'events-with-posters' : ''}`}>
                    {events.map((item) => (
                      <ScheduleRow key={item.id} event={item} past />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </InnerPage>
    </>
  )
}
