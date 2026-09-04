import type { ModulePageProps } from '@/lib/modules'
import type { Item } from '@/modules/catalog/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import CatalogSection from '@/modules/catalog/Section'

export default function CatalogIndexPage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Item[]
  return (
    <InnerPage settings={settings} title={title}>
      {list.length ? (
        <CatalogSection items={list} title="" route={route} />
      ) : (
        <section className="section">
          <div className="container">
            <p className="empty">Todavía no hay nada publicado.</p>
          </div>
        </section>
      )}
    </InnerPage>
  )
}
