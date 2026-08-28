import React from 'react'
import type { Tone } from 'sitewright-core'

export type Question = { id: number | string; question: string; answer: string }

export default function FaqSection({
  faqs,
  title,
  tone,
  context = 'home',
}: {
  faqs: Question[]
  title: string
  tone?: Tone
  /** On its own page the <h1> belongs to the page, so the section drops its heading. */
  context?: 'home' | 'page'
}) {
  if (!faqs.length) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="faq">
      <div className="container container-narrow">
        {context === 'home' ? (
          <div className="section-head">
            <h2>{title}</h2>
          </div>
        ) : null}

        <div className="faqs">
          {faqs.map((faq) => (
            <details key={faq.id}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
