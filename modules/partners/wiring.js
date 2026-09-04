export const wiring = {
  id: 'partners',
  collectionSlug: 'partners',
  variable: 'partners',
  collectionImport: "import { partnersCollection } from './modules/partners/collection'",
  collectionCall: (m) => `partnersCollection({ labels: ${JSON.stringify(m.labels)} })`,
  dataQuery: () =>
    `payload.find({ collection: 'partners', where: { active: { equals: true } }, limit: 50, sort: 'order', depth: 1 })`,
  sectionImport: "import PartnersSection from '@/modules/partners/Section'",
  sectionRender: (m) =>
    `<PartnersSection partners={partners} title="${m.title}" tone={partnersTone ?? undefined} />`,
  renders: 'partners.length > 0',
  llmsImport: "import { partnersSection } from '@/modules/partners/llms'",
  llmsSection: (m) => `partnersSection(partners, '${m.title}')`,

  // Sin semilla a propósito: un logo de ejemplo no existe, y sembrar un colaborador
  // inventado haría aparecer la sección con un nombre que nadie ha dicho.
}
