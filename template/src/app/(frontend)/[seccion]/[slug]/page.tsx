import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadSiteContent } from '@/lib/data'
import { modules } from '@/site.modules'
import type { SiteModule } from '@/lib/modules'

/**
 * La ficha de cualquier documento, servida por una sola ruta.
 *
 * La hermana de `[seccion]`, y por la misma razón: antes el generador escribía un fichero
 * por módulo con el cuerpo de la página dentro de una cadena de texto en el cableado, sin
 * resaltado y sin comprobar hasta que alguien generaba una web. Ahora cada módulo trae su
 * `Detail.tsx` y esto sólo decide cuál toca.
 *
 * El contrato de un documento con página propia es tener `slug`: es lo que lo nombra en la
 * dirección, y sin él no hay ficha que servir.
 */
export const revalidate = 300

type Doc = { slug?: string | null }

const segmentOf = (module: SiteModule) => module.route!.replace(/^\//, '')

/** Los módulos que tienen ficha: con componente, con ruta y con datos que buscar. */
function withDetail() {
  return modules.filter((m) => m.Detail && m.route && m.variable)
}

async function find(segmento: string, slug: string) {
  const module = withDetail().find((m) => segmentOf(m) === segmento)
  if (!module) return null

  const content = await loadSiteContent()
  const items = (content as unknown as Record<string, unknown>)[module.variable!]
  if (!Array.isArray(items)) return null

  const item = (items as Doc[]).find((doc) => doc.slug === slug)
  return item ? { module, item, content } : null
}

export async function generateStaticParams() {
  const content = await loadSiteContent()
  const params: { seccion: string; slug: string }[] = []

  for (const module of withDetail()) {
    const items = (content as unknown as Record<string, unknown>)[module.variable!]
    if (!Array.isArray(items)) continue
    for (const doc of items as Doc[]) {
      if (doc.slug) params.push({ seccion: segmentOf(module), slug: doc.slug })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seccion: string; slug: string }>
}): Promise<Metadata> {
  const { seccion, slug } = await params
  const found = await find(seccion, slug)
  if (!found) return {}

  const { documentMeta } = await found.module.Detail!()
  const meta = documentMeta?.(found.item as never, found.module.route!)
  if (!meta) return {}

  return {
    title: meta.title,
    ...(meta.description ? { description: meta.description } : {}),
    alternates: { canonical: `${found.module.route}/${slug}` },
  }
}

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ seccion: string; slug: string }>
}) {
  const { seccion, slug } = await params
  const found = await find(seccion, slug)
  if (!found) notFound()

  const { default: Detail } = await found.module.Detail!()
  return (
    <Detail
      item={found.item as never}
      settings={found.content.settings}
      now={found.content.now}
      route={found.module.route!}
      options={found.module.options}
    />
  )
}
