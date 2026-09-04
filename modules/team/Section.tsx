import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { mediaAlt, mediaUrl, type Tone } from 'sitewright-core'

export type Person = {
  id: number | string
  name: string
  slug?: string | null
  role?: string | null
  photo?: unknown
  bio?: { text: string }[] | null
  links?: { label: string; url: string }[] | null
}

export default function TeamSection({
  items,
  title,
  route,
  tone,
}: {
  items: Person[]
  title: string
  /** Where each person's page lives, e.g. `/equipo`. */
  route: string
  tone?: Tone
}) {
  if (!items.length) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="equipo">
      <div className="container">
        {/* En su propia página el <h1> es de la página: aquí no hace falta encabezado. */}
        {title ? (
          <div className="section-head">
            <h2>{title}</h2>
          </div>
        ) : null}

        <ul className="members">
          {items.map((member) => {
            const photo = mediaUrl(member.photo)
            const first = member.bio?.[0]?.text
            return (
              <li key={member.id}>
                <Link href={`${route}/${member.slug}`} className="member">
                  <div className="member-photo">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={mediaAlt(member.photo) || ''}
                        width={600}
                        height={800}
                        sizes="(max-width: 700px) 50vw, 260px"
                      />
                    ) : (
                      <div className="member-photo-empty" aria-hidden="true" />
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  {member.role ? <p className="member-role">{member.role}</p> : null}
                  {first ? <p className="member-bio">{first}</p> : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
