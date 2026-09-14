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
  items,
  title,
  tone,
  ctaHref,
  ctaLabel = 'Me interesa',
}: {
  items: Price[]
  title: string
  tone?: Tone
  /** Where the button goes — usually the contact form, carrying the choice along. */
  ctaHref?: string
  ctaLabel?: string
}) {
  if (!items.length) return null

  // Sin encabezado de sección, estas fichas cuelgan directamente del <h1> de la página, y
  // dejarlas en <h3> salta un nivel: es lo que axe llama `heading-order`, y lo encontró en
  // una web de cliente en cuanto la puerta existió.
  const Card = title ? 'h3' : 'h2'

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="tarifas">
      <div className="container">
        {/* En su propia página el título es el <h1>, y esto pintaba un <h2> vacío:
            un encabezado sin texto es peor que ninguno. */}
        {title ? (
          <div className="section-head">
            <h2>{title}</h2>
          </div>
        ) : null}

        <div className="prices">
          {items.map((price) => (
            <article
              key={price.id}
              className={`price ${price.highlighted ? 'price-highlighted' : ''}`}
            >
              <Card>{price.name}</Card>
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
