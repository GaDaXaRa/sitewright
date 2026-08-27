import React from 'react'
import type { Tone } from '@sitewright/core'

export type Review = {
  id: number | string
  text: string
  author: string
  source?: string | null
  sourceUrl?: string | null
}

export default function ReviewsSection({
  reviews,
  title,
  tone,
}: {
  reviews: Review[]
  title: string
  tone?: Tone
}) {
  if (!reviews.length) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="opiniones">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
        </div>

        <ul className="quotes">
          {reviews.map((quote) => (
            <li key={quote.id}>
              <figure>
                <blockquote>{quote.text}</blockquote>
                <figcaption>
                  {quote.sourceUrl ? (
                    <a href={quote.sourceUrl} target="_blank" rel="noreferrer">
                      {quote.author}
                    </a>
                  ) : (
                    quote.author
                  )}
                  {quote.source ? <span className="quote-source">{quote.source}</span> : null}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
