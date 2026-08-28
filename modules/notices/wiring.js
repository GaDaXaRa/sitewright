export const wiring = {
  id: 'notices',
  variable: 'notice',
  collectionImport: "import { noticesCollection } from './modules/notices/collection'",
  collectionCall: (m, bp) =>
    `noticesCollection({ labels: ${JSON.stringify(m.labels)}, buttonUrl: '${m.buttonUrl ?? Object.values(bp.modules).find((x) => x.route)?.route ?? '/'}' })`,
  // The notice is picked in the loader, not here: only the first active *and in date* one
  // shows, and that is a decision, not a query.
  dataQuery: () =>
    `payload.find({ collection: 'notices', where: { active: { equals: true } }, limit: 10, sort: '-updatedAt' })`,
  dataPick: `const now = Date.now()\n    const notice =\n      notices.docs.find((n) => {\n        const from = n.startsAt ? new Date(n.startsAt).getTime() : null\n        const to = n.endsAt ? new Date(n.endsAt).getTime() : null\n        return (from === null || from <= now) && (to === null || to >= now)\n      }) ?? null`,
  sectionImport: "import NoticePopup from '@/modules/notices/Popup'",
  // Not a section: it is an overlay, so it is painted before everything and takes no tone.
  overlay: true,
  overlayRender: () => `<NoticePopup notice={notice} siteId={site.id} />`,
}
