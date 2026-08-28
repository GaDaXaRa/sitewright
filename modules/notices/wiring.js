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

  // Created switched **off**: a pop-up that greets the client on their own new site, with
  // example text in it, is the first thing they would have to hunt down.
  seed: () => `  const noticesCount = await payload.count({ collection: 'notices' })
  if (noticesCount.totalDocs === 0) {
    await payload.create({
      collection: 'notices',
      data: {
        title: 'Aviso de ejemplo',
        text: 'Escribe aquí lo que quieras anunciar y marca "Activo" cuando toque.',
        active: false,
      },
    })
    payload.logger.info('1 aviso de ejemplo (desactivado)')
  }`,
}
