import sharp from 'sharp'
import { loadSettings } from '@/lib/data'
import { mediaUrl } from 'sitewright-core'
import { SITE_URL } from '@/lib/site'

/**
 * The icon the client uploaded, served from **this** fixed address, as a real PNG.
 *
 * Two decisions, both learned the hard way:
 *
 * 1. **The address never changes.** It could redirect to the blob store instead, and that is
 *    exactly what must not happen: a new upload gets a new blob address, and an icon whose
 *    address moves is one a search engine stops associating with the site.
 * 2. **The bytes are converted here.** The client uploads whatever they have — a WebP, a
 *    JPEG, something rectangular — and the page declares `type="image/png"`. Serving WebP
 *    under that declaration is how a perfectly good 512×512 icon ends up not showing at all.
 *    Converting is cheaper than teaching everyone to export a square PNG.
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

  // `cover` rather than a stretch: a rectangular upload gets cropped to the middle, which is
  // what someone expects from an icon, instead of squashed.
  const png = await sharp(Buffer.from(await upstream.arrayBuffer()))
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      // Long enough to be worth caching, short enough that a change is visible the same day.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
