import React from 'react'
import type { SiteSetting } from '@/payload-types'
import type { LegalSection } from 'sitewright-core'
import InnerPage from './InnerPage'

/**
 * The three legal pages share everything but their text, which is generated from the data
 * the client filled in. Anything they left empty simply does not appear.
 */
export default function LegalPage({
  settings,
  title,
  intro,
  sections,
}: {
  settings: SiteSetting
  title: string
  intro?: string
  sections: LegalSection[]
}) {
  return (
    <InnerPage settings={settings} kicker="Información legal" title={title} intro={intro}>
      <section className="section">
        <div className="container container-narrow legal">
          {sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </InnerPage>
  )
}
