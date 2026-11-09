import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isHeroLayout } from '@/lib/estilos'

type Props = {
  eyebrow?: string | null
  title?: string | null
  text?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  /** Focal point of the image (0-100): the part that must survive cropping. */
  focalX?: number | null
  focalY?: number | null
  textPosition?: string | null
  textHeight?: string | null
  /** Cuánto se oscurece la foto para que el título se lea encima. */
  shade?: string | null
  /** Claro u oscuro: sobre una foto clara sin velo, el claro desaparece. */
  textColour?: string | null
  /** Buttons under the title. The first one is the loud one. */
  actions?: { href: string; label: string }[]
  /** Cómo se compone: foto de fondo, foto al lado, foto enmarcada o sólo letra. */
  layout?: string | null
}


/**
 * The cover: the one section every site has.
 *
 * It stays deliberately plain here. The hero is the half of the design the blueprint
 * leaves free, so the generator replaces this file whenever the business has something
 * better to lead with — the next date, a piece of work, a price.
 */
export default function Hero({
  eyebrow,
  title,
  text,
  imageUrl,
  imageAlt,
  focalX,
  focalY,
  textPosition,
  textHeight,
  shade,
  textColour,
  actions = [],
  layout,
}: Props) {
  // Un valor que esta versión no conoce —un ajuste guardado por otra más nueva— cae en la
  // de siempre en vez de dejar la portada sin estilo.
  const composition = isHeroLayout(layout) ? layout : 'foto'
  // La tipográfica es la única que prescinde de la foto aunque la haya: su gracia es la letra.
  const image = composition === 'tipografica' ? null : imageUrl
  // Sólo cuando la foto va **detrás** del texto hace falta tratarla y cambiar la tinta.
  // Partida, el texto va sobre el fondo de la web y se lee con sus colores de siempre.
  const behind = Boolean(image) && composition !== 'partida'
  // La palabra más larga del título, para que la hoja limite el tamaño a lo que cabe: a
  // tamaño de cartel, «Sandunguera» se salía por la derecha. Sin JavaScript, con el ancho
  // del contenedor (`cqi`) dividido entre las letras.
  const longest = Math.max(4, ...(title ?? '').split(/\s+/).map((word) => word.length))

  const position = textPosition || 'left'
  const height = textHeight || 'bottom'
  const objectPosition = `${focalX ?? 50}% ${focalY ?? 50}%`
  // Oscurecer toda la foto es lo seguro y por eso es lo de siempre; quien quiera respetar
  // la imagen lo dice en el panel y se hace cargo de mirarlo.
  const veil = shade || 'full'
  const ink = textColour === 'dark' ? 'ink-dark' : 'ink-light'

  return (
    <header
      className={`hero layout-${composition} text-${position} height-${height} shade-${veil} ${ink} ${behind ? 'hero-has-image' : ''} ${image ? 'hero-with-media' : ''}`}
      id="inicio"
      style={{ '--title-chars': longest } as React.CSSProperties}
    >
      {image ? (
        // The cover image is the largest element on the page (LCP): served through
        // next/image with `priority` so it starts loading immediately.
        <div className="hero-media">
          <Image
            src={image}
            alt={imageAlt || ''}
            fill
            priority
            sizes={composition === 'partida' ? '(max-width: 760px) 100vw, 50vw' : '100vw'}
            className="hero-img"
            style={{ objectPosition }}
          />
        </div>
      ) : (
        <div className="hero-bg" />
      )}
      <div className="hero-overlay" />

      <div className="container">
        <div className="hero-content">
          <span className="kicker">{eyebrow || title}</span>

          <h1>{title}</h1>
          {text ? <p className="hero-text">{text}</p> : null}
          {actions.length > 0 ? (
            <div className="hero-actions">
              {actions.map((action, i) => (
                <Link
                  key={action.href}
                  className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}`}
                  href={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
