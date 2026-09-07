import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { Guide } from 'sitewright-core/ui'
import { site } from '@/site.config'
import { modules } from '@/site.modules'

/**
 * La guía de esta web, dentro de su panel.
 *
 * El texto y el diseño viven en el núcleo, así que mejoran para todas las webs a la vez;
 * lo que pone aquí este fichero es **de quién habla**: las secciones de esta web con los
 * nombres que les puso su dueña, que salen del manifiesto sin generar nada.
 *
 * La sesión la comprueba esta componente porque **Payload no lo hace por una vista
 * propia**: `views/Root` pinta el componente y sólo redirige cuando la ruta no existe, así
 * que sin esto la guía se servía entera a quien pidiera la dirección sin haber entrado.
 */
export default function Guia({ initPageResult }: AdminViewServerProps) {
  const { config } = initPageResult.req.payload
  const guia = `${config.routes.admin}/guia`

  if (!initPageResult.req.user) {
    // Al entrar, Payload devuelve a donde se quería ir: el enlace guardado sigue valiendo.
    redirect(`${config.routes.admin}${config.admin.routes.login}?redirect=${guia}`)
  }

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
