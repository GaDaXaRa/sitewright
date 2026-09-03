export const wiring = {
  id: 'schedule',
  collectionSlug: 'schedule',
  variable: 'schedule',
  collectionImport: "import { scheduleCollection } from './modules/schedule/collection'",
  collectionCall: (m) =>
    `scheduleCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${m.online ? ', place: false' : ''} })`,
  dataQuery: () => `payload.find({ collection: 'schedule', limit: 200, sort: '-startsAt' })`,
  sectionImport: "import ScheduleSection from '@/modules/schedule/Section'",
  sectionRender: (m) =>
    `<ScheduleSection\n        items={schedule}\n        now={now}\n        title="${m.title}"\n        route="${m.route}"\n        tone={scheduleTone ?? undefined}\n        emptyText="${m.emptyText ?? 'No hay nada anunciado ahora mismo. Escríbenos y te avisamos.'}"\n      />`,
  // Deliberately not `schedule.length`: what decides whether the section paints is whether
  // anything is still upcoming, and that is a decision of the core, not of a count.
  renders: 'splitEvents(schedule, now).upcoming.length > 0',
  jsonldImport: "import { scheduleNodes } from '@/modules/schedule/jsonld'",
  jsonldNodes: (m) => `...scheduleNodes(splitEvents(schedule, now).upcoming, '${m.route}')`,
  llmsImport: "import { scheduleSections } from '@/modules/schedule/llms'",
  llmsSpread: (m) =>
    `...scheduleSections(schedule, now, { upcoming: '${m.title}', past: 'Anteriores' })`,
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  indexPage: (m) => ({
    path: `src/app/(frontend)${m.route}/page.tsx`,
    source: `import React from 'react'
import type { Metadata } from 'next'

import InnerPage from '../components/InnerPage'
import JsonLd from '../components/JsonLd'
import ScheduleRow from '@/modules/schedule/Row'
import { scheduleNodes } from '@/modules/schedule/jsonld'
import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { groupByYear, splitEvents } from 'sitewright-core'

export const revalidate = 300

export const metadata: Metadata = {
  title: '${m.labels.plural}',
  alternates: { canonical: '${m.route}' },
}

export default async function SchedulePage() {
  const { settings, schedule, now } = await loadSiteContent()
  const { upcoming, past } = splitEvents(schedule, now)
  const archive = groupByYear(past)

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, scheduleNodes(schedule, '${m.route}'))} />
      <InnerPage settings={settings} title="${m.labels.plural}">
        <section className="section">
          <div className="container">
            <h2 className="sub">Próximas</h2>
            {upcoming.length ? (
              <div className="events">
                {upcoming.map((item) => (
                  <ScheduleRow key={item.id} event={item} />
                ))}
              </div>
            ) : (
              <p className="empty">${m.emptyText ?? 'No hay nada convocado ahora mismo.'}</p>
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
                  <div className="events">
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
`,
  }),

  seed: (m) => `  const scheduleCount = await payload.count({ collection: 'schedule' })
  if (scheduleCount.totalDocs === 0) {
    // Two ahead and one behind, so the archive and the "próximas" list both have something
    // to show and the difference between them is visible from the first minute.
    const day = (days: number, hour: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      date.setHours(hour, 0, 0, 0)
      return date.toISOString()
    }
    const examples = [
      { title: 'Próxima ${m.labels.singular.toLowerCase()}', startsAt: day(10, 19), endsAt: day(10, 21) },
      { title: 'La siguiente', startsAt: day(31, 19), endsAt: day(31, 21) },
      { title: 'Una que ya pasó', startsAt: day(-20, 19), endsAt: day(-20, 21) },
    ]
    for (const example of examples) {
      await payload.create({
        collection: 'schedule',
        data: { ...example, venue: 'Lugar por decidir', city: '${m.city ?? 'Ciudad'}', free: true },
      })
    }
    payload.logger.info('3 fechas de ejemplo')
  }`,
}
