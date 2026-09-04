import type { ModulePageProps } from '@/lib/modules'
import type { MediaItem } from '@/modules/media/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import { MediaCard } from '@/modules/media/Section'

export default function MediaPage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as MediaItem[]
  return (
    <InnerPage settings={settings} title={title}>
      <section className="section">
        <div className="container">
          {list.length ? (
            <div className="session-grid">
              {list.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="empty">Todavía no hay nada publicado.</p>
          )}
        </div>
      </section>
    </InnerPage>
  )
}
