import React from 'react'
import type { Metadata } from 'next'

import Nav from './components/Nav'
import Hero from './components/Hero'
import Footer from './components/Footer'
import JsonLd from './components/JsonLd'

import CatalogSection from '@/modules/catalog/Section'
import ScheduleSection from '@/modules/schedule/Section'
import PricingSection from '@/modules/pricing/Section'
import TeamSection from '@/modules/team/Section'
import MediaSection from '@/modules/media/Section'
import ReviewsSection from '@/modules/reviews/Section'
import FaqSection from '@/modules/faq/Section'
import NoticePopup from '@/modules/notices/Popup'
import ContactSection from '@/modules/contact/Section'

import { catalogNodes } from '@/modules/catalog/jsonld'
import { scheduleNodes } from '@/modules/schedule/jsonld'
import { pricingNodes } from '@/modules/pricing/jsonld'
import { teamNodes } from '@/modules/team/jsonld'
import { faqNode } from '@/modules/faq/jsonld'

import { loadSiteContent } from '@/lib/data'
import { buildHomeJsonLd } from '@/lib/jsonLd'
import { site } from '@/site.config'
import { alternateTones, mediaAlt, mediaFocal, mediaUrl, splitEvents } from '@sitewright/core'

export const revalidate = 300

export const metadata: Metadata = { alternates: { canonical: '/' } }

/**
 * A home page with every module enabled: what the generator writes when the blueprint says
 * yes to all of them.
 *
 * Two things are not decoration. The **order** of the sections comes from the blueprint,
 * and `alternateTones` spreads the backgrounds over the ones that are really painted, so
 * two sections that become neighbours when the client runs out of content never share a
 * background.
 */
export default async function HomePage() {
  const { settings, catalog, schedule, pricing, team, embeds, reviews, faqs, notice, now } =
    await loadSiteContent()

  const { upcoming } = splitEvents(schedule, now)

  const [catalogTone, scheduleTone, pricingTone, teamTone, mediaTone, reviewsTone, faqTone] =
    alternateTones([
      catalog.length > 0,
      upcoming.length > 0,
      pricing.length > 0,
      team.length > 0,
      embeds.length > 0,
      reviews.length > 0,
      faqs.length > 0,
    ])

  return (
    <>
      <JsonLd
        data={buildHomeJsonLd(settings, [
          ...teamNodes(team, '/equipo'),
          ...catalogNodes(catalog, '/servicios', (item) =>
            pricing.filter((price) => {
              const owner = price.belongsTo
              const id = typeof owner === 'object' ? owner?.id : owner
              return String(id) === String(item.id)
            }),
          ),
          ...scheduleNodes(upcoming, '/agenda'),
          ...pricingNodes(pricing, '/tarifas', 'Tarifas'),
          ...(faqs.length ? [faqNode(faqs)] : []),
        ])}
      />

      <NoticePopup notice={notice} siteId={site.id} />

      <Nav
        name={settings.siteName}
        logoUrl={mediaUrl(settings.logo)}
        links={[
          { href: '/servicios', label: 'Servicios' },
          { href: '/agenda', label: 'Agenda' },
          { href: '/tarifas', label: 'Tarifas' },
        ]}
        cta={{ href: '/#contacto', label: 'Contacto' }}
      />

      <Hero
        eyebrow={settings.heroEyebrow}
        title={settings.heroTitle || settings.siteName}
        text={settings.heroText}
        imageUrl={mediaUrl(settings.heroImage)}
        imageAlt={mediaAlt(settings.heroImage)}
        focalX={mediaFocal(settings.heroImage).x}
        focalY={mediaFocal(settings.heroImage).y}
        textPosition={settings.heroTextPosition}
        textHeight={settings.heroTextHeight}
        actions={[{ href: '/#contacto', label: 'Escríbenos' }]}
      />

      <CatalogSection
        items={catalog}
        title="Qué hacemos"
        route="/servicios"
        tone={catalogTone ?? undefined}
        limit={6}
      />

      <ScheduleSection
        items={schedule}
        now={now}
        title="Agenda"
        route="/agenda"
        tone={scheduleTone ?? undefined}
      />

      <PricingSection
        prices={pricing}
        title="Tarifas"
        tone={pricingTone ?? undefined}
        ctaHref="/#contacto"
      />

      <TeamSection people={team} title="Quiénes somos" route="/equipo" tone={teamTone ?? undefined} />

      <MediaSection items={embeds} title="Medios" route="/medios" tone={mediaTone ?? undefined} />

      <ReviewsSection reviews={reviews} title="Lo que dicen" tone={reviewsTone ?? undefined} />

      <FaqSection faqs={faqs} title="Preguntas frecuentes" tone={faqTone ?? undefined} />

      <ContactSection
        title="Contacto"
        text={settings.heroText}
        email={settings.email}
        kinds={{ quote: 'Presupuesto', visit: 'Visita', other: 'Otro' }}
        privacyHref={site.routes.privacy}
      />

      <Footer
        settings={settings}
        links={[
          { href: '/servicios', label: 'Servicios' },
          { href: '/agenda', label: 'Agenda' },
          { href: '/tarifas', label: 'Tarifas' },
        ]}
      />
    </>
  )
}
