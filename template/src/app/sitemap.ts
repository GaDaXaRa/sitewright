import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The generator reads here what each section actually has.

  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    // The generator adds one entry per module page here.
    // The legal pages are indexable on purpose: they are what proves the site has them.
    { url: `${SITE_URL}/aviso-legal`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Modules with a page per document (a member, a project) add their entries here, inside
  // a try/catch: with the database unavailable, the fixed pages must still be returned.

  return entries
}
