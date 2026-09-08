export const wiring = {
  id: 'timetable',
  collectionSlug: 'timetable',
  variable: 'timetable',
  collectionImport: "import { timetableCollection } from './modules/timetable/collection'",
  collectionCall: (m, bp) =>
    `timetableCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${bp.modules.pricing ? ", linkedTo: 'pricing'" : ''} })`,
  // `depth: 1` porque el nombre público lo pone la tarifa enlazada: sin cargarla, el
  // horario mostraría el título del panel y volvería a discrepar de la lista de precios.
  query: { collection: 'timetable', where: { active: { equals: true } }, limit: 100, sort: 'startTime', depth: 1 },
  sectionImport: "import TimetableSection from '@/modules/timetable/Section'",
  sectionRender: (m, bp) =>
    `<TimetableSection\n        items={timetable}\n        title="${m.title}"\n        route="${m.route}"\n        tone={timetableTone ?? undefined}${bp.modules.contact ? '\n        ctaHref="/#contacto"' : ''}\n      />`,
  renders: 'timetable.length > 0',
  jsonldImport: "import { timetableNodes } from '@/modules/timetable/jsonld'",
  jsonldNodes: (m) => `...timetableNodes(timetable, '${m.route}'${m.mode === 'online' ? ", 'online'" : ''})`,
  llmsImport: "import { timetableSection } from '@/modules/timetable/llms'",
  llmsName: 'timetableSection',
  // Lo que su página necesita y no está en el registro: si se da en línea o en un sitio, y
  // adónde lleva pulsar una clase.
  options: (m, bp) => ({
    ...(m.mode === 'online' ? { mode: 'online' } : {}),
    ...(bp.modules.contact ? { ctaHref: '/#contacto' } : {}),
  }),
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  pagePath: '@/modules/timetable/Page',
  indexPage: true,

  seed: (m) => `  const timetableCount = await payload.count({ collection: 'timetable' })
  if (timetableCount.totalDocs === 0) {
    // Un "as const" por literal, y no sobre el array: Payload genera uniones para los
    // desplegables y una lista de string no encaja en ('monday' | ...)[]. Sobre el array
    // entero tampoco valdría, porque saldría de sólo lectura.
    const examples = [
      { title: 'Sesión de mañana', days: ['monday' as const, 'wednesday' as const], startTime: '09:00', endTime: '10:00', level: 'beginner' as const },
      { title: 'Sesión de tarde', days: ['monday' as const, 'wednesday' as const], startTime: '18:00', endTime: '19:30', level: 'intermediate' as const },
      { title: 'Sesión de fin de semana', days: ['saturday' as const], startTime: '11:00', endTime: '12:30', level: 'all' as const },
    ]
    for (const example of examples) {
      await payload.create({ collection: 'timetable', data: { ...example, active: true } })
    }
    payload.logger.info('3 ${m.labels.plural.toLowerCase()} de ejemplo')
  }`,
}
