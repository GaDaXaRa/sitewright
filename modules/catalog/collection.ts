import type { CollectionConfig, Field } from 'payload'
import { slugify } from '@sitewright/core'
import { documentRevalidator } from '@/collections/hooks/revalidate'

/**
 * What the business offers or has done: services, projects, sessions, activities.
 *
 * One module, four vocabularies. Nothing here is written in a business's words — labels and
 * routes come in, so the panel speaks the client's language without a line of code
 * changing.
 */
export function catalogCollection({
  labels,
  route,
  dated = false,
}: {
  labels: { singular: string; plural: string }
  /** Where its pages live, e.g. `/servicios`. */
  route: string
  /** Whether each item is placed in time (a session, a project with a delivery date). */
  dated?: boolean
}): CollectionConfig {
  const revalidation = documentRevalidator((doc) => (doc?.slug ? `${route}/${doc.slug}` : null))

  return {
    slug: 'catalog',
    labels,
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', 'order', ...(dated ? ['publishedAt'] : [])],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: dated ? '-publishedAt' : 'order',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      {
        name: 'summary',
        label: 'Resumen',
        type: 'textarea',
        admin: { description: 'Dos o tres líneas. Es lo que se ve en la portada.' },
      },
      {
        name: 'body',
        label: 'Descripción',
        type: 'array',
        labels: { singular: 'Párrafo', plural: 'Párrafos' },
        admin: { description: `Se muestra en la página de ${labels.singular.toLowerCase()}.` },
        fields: [
          { name: 'heading', label: 'Subtítulo (opcional)', type: 'text' },
          { name: 'text', label: 'Texto', type: 'textarea', required: true },
        ],
      },
      { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
      {
        name: 'highlights',
        label: 'Puntos destacados',
        type: 'array',
        labels: { singular: 'Punto', plural: 'Puntos' },
        fields: [{ name: 'text', label: 'Punto', type: 'text', required: true }],
      },
      {
        name: 'tags',
        label: 'Etiquetas',
        type: 'array',
        labels: { singular: 'Etiqueta', plural: 'Etiquetas' },
        fields: [{ name: 'name', label: 'Etiqueta', type: 'text', required: true }],
      },
      {
        name: 'externalUrl',
        label: 'Enlace externo',
        type: 'text',
        admin: { description: 'Si el trabajo vive en otro sitio (una web, una plataforma).' },
      },
      ...(dated
        ? ([
            {
              name: 'publishedAt',
              label: 'Fecha',
              type: 'date',
              required: true,
              defaultValue: () => new Date().toISOString(),
              admin: {
                position: 'sidebar',
                date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
              },
            },
          ] as Field[])
        : []),
      {
        name: 'featured',
        label: 'Destacado en la portada',
        type: 'checkbox',
        defaultValue: false,
        admin: { position: 'sidebar' },
      },
      {
        name: 'order',
        label: 'Orden',
        type: 'number',
        defaultValue: 0,
        admin: { position: 'sidebar', description: 'Se muestran de menor a mayor número.' },
      },
      {
        name: 'slug',
        label: 'Slug (URL)',
        type: 'text',
        index: true,
        unique: true,
        admin: { position: 'sidebar', description: `Parte final de la dirección (${route}/…).` },
        hooks: {
          beforeValidate: [({ value, data }) => value || (data?.title ? slugify(data.title) : value)],
        },
      },
    ],
  }
}
