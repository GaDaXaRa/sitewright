import type { SiteSetting } from '@/payload-types'
import { SITE_URL } from './site'

/**
 * The plain-text summary AI assistants read (/llms.txt).
 *
 * Two rules, and the second is the one that matters: it is **generated from the CMS**, so
 * it cannot drift from the site; and **nothing is invented here**. If the client has not
 * written a price, a line-up or an address, the line is simply not printed. A made-up
 * detail in this file is worse than a missing one: it is what an assistant repeats as fact.
 *
 * Each module contributes its own sections through `sections`.
 */
export type LlmsSection = { title: string; lines: string[] }

function render(section: LlmsSection): string[] {
  return section.lines.length ? ['', `## ${section.title}`, '', ...section.lines] : []
}

export function buildLlmsTxt({
  settings,
  sections = [],
}: {
  settings: SiteSetting | null | undefined
  sections?: LlmsSection[]
}): string {
  const name = settings?.siteName || 'Sitio'

  const intro = [settings?.tagline, settings?.heroText, settings?.seoDescription]
    .map((t) => t?.trim())
    .filter(Boolean)

  const contact: LlmsSection = {
    title: 'Contacto',
    lines: [
      settings?.email ? `- Email: ${settings.email}` : '',
      settings?.phone ? `- Teléfono: ${settings.phone}` : '',
      settings?.city ? `- Dónde: ${settings.city}` : '',
    ].filter(Boolean),
  }

  const links: LlmsSection = {
    title: 'Enlaces',
    lines: [
      settings?.instagram ? `- Instagram: ${settings.instagram}` : '',
      settings?.facebook ? `- Facebook: ${settings.facebook}` : '',
      settings?.youtube ? `- YouTube: ${settings.youtube}` : '',
    ].filter(Boolean),
  }

  return [
    `# ${name}`,
    '',
    ...intro,
    '',
    `Web: ${SITE_URL}/`,
    ...sections.flatMap(render),
    ...render(contact),
    ...render(links),
    '',
  ].join('\n')
}
