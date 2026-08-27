import type { MediaLike } from './types.js'

/**
 * Helpers to read an image field coming from the CMS.
 *
 * URLs already carry their version (`?v=…`) from the collection itself, in a read hook
 * (see `hooks/images.ts`): the site, the structured data and the admin thumbnails all
 * benefit without each consumer having to remember.
 */
function asMedia(value: unknown): MediaLike | null {
  return value && typeof value === 'object' ? (value as MediaLike) : null
}

export function mediaUrl(value: unknown): string | null {
  return asMedia(value)?.url ?? null
}

/** Same, but absolute: schema.org and social cards require it. */
export function mediaAbsoluteUrl(value: unknown, siteUrl: string): string | null {
  const url = mediaUrl(value)
  if (!url) return null
  return url.startsWith('http') ? url : `${siteUrl}${url}`
}

/** Alternative text (accessibility and image search). */
export function mediaAlt(value: unknown): string | null {
  return asMedia(value)?.alt ?? null
}

/** Focal point set in the admin panel (0-100): the part that must not be cropped away. */
export function mediaFocal(value: unknown): { x: number | null; y: number | null } {
  const m = asMedia(value)
  return { x: m?.focalX ?? null, y: m?.focalY ?? null }
}
