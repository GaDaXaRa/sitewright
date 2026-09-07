import type { ModuleDetailProps } from '@/lib/modules'
import type { Item } from '@/modules/catalog/Section'
import React from 'react'
import Image from 'next/image'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import { mediaAlt, mediaUrl } from 'sitewright-core'

/**
 * La ficha de un elemento del catálogo.
 *
 * Lo que el listado no enseña: el texto largo por bloques y la lista de lo que incluye.
 * Vive aquí y no dentro de una cadena de texto en el cableado porque así se comprueba
 * sola —el tipo de abajo la ata a lo que la colección declara— y se lee con resaltado.
 */
export type CatalogDoc = Item & {
  body?: { heading?: string | null; text: string }[] | null
  highlights?: { text: string }[] | null
}

/** El título y la descripción de la ficha, que es lo que lee un buscador. */
export function documentMeta(item: CatalogDoc) {
  return { title: item.title, ...(item.summary ? { description: item.summary } : {}) }
}

export default function CatalogDetailPage({ item, settings, options }: ModuleDetailProps) {
  // `item` llega sin tipo desde el registro; aquí recupera el suyo.
  const doc = item as unknown as CatalogDoc
  // Cómo llama el cliente a una de estas: «Servicio», «Proyecto», «Sesión».
  const singular = typeof options?.singular === 'string' ? options.singular : undefined
  const image = mediaUrl(doc.image)

  return (
    <InnerPage settings={settings} kicker={singular} title={doc.title} intro={doc.summary ?? undefined}>
      <section className="section">
        <div className="container container-narrow">
          {image ? (
            <Image
              src={image}
              alt={mediaAlt(doc.image) || ''}
              width={1200}
              height={800}
              sizes="(max-width: 900px) 100vw, 760px"
              priority
            />
          ) : null}

          {(doc.body ?? []).map((block, i) => (
            <div key={i}>
              {block.heading ? <h2>{block.heading}</h2> : null}
              <p>{block.text}</p>
            </div>
          ))}

          {doc.highlights?.length ? (
            <ul>
              {doc.highlights.map((point, i) => (
                <li key={i}>{point.text}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </InnerPage>
  )
}
