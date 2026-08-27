import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { mediaAlt, mediaUrl, parseEmbed, type Tone } from '@sitewright/core'
import { Embed } from '@sitewright/core/ui'

export type MediaItem = {
  id: number | string
  title: string
  slug?: string | null
  author?: string | null
  description?: string | null
  url: string
  cover?: unknown
  featured?: boolean | null
}

/**
 * Audio and video hosted elsewhere.
 *
 * Only the featured piece carries a player; the rest of the grid links out. Loading five
 * third-party players on a home page costs more than it gives — and every one of them
 * would have to wait for consent anyway.
 */
export default function MediaSection({
  items,
  title,
  route,
  tone,
  limit = 6,
  moreLabel = 'Ver todo',
}: {
  items: MediaItem[]
  title: string
  route: string
  tone?: Tone
  limit?: number
  moreLabel?: string
}) {
  if (!items.length) return null

  const featured = items.find((item) => item.featured) ?? items[0]
  const rest = items.filter((item) => item.id !== featured.id).slice(0, limit)

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="medios">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
          <Link className="section-more" href={route}>
            {moreLabel}
          </Link>
        </div>

        <MediaCard item={featured} withPlayer />

        {rest.length > 0 && (
          <div className="session-grid">
            {rest.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function MediaCard({ item, withPlayer = false }: { item: MediaItem; withPlayer?: boolean }) {
  const cover = mediaUrl(item.cover)
  const embed = parseEmbed(item.url)

  return (
    <article className={`session ${withPlayer ? 'session-featured' : ''}`}>
      <div className="session-cover">
        {cover ? (
          <Image
            src={cover}
            alt={mediaAlt(item.cover) || ''}
            width={900}
            height={900}
            sizes="(max-width: 700px) 100vw, 380px"
          />
        ) : (
          <div className="session-cover-empty" aria-hidden="true" />
        )}
      </div>

      <div className="session-body">
        <h3>{item.title}</h3>
        {item.author ? <p className="session-artist">{item.author}</p> : null}
        {item.description ? <p className="session-text">{item.description}</p> : null}

        {withPlayer ? (
          <Embed embed={embed} title={item.title} />
        ) : embed ? (
          <a className="session-link" href={embed.canonicalUrl} target="_blank" rel="noreferrer">
            Escuchar
          </a>
        ) : null}
      </div>
    </article>
  )
}
