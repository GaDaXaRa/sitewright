export const wiring = {
  id: 'schedule',
  collectionSlug: 'schedule',
  variable: 'schedule',
  collectionImport: "import { scheduleCollection } from './modules/schedule/collection'",
  collectionCall: (m) =>
    `scheduleCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${m.online ? ', place: false' : ''} })`,
  query: { collection: 'schedule', limit: 200, sort: '-startsAt' },
  sectionImport: "import ScheduleSection from '@/modules/schedule/Section'",
  sectionRender: (m) =>
    // `emptyText` se pasa sólo si el blueprint lo pide: la sección se esconde cuando no
    // hay nada por delante, y el texto es lo que dice «aquí va a haber algo, escríbenos».
    // Pasarlo siempre hacía inalcanzable el `return null` del propio componente.
    `<ScheduleSection\n        items={schedule}\n        now={now}\n        title="${m.title}"\n        route="${m.route}"\n        tone={scheduleTone ?? undefined}${m.emptyText ? `\n        emptyText="${m.emptyText}"` : ''}\n      />`,
  // Deliberately not `schedule.length`: what decides whether the section paints is whether
  // anything is still upcoming, and that is a decision of the core, not of a count.
  renders: 'splitEvents(schedule, now).upcoming.length > 0',
  jsonldImport: "import { scheduleNodes } from '@/modules/schedule/jsonld'",
  jsonldNodes: (m) => `...scheduleNodes(splitEvents(schedule, now).upcoming, '${m.route}')`,
  llmsImport: "import { scheduleSections } from '@/modules/schedule/llms'",
  llmsName: 'scheduleSections',
  // Escribe dos secciones y el encabezado de la segunda no está en el blueprint.
  options: () => ({ past: 'Anteriores' }),
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  pagePath: '@/modules/schedule/Page',
  indexPage: true,

  seed: (m) => `  const scheduleCount = await payload.count({ collection: 'schedule' })
  if (scheduleCount.totalDocs === 0) {
    // Two ahead and one behind, so the archive and the "próximas" list both have something
    // to show and the difference between them is visible from the first minute.
    const day = (days: number, hour: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      date.setHours(hour, 0, 0, 0)
      return date.toISOString()
    }
    const examples = [
      { title: 'Próxima ${m.labels.singular.toLowerCase()}', startsAt: day(10, 19), endsAt: day(10, 21) },
      { title: 'La siguiente', startsAt: day(31, 19), endsAt: day(31, 21) },
      { title: 'Una que ya pasó', startsAt: day(-20, 19), endsAt: day(-20, 21) },
    ]
    for (const example of examples) {
      await payload.create({
        collection: 'schedule',
        data: { ...example, venue: 'Lugar por decidir', city: '${m.city ?? 'Ciudad'}', free: true },
      })
    }
    payload.logger.info('3 fechas de ejemplo')
  }`,
}
