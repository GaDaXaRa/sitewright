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

  pagePath: '@/modules/media/Page',
  indexPage: true,

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
