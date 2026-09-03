export const wiring = {
  id: 'reviews',
  collectionSlug: 'reviews',
  variable: 'reviews',
  collectionImport: "import { reviewsCollection } from './modules/reviews/collection'",
  collectionCall: (m) => `reviewsCollection({ labels: ${JSON.stringify(m.labels)} })`,
  dataQuery: () =>
    `payload.find({ collection: 'reviews', where: { active: { equals: true } }, limit: 50, sort: 'order' })`,
  sectionImport: "import ReviewsSection from '@/modules/reviews/Section'",
  sectionRender: (m) =>
    `<ReviewsSection reviews={reviews} title="${m.title}" tone={reviewsTone ?? undefined} />`,
  renders: 'reviews.length > 0',

  seed: () => `  const reviewsCount = await payload.count({ collection: 'reviews' })
  if (reviewsCount.totalDocs === 0) {
    const examples = [
      { text: 'Lo que dijo alguien de vosotros, en sus palabras.', author: 'Quien lo dijo', order: 0 },
      { text: 'Otra cita, más corta.', author: 'Otra persona', source: 'Dónde lo dijo', order: 1 },
    ]
    for (const example of examples) {
      await payload.create({ collection: 'reviews', data: { ...example, active: true } })
    }
    payload.logger.info('2 opiniones de ejemplo')
  }`,
}
