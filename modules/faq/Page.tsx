import type { ModulePageProps } from '@/lib/modules'
import type { Question } from '@/modules/faq/Section'
import React from 'react'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import JsonLd from '@/app/(frontend)/components/JsonLd'
import FaqSection from '@/modules/faq/Section'
import { faqNode } from '@/modules/faq/jsonld'
import { buildHomeJsonLd } from '@/lib/jsonLd'

export default function FaqPage({ items, settings, now, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Question[]
  return (
    <>
      <JsonLd
        data={buildHomeJsonLd(settings, list.length ? [faqNode(list, `${route}#faq`)] : [])}
      />
      <InnerPage settings={settings} title={title}>
        {list.length ? (
          <FaqSection items={list} title="" context="page" />
        ) : (
          <section className="section">
            <div className="container">
              <p className="empty">Todavía no hay preguntas publicadas.</p>
            </div>
          </section>
        )}
      </InnerPage>
    </>
  )
}
