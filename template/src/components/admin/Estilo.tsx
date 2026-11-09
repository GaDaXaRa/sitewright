import React from 'react'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { isHeroLayout, isStyle } from '@/lib/estilos'
import EstiloProbador from './EstiloProbador'

/**
 * «Estilo de la web»: la web de verdad, con sus textos y sus fotos, en cada estilo y cada
 * portada, y un botón para quedarse con uno.
 *
 * Un desplegable en los ajustes basta para guardar la elección, pero no para hacerla: nadie
 * elige «sereno» o «cartel» por el nombre. Por eso el probador vive aquí y no en una página
 * aparte con contenido de ejemplo: lo que se ve es lo que va a quedar.
 *
 * La sesión la comprueba esta componente, igual que la guía, porque Payload no lo hace por
 * una vista propia.
 */
export default async function Estilo({ initPageResult }: AdminViewServerProps) {
  const { req } = initPageResult
  const { config } = req.payload
  const here = `${config.routes.admin}/estilo`

  if (!req.user) {
    redirect(`${config.routes.admin}${config.admin.routes.login}?redirect=${here}`)
  }

  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })

  return (
    <EstiloProbador
      initialStyle={isStyle(settings.stylePreset) ? settings.stylePreset : 'nocturno'}
      initialHero={isHeroLayout(settings.heroLayout) ? settings.heroLayout : 'foto'}
      hasHeroImage={Boolean(settings.heroImage)}
      apiRoute={config.routes.api}
    />
  )
}
