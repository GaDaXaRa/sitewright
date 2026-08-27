import { resolveSiteUrl } from '@sitewright/core'
import { site } from '@/site.config'

// The rule lives in the core; the address belongs to this site. Everything that declares
// identity — canonical, sitemap, robots, the JSON-LD `@id`s — reads from here and nowhere
// else, so changing domain is changing one line (or NEXT_PUBLIC_SITE_URL in Vercel).
export const SITE_URL = resolveSiteUrl(site.url)
