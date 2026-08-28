import React from 'react'
import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'
import { mediaUrl } from 'sitewright-core'
import { site } from '@/site.config'

import Nav from './Nav'
import Footer from './Footer'

/**
 * The frame every inner page shares: navigation, breadcrumbs, the page's own <h1>, and the
 * footer. Sections reused from the home page are told they are on a page (`context`) so
 * they drop their own heading and leave the <h1> to this one.
 */
export default function InnerPage({
  settings,
  kicker,
  title,
  intro,
  children,
}: {
  settings: SiteSetting
  kicker?: string
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <>
      <Nav
        name={settings?.siteName ?? site.name}
        logoUrl={mediaUrl(settings?.logo)}
        links={[...site.nav]}
        cta={site.cta ?? undefined}
      />

      <article className="inner">
        <header className="inner-head">
          <div className="container">
            <nav className="crumbs" aria-label="Migas de pan">
              <Link href="/">Inicio</Link>
              <span aria-hidden="true">/</span>
              <span>{title}</span>
            </nav>
            {kicker ? <span className="kicker">{kicker}</span> : null}
            <h1>{title}</h1>
            {intro ? <p className="inner-intro">{intro}</p> : null}
          </div>
        </header>

        {children}
      </article>

      <Footer settings={settings} />
    </>
  )
}
