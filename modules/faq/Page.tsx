import type { ModulePageProps } from '@/lib/modules'
import type { Question } from '@/modules/faq/Section'
import React from 'react'

import ModuleIndexPage from '@/app/(frontend)/components/ModuleIndexPage'
import FaqSection from '@/modules/faq/Section'
import { faqNode } from '@/modules/faq/jsonld'

export default function FaqPage({ items, settings, title, route }: ModulePageProps) {
  // `items` llega sin tipo desde el registro; aquí recupera el suyo.
  const list = items as unknown as Question[]

  return (
    <ModuleIndexPage
      settings={settings}
      title={title}
      route={route}
      // Un `FAQPage` sin preguntas dentro es una promesa vacía para un buscador.
      nodes={list.length ? [faqNode(list, `${route}#faq`)] : []}
      empty={list.length ? undefined : 'Todavía no hay preguntas publicadas.'}
    >
      <FaqSection items={list} title="" context="page" />
    </ModuleIndexPage>
  )
}
