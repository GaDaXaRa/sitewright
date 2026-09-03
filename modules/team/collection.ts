import type { CollectionConfig } from 'payload'
import { slugify } from 'sitewright-core'
import { documentRevalidator } from '@/collections/hooks/revalidate'

/**
 * The people: a collective's members, a studio's team, an association's board.
 *
 * Each one gets a page and a `Person` node in the graph, referenced from the organization
 * by `@id` — never a name copied twice, which is how two spellings of the same person end
 * up on one site.
 */
export function teamCollection({
  labels,
  route,
}: {
  labels: { singular: string; plural: string }
  route: string
}): CollectionConfig {
  const revalidation = documentRevalidator((doc) => (doc?.slug ? `${route}/${doc.slug}` : null))

  return {
    slug: 'team',
    labels,
    admin: {
      useAsTitle: 'name',
      defaultColumns: ['name', 'role', 'order'],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: 'order',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        required: true,
        admin: { placeholder: 'Ej.: Ana Ruiz' },
      },
      {
        name: 'role',
        label: 'Papel',
        type: 'text',
        admin: { placeholder: 'Ej.: Fundadora · Diseño' },
      },
      {
        name: 'photo',
        label: 'Foto',
        type: 'upload',
        relationTo: 'media',
        admin: {
          description:
            'Retrato. Vertical y de buena resolución (mín. 1200px de ancho). Marca el punto focal sobre la cara para que no se recorte.',
        },
      },
      {
        name: 'bio',
        label: 'Biografía',
        type: 'array',
        labels: { singular: 'Párrafo', plural: 'Párrafos' },
        admin: { description: 'Se muestra en su ficha. El primer párrafo asoma también en la portada.' },
        fields: [{ name: 'text', label: 'Párrafo', type: 'textarea', required: true }],
      },
      {
        name: 'links',
        label: 'Enlaces',
        type: 'array',
        labels: { singular: 'Enlace', plural: 'Enlaces' },
        admin: { description: 'Redes y sitios donde se le puede seguir.' },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'label',
                label: 'Nombre',
                type: 'text',
                required: true,
                admin: { width: '40%', placeholder: 'Instagram' },
              },
              {
                name: 'url',
                label: 'Dirección',
                type: 'text',
                required: true,
                admin: { width: '60%', placeholder: 'https://instagram.com/…' },
              },
            ],
          },
        ],
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
        admin: {
          position: 'sidebar',
          description: `Parte final de la dirección de su ficha (${route}/…). Se genera del nombre.`,
        },
        hooks: {
          beforeValidate: [({ value, data }) => value || (data?.name ? slugify(data.name) : value)],
        },
      },
    ],
  }
}
