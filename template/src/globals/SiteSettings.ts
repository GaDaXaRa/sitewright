import type { GlobalConfig } from 'payload'
import { revalidateSiteGlobal } from '../collections/hooks/revalidate'
import { site } from '../site.config'

/**
 * Site-wide settings: identity, home cover, contact, social links and legal data.
 *
 * These are the fields **every** site has. A module that needs its own section headings
 * adds them here through the generator, next to its own content.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Ajustes del sitio',
  admin: { group: 'Configuración' },
  access: { read: () => true },
  hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [
    { name: 'siteName', label: 'Nombre', type: 'text', required: true, defaultValue: site.name },
    { name: 'tagline', label: 'Eslogan', type: 'text' },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    {
      // What the business *is*, in the vocabulary search engines use. Getting it right is
      // what puts dates in the events box or a studio on the map, instead of leaving the
      // pages as anonymous documents.
      name: 'schemaType',
      label: 'Qué tipo de negocio es (para buscadores)',
      type: 'select',
      defaultValue: 'Organization',
      options: [
        { label: 'Organización o empresa', value: 'Organization' },
        { label: 'Negocio con local abierto al público', value: 'LocalBusiness' },
        { label: 'Persona (portafolio)', value: 'Person' },
        { label: 'Grupo o colectivo musical', value: 'MusicGroup' },
        { label: 'Asociación', value: 'NGO' },
      ],
      admin: {
        position: 'sidebar',
        description: 'No se ve en la web. Ayuda a Google y a los asistentes de IA a entender qué eres.',
      },
    },
    {
      name: 'seoTitle',
      label: 'Título para buscadores (no se ve en la web)',
      type: 'text',
      admin: {
        description:
          'El titular que Google enseña en sus resultados, y el título de la pestaña. NO se muestra en la web. Unos 60 caracteres: qué ofreces y dónde, con el nombre al final.',
      },
    },
    {
      name: 'seoDescription',
      label: 'Descripción para buscadores (no se ve en la web)',
      type: 'textarea',
      admin: {
        description:
          'El texto bajo el título en los resultados de Google, y el que se ve al compartir por WhatsApp. NO se muestra en ninguna parte de la web. Una frase de unos 150 caracteres.',
      },
    },
    {
      type: 'collapsible',
      label: 'Portada',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'heroImage',
          label: 'Imagen de fondo de la portada',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Foto a pantalla completa. Horizontal y de buena resolución (mín. 1920px de ancho). Si es vertical, marca el PUNTO FOCAL en Imágenes para que no se recorte mal.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'heroTextPosition',
              label: 'Texto: posición horizontal',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'A la izquierda', value: 'left' },
                { label: 'Centrado', value: 'center' },
                { label: 'A la derecha', value: 'right' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'heroTextHeight',
              label: 'Texto: altura',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Arriba', value: 'top' },
                { label: 'En el centro', value: 'center' },
                { label: 'Abajo', value: 'bottom' },
              ],
              admin: {
                width: '50%',
                description: 'Colócalo en la zona vacía de la foto para que no tape a nadie.',
              },
            },
          ],
        },
        { name: 'heroEyebrow', label: 'Titulillo superior', type: 'text' },
        { name: 'heroTitle', label: 'Título de la portada', type: 'text' },
        { name: 'heroText', label: 'Texto introductorio', type: 'textarea' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Contacto',
      fields: [
        { name: 'email', label: 'Email de contacto', type: 'email' },
        { name: 'phone', label: 'Teléfono', type: 'text' },
        { name: 'city', label: 'Ciudad', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Redes',
      fields: [
        { name: 'instagram', label: 'Instagram (URL)', type: 'text' },
        { name: 'facebook', label: 'Facebook (URL)', type: 'text' },
        { name: 'youtube', label: 'YouTube (URL)', type: 'text' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Datos legales',
      admin: {
        initCollapsed: true,
        description:
          'Salen en el aviso legal y en la política de privacidad. Son obligatorios para una web que recoge datos por formulario.',
      },
      fields: [
        {
          name: 'legalHolder',
          label: 'Titular de la web',
          type: 'text',
          admin: { description: 'Nombre y apellidos, o razón social.' },
        },
        { name: 'legalId', label: 'NIF / CIF', type: 'text' },
        { name: 'legalAddress', label: 'Domicilio', type: 'text' },
        {
          name: 'legalEmail',
          label: 'Email para ejercer derechos (RGPD)',
          type: 'email',
          admin: { description: 'Si lo dejas vacío se usa el email de contacto.' },
        },
        {
          name: 'analyticsConsent',
          label: 'Pedir consentimiento antes de medir visitas',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description:
              'Recomendado. Sin marcar, la analítica se carga desde el primer momento y eso solo es defendible si no usa cookies.',
          },
        },
      ],
    },
    // The generator appends each module's own settings here.
  ],
}
