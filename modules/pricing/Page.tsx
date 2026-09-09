import type { ModulePageProps } from '@/lib/modules'
import type { Price } from '@/modules/pricing/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import PricingSection from '@/modules/pricing/Section'
import { pricingNodes } from '@/modules/pricing/jsonld'

export default function PricingPage({ items, settings, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Price[]

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      nodes={pricingNodes(list, route, title)}
      empty={list.length ? undefined : 'Todavía no hay tarifas publicadas.'}
    >
      <PricingSection items={list} title="" ctaHref="/#contacto" />
    </ModuleIndexPage>
  )
}
