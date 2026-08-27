import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { site } from '@/site.config'
import type { SiteSetting } from '@/payload-types'

const FALLBACK = { id: 0, siteName: site.name } as SiteSetting

export const loadSettings = cache(async (): Promise<SiteSetting> => {
  try {
    const payload = await getPayload({ config: await config })
    return (await payload.findGlobal({ slug: 'site-settings' })) ?? FALLBACK
  } catch (err) {
    console.error('No se pudieron leer los ajustes del sitio:', err)
    return FALLBACK
  }
})

export const loadSiteContent = cache(async () => {
  try {
    const payload = await getPayload({ config: await config })
    const [settings, catalog, schedule, pricing, team, embeds, reviews, faqs, notices] =
      await Promise.all([
        payload.findGlobal({ slug: 'site-settings' }),
        payload.find({ collection: 'catalog', limit: 100, sort: 'order' }),
        payload.find({ collection: 'schedule', limit: 200, sort: '-startsAt' }),
        payload.find({
          collection: 'pricing',
          where: { active: { equals: true } },
          limit: 50,
          sort: 'order',
        }),
        payload.find({ collection: 'team', limit: 50, sort: 'order' }),
        payload.find({ collection: 'embeds', limit: 100, sort: '-publishedAt' }),
        payload.find({
          collection: 'reviews',
          where: { active: { equals: true } },
          limit: 50,
          sort: 'order',
        }),
        payload.find({
          collection: 'faqs',
          where: { active: { equals: true } },
          limit: 100,
          sort: 'order',
        }),
        payload.find({
          collection: 'notices',
          where: { active: { equals: true } },
          limit: 10,
          sort: '-updatedAt',
        }),
      ])

    const now = Date.now()
    const notice =
      notices.docs.find((n) => {
        const from = n.startsAt ? new Date(n.startsAt).getTime() : null
        const to = n.endsAt ? new Date(n.endsAt).getTime() : null
        return (from === null || from <= now) && (to === null || to >= now)
      }) ?? null

    return {
      settings: settings ?? FALLBACK,
      catalog: catalog.docs,
      schedule: schedule.docs,
      pricing: pricing.docs,
      team: team.docs,
      embeds: embeds.docs,
      reviews: reviews.docs,
      faqs: faqs.docs,
      notice,
      now,
    }
  } catch (err) {
    console.error('No se pudo cargar el contenido del sitio:', err)
    return {
      settings: FALLBACK,
      catalog: [],
      schedule: [],
      pricing: [],
      team: [],
      embeds: [],
      reviews: [],
      faqs: [],
      notice: null,
      now: Date.now(),
    }
  }
})
