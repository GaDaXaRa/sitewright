export const wiring = {
  id: 'media',
  variable: 'embeds',
  collectionImport: "import { mediaModuleCollection } from './modules/media/collection'",
  collectionCall: (m) =>
    `mediaModuleCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  dataQuery: () => `payload.find({ collection: 'embeds', limit: 100, sort: '-publishedAt' })`,
  sectionImport: "import MediaSection from '@/modules/media/Section'",
  sectionRender: (m) =>
    `<MediaSection items={embeds} title="${m.title}" route="${m.route}" tone={mediaTone ?? undefined} />`,
  renders: 'embeds.length > 0',
  llmsImport: "import { mediaSection } from '@/modules/media/llms'",
  llmsSection: (m) => `mediaSection(embeds, '${m.title}')`,
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),
}
