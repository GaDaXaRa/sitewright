export const wiring = {
  id: 'team',
  collectionSlug: 'team',
  variable: 'team',
  collectionImport: "import { teamCollection } from './modules/team/collection'",
  collectionCall: (m) =>
    `teamCollection({ labels: ${JSON.stringify(m.labels)}, route: '${m.route}' })`,
  query: { collection: 'team', limit: 50, sort: 'order' },
  sectionImport: "import TeamSection from '@/modules/team/Section'",
  sectionRender: (m) =>
    `<TeamSection items={team} title="${m.title}" route="${m.route}" tone={teamTone ?? undefined} />`,
  renders: 'team.length > 0',
  jsonldImport: "import { teamNodes } from '@/modules/team/jsonld'",
  // People first in the graph: everything else refers to them by @id, and a reference that
  // resolves to nothing is worse than no markup at all.
  jsonldFirst: true,
  jsonldNodes: (m) => `...teamNodes(team, '${m.route}')`,
  llmsImport: "import { teamSection } from '@/modules/team/llms'",
  llmsName: 'teamSection',


  // Un colectivo cuyo sentido es la visibilidad de quienes lo forman necesita una página
  // donde estén todas, no sólo un trozo de la portada: es lo que se enlaza, lo que se
  // comparte y lo que indexa un buscador.
  pagePath: '@/modules/team/Page',
  indexPage: true,

  navLink: (m) => ({ href: m.route, label: m.labels.plural }),

  detailPath: '@/modules/team/Detail',

  seed: (m) => `  const teamCount = await payload.count({ collection: 'team' })
  if (teamCount.totalDocs === 0) {
    for (const [i, name] of ['Nombre Apellido', 'Otra Persona', 'Tercera Persona'].entries()) {
      await payload.create({
        collection: 'team',
        data: {
          name,
          role: 'Su papel aquí',
          bio: [{ text: 'Dos líneas sobre quién es y qué hace. Esto es un ejemplo.' }],
          order: i,
        },
      })
    }
    payload.logger.info('3 personas de ejemplo')
  }`,
}
