export const wiring = {
  id: 'team',
  variable: 'team',
  collectionImport: "import { teamCollection } from './modules/team/collection'",
  collectionCall: (m) =>
    `teamCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  dataQuery: () => `payload.find({ collection: 'team', limit: 50, sort: 'order' })`,
  sectionImport: "import TeamSection from '@/modules/team/Section'",
  sectionRender: (m) =>
    `<TeamSection people={team} title="${m.title}" route="${m.route}" tone={teamTone ?? undefined} />`,
  renders: 'team.length > 0',
  jsonldImport: "import { teamNodes } from '@/modules/team/jsonld'",
  // People first in the graph: everything else refers to them by @id, and a reference that
  // resolves to nothing is worse than no markup at all.
  jsonldFirst: true,
  jsonldNodes: (m) => `...teamNodes(team, '${m.route}')`,
  llmsImport: "import { teamSection } from '@/modules/team/llms'",
  llmsSection: (m) => `teamSection(team, '${m.title}', '${m.route}')`,
}
