import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadSettings, loadSiteContent } from '@/lib/data'
import { modules } from '@/site.modules'
import { pageMetadata } from '@/lib/metadata'

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
  const section = seccion(segmento)
  if (!section) return {}

  // Emitía sólo el título: compartir una sección daba un enlace pelado, y es por donde más
  // llega la gente a una web pequeña. La sección no tiene texto propio —no hay campo para
  // ello— así que hereda el del sitio, que al menos es algo que escribió el cliente.
  return pageMetadata({
    title: section.plural ?? section.title,
    canonical: section.route!,
    settings: await loadSettings(),
  })
}

export default async function SeccionPage({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion: segmento } = await params
  const section = seccion(segmento)
  if (!section?.Page) notFound()

  const content = await loadSiteContent()
  const items = section.variable
    ? ((content as unknown as Record<string, unknown>)[section.variable] as never[])
    : ([] as never[])

  const { default: Page } = await section.Page()
  return (
    <Page
      items={items}
      settings={content.settings}
      now={content.now}
      title={section.plural ?? section.title}
      route={section.route!}
      options={section.options}
    />
  )
}
