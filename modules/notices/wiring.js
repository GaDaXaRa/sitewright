export const wiring = {
  id: 'notices',
  collectionSlug: 'notices',
  variable: 'notice',
  collectionImport: "import { noticesCollection } from './modules/notices/collection'",
  collectionCall: (m, bp) =>
    `noticesCollection({ labels: ${JSON.stringify(m.labels)}, buttonUrl: '${m.buttonUrl ?? Object.values(bp.modules).find((x) => x.route)?.route ?? '/'}' })`,
  // El aviso se elige en el cargador, no aquí: sólo sale el primero activo **y en fecha**,
  // y eso es una decisión, no una consulta.
  pickImport: "import { pickNotice } from '@/modules/notices/pick'",
  pickName: 'pickNotice',
  query: { collection: 'notices', where: { active: { equals: true } }, limit: 10, sort: '-updatedAt' },
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
