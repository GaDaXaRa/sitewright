import React from 'react'
import type { SiteSetting } from '@/payload-types'
import { breadcrumbNode, buildHomeJsonLd } from '@/lib/jsonLd'

import InnerPage from './InnerPage'
import JsonLd from './JsonLd'

/**
 * El armazón de la página índice de un módulo.
 *
 * Los siete módulos con página propia escribían el mismo fichero: el mismo grafo, el mismo
 * marco y el mismo bloque de «todavía no hay nada». Siete copias es siete sitios donde
 * decidir lo mismo, y se notó: **tres no emitían ningún dato estructurado** y ninguna de las
 * siete emitía migas, aunque `InnerPage` lleva pintándoselas a una persona desde el primer
 * día y `breadcrumbNode` estaba escrito y sin usar.
 *
 * Lo que cambia de un módulo a otro —qué añade al grafo y qué pinta— entra por parámetro.
 * Lo que no cambia, se decide aquí una vez.
 */
export default function ModuleIndexPage({
  settings,
  title,
  route,
  nodes = [],
  empty,
  children,
}: {
  settings: SiteSetting
  title: string
  route: string
  /** Lo que este módulo añade al grafo. Las migas las pone la página, no el módulo. */
  nodes?: object[]
  /**
   * El texto de «todavía no hay nada», cuando no lo hay. Se pasa el texto y no un booleano
   * porque cada sección lo dice con sus palabras: no es lo mismo «nadie publicado» que
   * «ninguna pregunta publicada».
   */
  empty?: string
  children: React.ReactNode
}) {
  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, [breadcrumbNode(title, route), ...nodes])} />
      <InnerPage settings={settings} title={title}>
        {empty ? (
          <section className="section">
            <div className="container">
              <p className="empty">{empty}</p>
            </div>
          </section>
        ) : (
          children
        )}
      </InnerPage>
    </>
  )
}
