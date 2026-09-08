/**
 * El resumen en texto plano que leen los asistentes (`/llms.txt`).
 *
 * Dos reglas, y la segunda es la que importa: se **genera desde el CMS**, así que no puede
 * discrepar de la web; y **aquí no se inventa nada**. Si la clienta no ha escrito un
 * precio, un cartel o una dirección, la línea sencillamente no se imprime. Un dato inventado
 * en este fichero es peor que uno que falta: es lo que un asistente repite como un hecho.
 *
 * Cada módulo aporta sus secciones. Lo que **no** está aquí es `LlmsContext`, el contrato
 * con los módulos: lleva los ajustes de esa web, y un módulo lee campos que sólo existen
 * ahí —la presentación, por ejemplo—, así que vive en el sitio y no en el paquete.
 */

export type LlmsSection = { title: string; lines: string[] }

/** Lo que la cabecera y el pie del fichero leen de los ajustes. */
export type LlmsSettings = {
  siteName?: string | null
  tagline?: string | null
  heroText?: string | null
  seoDescription?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  instagram?: string | null
  facebook?: string | null
  youtube?: string | null
}

/** Una sección vacía no se escribe: un encabezado sobre nada es ruido para quien lo lee. */
function render(section: LlmsSection): string[] {
  return section.lines.length ? ['', `## ${section.title}`, '', ...section.lines] : []
}

export function llmsTxt(siteUrl: string) {
  return function buildLlmsTxt({
    settings,
    sections = [],
  }: {
    settings: LlmsSettings | null | undefined
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
      `Web: ${siteUrl}/`,
      ...sections.flatMap(render),
      ...render(contact),
      ...render(links),
      '',
    ].join('\n')
  }
}
