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

  detailPage: (m) => ({
    path: `src/app/(frontend)${m.route}/[slug]/page.tsx`,
    source: `import React from 'react'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import InnerPage from '../../components/InnerPage'
import JsonLd from '../../components/JsonLd'
import { teamNodes } from '@/modules/team/jsonld'
import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { mediaAlt, mediaUrl } from 'sitewright-core'

export const revalidate = 300

async function find(slug: string) {
  const { team } = await loadSiteContent()
  return team.find((person) => person.slug === slug) ?? null
}

export async function generateStaticParams() {
  const { team } = await loadSiteContent()
  return team.filter((person) => person.slug).map((person) => ({ slug: person.slug! }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const person = await find(slug)
  if (!person) return {}

  return {
    title: person.name,
    ...(person.bio?.[0]?.text ? { description: person.bio[0].text } : {}),
    alternates: { canonical: \`${m.route}/\${slug}\` },
  }
}

export default async function TeamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const person = await find(slug)
  if (!person) notFound()

  const { settings } = await loadSiteContent()
  const photo = mediaUrl(person.photo)

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings, teamNodes([person], '${m.route}'))} />
      <InnerPage settings={settings} kicker={person.role ?? undefined} title={person.name}>
        <section className="section">
          <div className="container member-page">
            {photo ? (
              <div className="member-page-photo">
                <Image
                  src={photo}
                  alt={mediaAlt(person.photo) || ''}
                  width={800}
                  height={1000}
                  sizes="(max-width: 800px) 100vw, 380px"
                  priority
                />
              </div>
            ) : null}

            <div className="member-page-text">
              {(person.bio ?? []).map((paragraph, i) => (
                <p key={i}>{paragraph.text}</p>
              ))}

              {person.links?.length ? (
                <ul className="member-links">
                  {person.links.map((link, i) => (
                    <li key={i}>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      </InnerPage>
    </>
  )
}
`,
  }),

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
