import type { ModulePageProps } from '@/lib/modules'
import type { Person } from '@/modules/team/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import TeamSection from '@/modules/team/Section'

export default function TeamIndexPage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Person[]
  return (
    <InnerPage settings={settings} title={title}>
      {list.length ? (
        <TeamSection items={list} title="" route={route} />
      ) : (
        <section className="section">
          <div className="container">
            <p className="empty">Todavía no hay nadie publicado.</p>
          </div>
        </section>
      )}
    </InnerPage>
  )
}
