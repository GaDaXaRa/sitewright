import { ImageResponse } from 'next/og'
import { bestTextOn } from 'sitewright-core'
import { loadSettings } from '@/lib/data'
import { site } from '@/site.config'

/**
 * La tarjeta que se ve al compartir, dibujada, para la web que todavía no tiene una foto.
 *
 * Sirve de último recurso: cuando hay portada o logotipo se anuncian ésos, que dicen mucho
 * más. Existe porque sin ella la puerta de la auditoría pediría una imagen que una web
 * recién nacida no puede dar, y una puerta que no se puede satisfacer es una puerta que
 * alguien acaba apagando.
 *
 * Va en una ruta propia y no en el fichero `opengraph-image` que Next reconoce: así se sabe
 * exactamente cuándo se usa —lo decide `pageMetadata`, en código que se lee— en vez de
 * depender de qué gana entre la convención de ficheros y los metadatos explícitos. Es el
 * mismo camino que ya seguía el icono en `icono.png`.
 */
export const revalidate = 3600

export const size = { width: 1200, height: 630 }

export async function GET() {
  const settings = await loadSettings()
  const name = settings?.siteName?.trim() || site.name
  const tagline = settings?.tagline?.trim() || ''

  const { ground, accent } = site.palette
  // La tinta se mide, no se elige: es lo mismo que hace el icono generado, y lo que evita
  // un título que no se lee sobre el fondo de la casa.
  const ink = bestTextOn(ground, ['#ffffff', '#111111'])
  const soft = bestTextOn(ground, [accent, ink])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: ground,
          color: ink,
          padding: '80px 96px',
        }}
      >
        <div style={{ display: 'flex', width: 120, height: 8, background: accent, marginBottom: 48 }} />
        <div style={{ fontSize: 96, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{name}</div>
        {tagline ? (
          <div style={{ fontSize: 38, lineHeight: 1.3, marginTop: 28, color: soft }}>{tagline}</div>
        ) : null}
      </div>
    ),
    size,
  )
}
