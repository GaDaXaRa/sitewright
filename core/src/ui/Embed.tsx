'use client'

import React from 'react'
import { PROVIDER_NAMES, type Embed as EmbedData } from '../lib/embeds.js'
import { useConsent } from './Consent.js'

/**
 * A player, or an honest stand-in for it.
 *
 * Every one of these platforms sets cookies the moment its iframe loads, so before consent
 * the page shows what it would play and where to hear it instead. That placeholder is not
 * a punishment for saying no: the link goes to the platform, where the visitor decides for
 * themselves.
 */
export default function Embed({ embed, title }: { embed: EmbedData | null; title: string }) {
  const { status, accept } = useConsent()

  if (!embed) return null

  const provider = PROVIDER_NAMES[embed.provider]

  if (status !== 'accepted') {
    return (
      <div className="embed embed-blocked">
        <p>
          El reproductor de <strong>{provider}</strong> necesita cookies suyas para cargarse.
        </p>
        <div className="embed-actions">
          <button type="button" className="btn btn-primary" onClick={accept}>
            Aceptar y reproducir
          </button>
          <a className="btn btn-ghost" href={embed.canonicalUrl} target="_blank" rel="noreferrer">
            Escuchar en {provider}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="embed">
      <iframe
        src={embed.embedUrl}
        title={`${title} — ${provider}`}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        // Everything the players need and nothing else: no top-level navigation, no popups.
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  )
}
