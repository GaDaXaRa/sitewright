/**
 * The shapes the core needs from a site's data, declared here instead of imported.
 *
 * A Payload site generates its own `payload-types.ts`, and importing it would tie the core
 * to one site's CMS: adding a field there would be a breaking change here. These are the
 * minimum each function actually reads.
 */

/** An image as it comes out of an upload collection. */
export type MediaLike = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

/** What the legal pages need from the site's settings. */
export type LegalSettings = {
  siteName?: string | null
  legalHolder?: string | null
  legalId?: string | null
  legalAddress?: string | null
  legalEmail?: string | null
  email?: string | null
  analyticsConsent?: boolean | null
  cookieBanner?: 'auto' | 'always' | 'never' | null
}
