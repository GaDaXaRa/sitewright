import React from 'react'
import { Guide } from 'sitewright-core/ui'
import { site } from '@/site.config'
import { modules } from '@/site.modules'

/**
 * La guía de esta web, dentro de su panel.
 *
 * El texto y el diseño viven en el núcleo, así que mejoran para todas las webs a la vez;
 * lo que pone aquí este fichero es **de quién habla**: las secciones de esta web con los
 * nombres que les puso su dueña, que salen del manifiesto sin generar nada.
 */
export default function Guia() {
  return (
    <Guide
      siteName={site.name}
      sections={modules.map((m) => ({
        id: m.id,
        title: m.title,
        plural: m.plural,
        route: m.route,
      }))}
      support={site.support}
    />
  )
}
