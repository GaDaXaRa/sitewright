/**
 * The site's icon: what a browser tab and a search result show.
 *
 * Two things decided here, both learned the hard way on a live site:
 *
 * 1. **The address has to be stable.** With the icon inside Next's app directory it gets a
 *    content hash that changes on every deploy, and Google — which needs a fixed URL to
 *    associate an icon with a site — kept showing the generic globe for weeks. So the files
 *    live in `public/`, and the CMS override is served from a fixed route rather than from
 *    the blob store's own (changing) address.
 * 2. **The client has to be able to change it** without a deploy, which is what the route
 *    is for.
 */

export type IconSettings = {
  /** The image uploaded in the panel, if any. */
  favicon?: unknown
}

export type IconDescriptor = { url: string; sizes?: string; type?: string }

/** Where the CMS override is served from. Fixed on purpose. */
export const CMS_ICON_ROUTE = '/icono.png'

/**
 * The `metadata.icons` a page should declare.
 *
 * When the client has uploaded one it goes **first and largest**, because browsers pick the
 * best match and search engines read the first usable one. The generated files stay
 * declared underneath: they are the fallback while the upload is missing, and they are what
 * an old cache already holds.
 */
export function buildIcons(settings: IconSettings | null | undefined) {
  const uploaded = Boolean(settings?.favicon)

  const icon: IconDescriptor[] = [
    ...(uploaded ? [{ url: CMS_ICON_ROUTE, sizes: '512x512', type: 'image/png' }] : []),
    { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
    { url: '/icon.svg', type: 'image/svg+xml' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ]

  return {
    icon,
    apple: [
      uploaded
        ? { url: CMS_ICON_ROUTE, sizes: '180x180', type: 'image/png' }
        : { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}

/**
 * The default icon, drawn from what the blueprint already knows: the initials of the name
 * on the site's accent colour.
 *
 * It is an SVG so it can be written without rasterising anything, and it is deliberately
 * plain — a placeholder that looks deliberate is better than a generic globe, and worse
 * than the logo the client will upload.
 */
export function defaultIconSvg({
  name,
  accent,
  ground,
  radius = 96,
}: {
  name: string
  accent: string
  ground: string
  radius?: number
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${escapeXml(name)}">
  <rect width="512" height="512" rx="${radius}" fill="${accent}"/>
  <text x="256" y="256" fill="${ground}" font-family="Helvetica, Arial, sans-serif" font-size="248" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(initials(name))}</text>
</svg>
`
}

/** One letter, or two when the name has two words: more than that is unreadable at 16px. */
export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word))

  if (!words.length) return '?'
  if (words.length === 1) return words[0]!.slice(0, 1).toUpperCase()
  return (words[0]![0]! + words[1]![0]!).toUpperCase()
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
