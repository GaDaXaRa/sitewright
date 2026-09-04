import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadSiteContent } from '@/lib/data'
import { modules } from '@/site.modules'

/**
 * La página propia de cada sección, servida por una sola ruta.
 *
 * Antes el generador escribía un fichero por módulo, con el cuerpo de la página metido
 * dentro de una cadena de texto en el cableado: sin resaltado, sin autocompletado y sin
 * comprobar hasta que alguien generaba una web. Ahora cada módulo trae su `Page.tsx` y
 * esto sólo decide cuál toca.
 *
 * Las rutas fijas —las legales— ganan a esta, que es cómo Next resuelve los conflictos.
 */
export const revalidate = 300

function seccion(segmento: string) {
  return modules.find((m) => m.Page && m.route === `/${segmento}`)
}

export function generateStaticParams() {
  return modules
    .filter((m) => m.Page && m.route)
    .map((m) => ({ seccion: m.route!.replace(/^\//, '') }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seccion: string }>
}): Promise<Metadata> {
  const { seccion: segmento } = await params
  const module = seccion(segmento)
  if (!module) return {}

  return { title: module.plural ?? module.title, alternates: { canonical: module.route } }
}

export default async function SeccionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion: segmento } = await params
  const module = seccion(segmento)
  if (!module?.Page) notFound()

  const content = await loadSiteContent()
  const items = module.variable
    ? ((content as unknown as Record<string, unknown>)[module.variable] as never[])
    : ([] as never[])

  const { default: Page } = await module.Page()
  return (
    <Page
      items={items}
      settings={content.settings}
      now={content.now}
      title={module.plural ?? module.title}
      route={module.route!}
      options={module.options}
    />
  )
}
