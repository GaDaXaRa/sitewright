import type { ModulePageProps } from '@/lib/modules'
import type { Item } from '@/modules/catalog/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import CatalogSection from '@/modules/catalog/Section'

export default function CatalogIndexPage({ items, settings, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Item[]

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      empty={list.length ? undefined : 'Todavía no hay nada publicado.'}
    >
      <CatalogSection items={list} title="" route={route} />
    </ModuleIndexPage>
  )
}
