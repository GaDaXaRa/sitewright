import type { CollectionConfig } from 'payload'
import { parseEmbed, slugify } from 'sitewright-core'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * Audio and video hosted elsewhere: mixes, talks, recordings, showreels.
 *
 * The address is validated **when it is pasted**, not when the page renders: the client
 * pastes whatever the platform gave them, and a link that cannot become a player has to be
 * refused in the panel rather than silently showing nothing.
 *
 * Nothing loads before consent — that is the core's `Embed`, not a decision of this module.
 */
export function mediaModuleCollection({
  labels,
  route,
}: {
  labels: { singular: string; plural: string }
  route: string
}): CollectionConfig {
  const revalidation = revalidator(route)

  return {
    slug: 'embeds',
    labels,
    admin: {
      useAsTitle: 'title',
      defaultColumns: ['title', 'author', 'publishedAt'],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: '-publishedAt',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'author', label: 'Quién lo firma', type: 'text' },
      {
        name: 'url',
        label: 'Dirección del audio o del vídeo',
        type: 'text',
        required: true,
        admin: {
          description:
            'Pega el enlace de SoundCloud, Mixcloud, YouTube o el reproductor de Bandcamp. La web lo convierte en reproductor sola.',
        },
        validate: (value: unknown) => {
          if (typeof value !== 'string' || !value.trim()) return 'Hace falta un enlace.'
          return parseEmbed(value)
            ? true
            : 'No reconocemos esa dirección. Vale SoundCloud, Mixcloud, YouTube o el reproductor de Bandcamp (https://…).'
        },
      },
      { name: 'cover', label: 'Portada', type: 'upload', relationTo: 'media' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      {
        name: 'publishedAt',
        label: 'Fecha de publicación',
        type: 'date',
        required: true,
        defaultValue: () => new Date().toISOString(),
        admin: {
          position: 'sidebar',
          date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
        },
      },
      {
        name: 'featured',
        label: 'Destacado en la portada',
        type: 'checkbox',
        defaultValue: false,
        admin: { position: 'sidebar', description: 'El que suena arriba del todo.' },
      },
      {
        name: 'slug',
        label: 'Slug (URL)',
        type: 'text',
        index: true,
        unique: true,
        admin: { position: 'sidebar' },
        hooks: {
          beforeValidate: [({ value, data }) => value || (data?.title ? slugify(data.title) : value)],
        },
      },
    ],
  }
}
