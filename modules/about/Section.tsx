import React from 'react'
import Image from 'next/image'
import { mediaAlt, mediaUrl, type Tone } from 'sitewright-core'

/**
 * The presentation: who this is and why anyone should care.
 *
 * It has no collection because it is one text its owner rewrites, not a list — and it
 * **disappears when empty**, so a site that has not written it yet does not show a heading
 * over nothing.
 */
export default function AboutSection({
  text,
  image,
  title,
  tone,
}: {
  text?: string | null
  image?: unknown
  title: string
  tone?: Tone
}) {
  if (!text?.trim()) return null

  const photo = mediaUrl(image)
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="sobre-mi">
      <div className={`container ${photo ? 'about' : 'container-narrow'}`}>
        {photo ? (
          <div className="about-photo">
            <Image
              src={photo}
              alt={mediaAlt(image) || ''}
              width={800}
              height={1000}
              sizes="(max-width: 800px) 100vw, 380px"
            />
          </div>
        ) : null}

        <div className="about-text">
          <div className="section-head">
            <h2>{title}</h2>
          </div>
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
