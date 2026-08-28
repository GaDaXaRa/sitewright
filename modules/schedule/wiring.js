export const wiring = {
  id: 'schedule',
  variable: 'schedule',
  collectionImport: "import { scheduleCollection } from './modules/schedule/collection'",
  collectionCall: (m) =>
    `scheduleCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}'${m.online ? ', place: false' : ''} })`,
  dataQuery: () => `payload.find({ collection: 'schedule', limit: 200, sort: '-startsAt' })`,
  sectionImport: "import ScheduleSection from '@/modules/schedule/Section'",
  sectionRender: (m) =>
    `<ScheduleSection\n        items={schedule}\n        now={now}\n        title="${m.title}"\n        route="${m.route}"\n        tone={scheduleTone ?? undefined}\n        emptyText="${m.emptyText ?? 'No hay nada anunciado ahora mismo. Escríbenos y te avisamos.'}"\n      />`,
  // Deliberately not `schedule.length`: what decides whether the section paints is whether
  // anything is still upcoming, and that is a decision of the core, not of a count.
  renders: 'splitEvents(schedule, now).upcoming.length > 0',
  jsonldImport: "import { scheduleNodes } from '@/modules/schedule/jsonld'",
  jsonldNodes: (m) => `...scheduleNodes(splitEvents(schedule, now).upcoming, '${m.route}')`,
  llmsImport: "import { scheduleSections } from '@/modules/schedule/llms'",
  llmsSpread: (m) =>
    `...scheduleSections(schedule, now, { upcoming: '${m.title}', past: 'Anteriores' })`,
  navLink: (m) => ({ href: m.route, label: m.labels.plural }),
}
