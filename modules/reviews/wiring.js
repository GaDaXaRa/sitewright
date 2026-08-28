export const wiring = {
  id: 'reviews',
  variable: 'reviews',
  collectionImport: "import { reviewsCollection } from './modules/reviews/collection'",
  collectionCall: (m) => `reviewsCollection({ labels: ${JSON.stringify(m.labels)} })`,
  dataQuery: () =>
    `payload.find({ collection: 'reviews', where: { active: { equals: true } }, limit: 50, sort: 'order' })`,
  sectionImport: "import ReviewsSection from '@/modules/reviews/Section'",
  sectionRender: (m) =>
    `<ReviewsSection reviews={reviews} title="${m.title}" tone={reviewsTone ?? undefined} />`,
  renders: 'reviews.length > 0',
}
