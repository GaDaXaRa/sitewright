import type { ModulePageProps } from '@/lib/modules'
import type { ClassItem } from '@/modules/timetable/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import TimetableSection from '@/modules/timetable/Section'
import { timetableNodes } from '@/modules/timetable/jsonld'

export default function TimetablePage({ items, settings, title, route, options }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as ClassItem[]
  const mode = options?.mode === 'online' ? 'online' : 'onsite'
  const ctaHref = typeof options?.ctaHref === 'string' ? options.ctaHref : undefined

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      nodes={timetableNodes(list, route, mode)}
      empty={list.length ? undefined : 'Todavía no hay horario publicado.'}
    >
      <TimetableSection items={list} title="" route={route} ctaHref={ctaHref} context="page" />
    </ModuleIndexPage>
  )
}
