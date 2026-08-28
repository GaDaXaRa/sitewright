export const wiring = {
  id: 'contact',
  variable: null,
  collectionImport: "import { contactCollection } from './modules/contact/collection'",
  collectionCall: (m, bp) =>
    `contactCollection({\n      labels: ${JSON.stringify(m.labels)},${m.kinds ? `\n      kinds: ${JSON.stringify(m.kinds)},` : ''}${m.askDate === false ? '\n      askDate: false,' : ''}${m.askCity === false ? '\n      askCity: false,' : ''}${bp.modules.pricing ? "\n      interestIn: 'pricing'," : bp.modules.catalog ? "\n      interestIn: 'catalog'," : ''}\n    })`,
  // A module can ask for its own settings: what the client reads has to be editable by the
  // client, and the generator is the only one who knows this module is even here.
  settingsFields: (m) => `    {
      type: 'collapsible',
      label: '${m.title}',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'contactText',
          label: 'Texto introductorio del formulario',
          type: 'textarea',
          admin: { description: 'La frase que va junto al formulario. Dos líneas bastan.' },
        },
      ],
    },`,
  sectionImport: "import ContactSection from '@/modules/contact/Section'",
  sectionRender: (m) =>
    `<ContactSection\n        title="${m.title}"\n        text={settings.contactText}\n        email={settings.email}${m.kinds ? `\n        kinds={${JSON.stringify(m.kinds)}}` : ''}\n        privacyHref={site.routes.privacy}\n      />`,
  // Always painted: a site whose form disappears when nothing else has content is a site
  // nobody can write to.
  renders: null,
  navCta: (m) => ({ href: '/#contacto', label: m.labels.singular === 'Solicitud' ? 'Contacto' : m.labels.singular }),
}
