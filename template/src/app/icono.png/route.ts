import { loadSettings } from '@/lib/data'
import { mediaUrl } from 'sitewright-core'
import { SITE_URL } from '@/lib/site'

/**
 * The icon the client uploaded, served from **this** fixed address.
 *
 * It could redirect to the blob store instead, and that is exactly what must not happen: a
 * new upload gets a new blob address, and an icon whose address changes is one a search
 * engine stops associating with the site. The route stays put; only its bytes change.
 */
export const revalidate = 3600

export async function GET() {
  const settings = await loadSettings()
  const url = mediaUrl(settings?.favicon)

  if (!url) {
    // No upload: the generated files in public/ are the icon, and they are already declared
    // in the layout, so there is nothing to serve here.
    return new Response('Sin icono propio', { status: 404 })
  }

  const upstream = await fetch(url.startsWith('http') ? url : `${SITE_URL}${url}`)
  if (!upstream.ok) return new Response('No se pudo leer el icono', { status: 502 })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
      // Long enough to be worth caching, short enough that a change is visible the same day.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
