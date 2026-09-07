import type { ModuleDetailProps } from '@/lib/modules'
import type { Person } from '@/modules/team/Section'
import React from 'react'
import Image from 'next/image'

import InnerPage from '@/app/(frontend)/components/InnerPage'
import JsonLd from '@/app/(frontend)/components/JsonLd'
import { teamNodes } from '@/modules/team/jsonld'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { mediaAlt, mediaUrl } from 'sitewright-core'

/**
 * La ficha de una persona.
 *
 * Es la página que se enlaza y se comparte, así que lleva su propio grafo: la persona
 * como `Person`, con el mismo `@id` con el que la nombra la portada. Un `@id` que no
 * resuelve es peor que no marcar nada.
 */
export function documentMeta(item: Person) {
  return { title: item.name, ...(item.bio?.[0]?.text ? { description: item.bio[0].text } : {}) }
}

export default function TeamDetailPage({ item, settings, route }: ModuleDetailProps) {
  // `item` llega sin tipo desde el registro; aquí recupera el suyo.
  const person = item as unknown as Person
  const photo = mediaUrl(person.photo)

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, teamNodes([person], route))} />
      <InnerPage settings={settings} kicker={person.role ?? undefined} title={person.name}>
        <section className="section">
          <div className="container member-page">
            {photo ? (
              <div className="member-page-photo">
                <Image
                  src={photo}
                  alt={mediaAlt(person.photo) || ''}
                  width={800}
                  height={1000}
                  sizes="(max-width: 800px) 100vw, 380px"
                  priority
                />
              </div>
            ) : null}

            <div className="member-page-text">
              {(person.bio ?? []).map((paragraph, i) => (
                <p key={i}>{paragraph.text}</p>
              ))}

              {person.links?.length ? (
                <ul className="member-links">
                  {person.links.map((link, i) => (
                    <li key={i}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      </InnerPage>
    </>
  )
}
