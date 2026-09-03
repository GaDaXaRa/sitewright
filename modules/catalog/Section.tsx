import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { mediaAlt, mediaUrl, type Tone } from 'sitewright-core'

type Item = {
  id: number | string
  title: string
  slug?: string | null
  summary?: string | null
  image?: unknown
  tags?: { name: string }[] | null
  externalUrl?: string | null
}

/**
 * What the business offers or has done, as a grid.
 *
 * The heading comes from the settings, not from here: the same section is "Servicios",
 * "Proyectos" or "Sesiones" depending on the business, and that word is the client's.
 */
export default function CatalogSection({
  items,
  title,
  route,
  tone,
  limit,
  moreLabel = 'Ver todo',
}: {
  items: Item[]
  title: string
  route: string
  tone?: Tone
  limit?: number
  moreLabel?: string
}) {
  if (!items.length) return null
  const shown = limit ? items.slice(0, limit) : items

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="catalogo">
      <div className="container">
        {/* En su propia página el <h1> es de la página, así que la sección no pone
            encabezado: un <h2> vacío es peor que ninguno. */}
        {title || (limit && items.length > limit) ? (
          <div className="section-head">
            {title ? <h2>{title}</h2> : null}
            {limit && items.length > limit ? (
              <Link className="section-more" href={route}>
                {moreLabel}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="cards">
          {shown.map((item) => {
            const image = mediaUrl(item.image)
            const href = item.slug ? `${route}/${item.slug}` : item.externalUrl
            const card = (
              <>
                <div className="card-image">
                  {image ? (
                    <Image
                      src={image}
                      alt={mediaAlt(item.image) || ''}
                      width={900}
                      height={600}
                      sizes="(max-width: 700px) 100vw, 380px"
                    />
                  ) : (
                    <div className="card-image-empty" aria-hidden="true" />
                  )}
                </div>
                <h3>{item.title}</h3>
                {item.summary ? <p>{item.summary}</p> : null}
                {item.tags?.length ? (
                  <ul className="tags">
                    {item.tags.map((tag, i) => (
                      <li key={i}>{tag.name}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            )

            return (
              <article className="card" key={item.id}>
                {href ? (
                  <Link href={href} className="card-link">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
