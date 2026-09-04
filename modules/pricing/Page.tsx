import type { ModulePageProps } from '@/lib/modules'
import type { Price } from '@/modules/pricing/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import JsonLd from '@/app/(frontend)/components/JsonLd'
import PricingSection from '@/modules/pricing/Section'
import { pricingNodes } from '@/modules/pricing/jsonld'
import { buildHomeJsonLd } from '@/lib/jsonLd'

export default function PricingPage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Price[]
  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, pricingNodes(list, route, title))} />
      <InnerPage settings={settings} title={title}>
        <PricingSection items={list} title="" ctaHref="/#contacto" />
      </InnerPage>
    </>
  )
}
