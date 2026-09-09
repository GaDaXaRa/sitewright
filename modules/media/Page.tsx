import type { ModulePageProps } from '@/lib/modules'
import type { MediaItem } from '@/modules/media/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import { MediaCard } from '@/modules/media/Section'

export default function MediaPage({ items, settings, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as MediaItem[]

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      empty={list.length ? undefined : 'Todavía no hay nada publicado.'}
    >
      <section className="section">
        <div className="container">
          <div className="session-grid">
            {list.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </ModuleIndexPage>
  )
}
