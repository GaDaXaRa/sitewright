export const wiring = {
  id: 'about',
  variable: null,
  // No collection: one text, edited where the rest of the site's own words live.
  settingsFields: (m) => `    {
      type: 'collapsible',
      label: '${m.title}',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'about',
          label: 'Texto (se ve en la web)',
          type: 'textarea',
          admin: {
            description:
              'Tu presentación, la que se lee en la portada. Separa los párrafos con una línea en blanco. Si la dejas vacía, la sección no aparece.',
          },
        },
        {
          name: 'aboutImage',
          label: 'Foto',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Vertical y de buena resolución (mín. 1200px de ancho). Opcional.' },
        },
      ],
    },`,
  sectionImport: "import AboutSection from '@/modules/about/Section'",
  sectionRender: (m) =>
    `<AboutSection\n        text={settings.about}\n        image={settings.aboutImage}\n        title="${m.title}"\n        tone={aboutTone ?? undefined}\n      />`,
  // Painted only when written: a heading over nothing reads as an unfinished site.
  renders: "Boolean(settings.about?.trim())",
  llmsImport: "import { aboutSection } from '@/modules/about/llms'",
  llmsName: 'aboutSection',
}
