export const wiring = {
  id: 'media',
  collectionSlug: 'embeds',
  variable: 'embeds',
  collectionImport: "import { mediaModuleCollection } from './modules/media/collection'",
  collectionCall: (m) =>
    `mediaModuleCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  query: { collection: 'embeds', limit: 100, sort: '-publishedAt' },
  sectionImport: "import MediaSection from '@/modules/media/Section'",
  sectionRender: (m) =>
    `<MediaSection items={embeds} title="${m.title}" route="${m.route}" tone={mediaTone ?? undefined} />`,
  renders: 'embeds.length > 0',
  llmsImport: "import { mediaSection } from '@/modules/media/llms'",
  llmsName: 'mediaSection',
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  indexPage: (m) => ({
    path: `src/app/(frontend)${m.route}/page.tsx`,
    source: `import React from 'react'
import type { Metadata } from 'next'

import InnerPage from '../components/InnerPage'
import { MediaCard } from '@/modules/media/Section'
import { loadSiteContent } from '@/lib/data'

export const revalidate = 300

export const metadata: Metadata = {
  title: '${m.labels.plural}',
  alternates: { canonical: '${m.route}' },
}

export default async function MediaPage() {
  const { settings, embeds } = await loadSiteContent()

  return (
    <InnerPage settings={settings} title="${m.labels.plural}">
      <section className="section">
        <div className="container">
          {embeds.length ? (
            <div className="session-grid">
              {embeds.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="empty">Todavía no hay nada publicado.</p>
          )}
        </div>
      </section>
    </InnerPage>
  )
}
`,
  }),

  seed: () => `  const embedsCount = await payload.count({ collection: 'embeds' })
  if (embedsCount.totalDocs === 0) {
    // A real, public address: a made-up one would fail the panel's own validation, and the
    // point of the example is to show a player that works.
    await payload.create({
      collection: 'embeds',
      data: {
        title: 'Pieza de ejemplo',
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        description: 'Cámbiala por la tuya: vale SoundCloud, Mixcloud, YouTube o Bandcamp.',
        publishedAt: new Date().toISOString(),
        featured: true,
      },
    })
    payload.logger.info('1 pieza de ejemplo')
  }`,
}
