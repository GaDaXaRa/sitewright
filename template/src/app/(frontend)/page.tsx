import React from 'react'
import type { Metadata } from 'next'

import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'
import JsonLd from './components/JsonLd'

import { loadSiteContent } from '@/lib/data'
import { pageMetadata } from '@/lib/metadata'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { mediaAlt, mediaFocal, mediaUrl } from 'sitewright-core'

// ISR: the home page is generated statically and revalidated every five minutes at most.
// A hook also revalidates it the instant the client edits content in the CMS, so edits
// show up straight away.
export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await loadSiteContent()
  const name = settings?.siteName
  const title =
    settings?.seoTitle?.trim() ||
    (settings?.tagline?.trim() ? `${name} — ${settings.tagline.trim()}` : undefined)

  // La portada es la página que más se comparte, y era la única que se quedaba sin tarjeta
  // cuando la web todavía no tenía ni foto de portada ni logotipo. El título se pone aparte
  // porque el de la portada es absoluto: no lleva detrás el nombre del sitio.
  const meta = pageMetadata({ canonical: '/', settings })
  return {
    ...meta,
    ...(title ? { title: { absolute: title } } : {}),
    openGraph: { ...meta.openGraph, ...(title ? { title } : {}) },
  }
}

/**
 * The home page of a site with no modules yet: a cover and a footer.
 *
 * The generator inserts each module's section between them, in blueprint order, and
 * spreads the background tones over the ones that are actually painted (`alternateTones`).
 */
export default async function HomePage() {
  const { settings } = await loadSiteContent()

  return (
    <>
      <JsonLd data={buildHomeJsonLd(settings)} />

      <Nav name={settings?.siteName} logoUrl={mediaUrl(settings?.logo)} links={[]} />

      <Hero
        eyebrow={settings?.heroEyebrow}
        title={settings?.heroTitle || settings?.siteName}
        text={settings?.heroText}
        imageUrl={mediaUrl(settings?.heroImage)}
        imageAlt={mediaAlt(settings?.heroImage)}
        focalX={mediaFocal(settings?.heroImage).x}
        focalY={mediaFocal(settings?.heroImage).y}
        textPosition={settings?.heroTextPosition}
        textHeight={settings?.heroTextHeight}
      />

      <Footer settings={settings} links={[]} />
    </>
  )
}
