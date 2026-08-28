import type { CollectionConfig, Field } from 'payload'
import { slugify } from 'sitewright-core'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * Content placed in time: dates played, classes, activities, open days.
 *
 * Two decisions live here and both were bugs first. The **slug carries the date**, because
 * something that repeats every month keeps its title and the address has to stay unique.
 * And an item stops being upcoming when it **ends**, not when it starts — that rule is in
 * the core (`isUpcoming`), so the archive and the page cannot disagree.
 */
export function scheduleCollection({
  labels,
  route,
  place = true,
  tickets = true,
}: {
  labels: { singular: string; plural: string }
  route: string
  /** Whether it happens somewhere (a venue) or is online only. */
  place?: boolean
  /** Whether it can be paid for or booked elsewhere. */
  tickets?: boolean
}): CollectionConfig {
  const revalidation = revalidator(route)

  return {
    slug: 'schedule',
    labels,
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', 'startsAt', ...(place ? ['venue', 'city'] : [])],
      group: 'Contenido',
      description: `No borres las pasadas: se archivan solas cuando pasa el día.`,
    },
    access: { read: () => true },
    defaultSort: '-startsAt',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      {
        type: 'row',
        fields: [
          {
            name: 'startsAt',
            label: 'Empieza',
            type: 'date',
            required: true,
            admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' } },
          },
          {
            name: 'endsAt',
            label: 'Termina',
            type: 'date',
            admin: {
              width: '50%',
              date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm' },
              description:
                'Importante en lo que acaba de madrugada: sigue en "próximas" hasta que termina, no hasta que empieza.',
            },
          },
        ],
      },
      ...(place
        ? ([
            {
              type: 'row',
              fields: [
                { name: 'venue', label: 'Lugar', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'city', label: 'Ciudad', type: 'text', required: true, admin: { width: '50%' } },
              ],
            },
            {
              name: 'address',
              label: 'Dirección',
              type: 'text',
              admin: { description: 'Calle y número. Ayuda a salir en los buscadores con mapa.' },
            },
          ] as Field[])
        : []),
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'image', label: 'Imagen o cartel', type: 'upload', relationTo: 'media' },
      ...(tickets
        ? ([
            {
              type: 'row',
              fields: [
                {
                  name: 'free',
                  label: 'Entrada libre',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { width: '30%' },
                },
                {
                  name: 'price',
                  label: 'Precio (€)',
                  type: 'number',
                  admin: { width: '30%', condition: (data) => !data?.free },
                },
                {
                  name: 'ticketsUrl',
                  label: 'Entradas o reserva (enlace)',
                  type: 'text',
                  admin: { width: '40%', condition: (data) => !data?.free },
                },
              ],
            },
          ] as Field[])
        : []),
      {
        name: 'slug',
        label: 'Slug (URL)',
        type: 'text',
        index: true,
        unique: true,
        admin: {
          position: 'sidebar',
          description:
            'Lleva la fecha porque algo que se repite cada mes tiene el mismo título, y dos direcciones no pueden coincidir.',
        },
        hooks: {
          beforeValidate: [
            ({ value, data }) => {
              if (value) return value
              if (!data?.title) return value
              const day = data.startsAt ? String(data.startsAt).slice(0, 10) : ''
              return [slugify(data.title), day].filter(Boolean).join('-')
            },
          ],
        },
      },
    ],
  }
}
