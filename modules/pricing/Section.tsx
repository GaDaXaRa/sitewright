import React from 'react'
import type { Tone } from 'sitewright-core'

export type Price = {
  id: number | string
  name: string
  priceKind?: string | null
  price?: number | null
  period?: string | null
  description?: string | null
  includes?: { text: string }[] | null
  highlighted?: boolean | null
}

/** "45 € al mes", or "A convenir" when there is no closed price. Never an invented number. */
export function priceLabel(price: Price): string {
  if (price.priceKind === 'agreed' || price.price == null) return 'A convenir'
  return `${price.price} €${price.period ? ` ${price.period}` : ''}`
}

export default function PricingSection({
  prices,
  title,
  tone,
  ctaHref,
  ctaLabel = 'Me interesa',
}: {
  prices: Price[]
  title: string
  tone?: Tone
  /** Where the button goes — usually the contact form, carrying the choice along. */
  ctaHref?: string
  ctaLabel?: string
}) {
  if (!prices.length) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="tarifas">
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
        </div>

        <div className="prices">
          {prices.map((price) => (
            <article
              key={price.id}
              className={`price ${price.highlighted ? 'price-highlighted' : ''}`}
            >
              <h3>{price.name}</h3>
              <p className="price-amount">{priceLabel(price)}</p>
              {price.description ? <p className="price-text">{price.description}</p> : null}
              {price.includes?.length ? (
                <ul className="price-includes">
                  {price.includes.map((item, i) => (
                    <li key={i}>{item.text}</li>
                  ))}
                </ul>
              ) : null}
              {ctaHref ? (
                <a className="btn btn-ghost" href={`${ctaHref}?tarifa=${price.id}`}>
                  {ctaLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
