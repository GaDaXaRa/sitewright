import React from 'react'
import Image from 'next/image'
import { mediaUrl, mediaAlt, type Tone } from 'sitewright-core'

export type Partner = {
  id: number | string
  name: string
  logo?: unknown
  url?: string | null
  treatment?: ('color' | 'boxed' | 'dark' | 'light') | null
}

/**
 * La tira de logos.
 *
 * Los logos llegan con proporciones que no se parecen en nada —uno cuadrado, otro cuatro
 * veces más ancho que alto— así que se sirven a altura fija y el ancho lo pone cada uno.
 * Igualarlos por ancho encoge los apaisados hasta lo ilegible.
 *
 * Y llegan mezclados: uno transparente, otro con recuadro blanco, otro a color. Lo que
 * dice el panel sobre cada uno se traduce aquí en una clase, y el arreglo es de CSS: el
 * fichero de otra empresa no se toca.
 */
export default function PartnersSection({
  items,
  title,
  tone,
}: {
  items: Partner[]
  title: string
  tone?: Tone
}) {
  if (!items.length) return null

  return (
    <section className={`section ${tone ? `tone-${tone}` : ''}`} id="colaboran">
      <div className="container">
        {title ? (
          <div className="section-head">
            <h2>{title}</h2>
          </div>
        ) : null}

        <ul className="partners">
          {items.map((partner) => {
            const logo = mediaUrl(partner.logo)
            // El nombre es el texto alternativo: describe el logo a quien no lo ve, y sin
            // él la imagen no aporta nada a quien navega con lector de pantalla.
            const image = logo ? (
              <Image
                src={logo}
                alt={mediaAlt(partner.logo) || partner.name}
                width={220}
                height={96}
                sizes="220px"
                className={`logo-${partner.treatment ?? 'color'}`}
              />
            ) : (
              <span className="partner-name">{partner.name}</span>
            )

            return (
              <li key={partner.id}>
                {partner.url ? (
                  <a href={partner.url} target="_blank" rel="noreferrer" title={partner.name}>
                    {image}
                  </a>
                ) : (
                  image
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
