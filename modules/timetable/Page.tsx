import type { ModulePageProps } from '@/lib/modules'
import type { ClassItem } from '@/modules/timetable/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import JsonLd from '@/app/(frontend)/components/JsonLd'
import TimetableSection from '@/modules/timetable/Section'
import { timetableNodes } from '@/modules/timetable/jsonld'
import { buildHomeJsonLd } from '@/lib/jsonLd'

export default function TimetablePage({ items, settings, title, route, options }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as ClassItem[]
  const mode = options?.mode === 'online' ? 'online' : 'onsite'
  const ctaHref = typeof options?.ctaHref === 'string' ? options.ctaHref : undefined

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, timetableNodes(list, route, mode))} />
      <InnerPage settings={settings} title={title}>
        {list.length ? (
          <TimetableSection items={list} title="" route={route} ctaHref={ctaHref} context="page" />
        ) : (
          <section className="section">
            <div className="container">
              <p className="empty">Todavía no hay horario publicado.</p>
            </div>
          </section>
        )}
      </InnerPage>
    </>
  )
}
