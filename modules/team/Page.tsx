import type { ModulePageProps } from '@/lib/modules'
import type { Person } from '@/modules/team/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import TeamSection from '@/modules/team/Section'

export default function TeamIndexPage({ items, settings, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Person[]

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      empty={list.length ? undefined : 'Todavía no hay nadie publicado.'}
    >
      <TeamSection items={list} title="" route={route} />
    </ModuleIndexPage>
  )
}
