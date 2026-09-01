/**
 * The site's public URL: metadata, canonical, sitemap, robots and JSON-LD all read it.
 *
 * There are three ways a site knows its own address, and they are tried in this order
 * because that is the order in which they become true:
 *
 * 1. **`NEXT_PUBLIC_SITE_URL`**, when someone has decided and written it down.
 * 2. **The site's own fallback**, from the blueprint. Empty when the domain has not been
 *    bought yet, which is the normal state of a site during the week it is being built.
 * 3. **The address Vercel gives the project**, which is a real one from the first deploy and
 *    quietly becomes the custom domain once that is configured.
 *
 * Declaring a domain that nobody has bought is how a site tells Google its good version is
 * an address that answers nothing — the same mistake as pointing the canonical at a
 * throwaway subdomain, only earlier.
 */
export function resolveSiteUrl(fallback = ''): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || fallback
  if (explicit) return explicit.replace(/\/$/, '')

  // Vercel sets this to the project's production domain — its *.vercel.app address until a
  // custom one is added, and the custom one afterwards.
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`

  // Local development, and the only case where the address is not a real one.
  return 'http://localhost:3000'
}
