/**
 * The site's public URL: metadata, canonical, sitemap, robots and JSON-LD all read it.
 *
 * The rule lives here; the value belongs to each site, which passes its own domain as the
 * fallback. In Organic Yoga this pointed at the throwaway *.vercel.app subdomain for weeks,
 * telling Google the good version of the site was the disposable one — which is why no
 * template may hardcode it and why there is exactly one place to change it.
 */
export function resolveSiteUrl(fallback: string): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || fallback).replace(/\/$/, '')
}
