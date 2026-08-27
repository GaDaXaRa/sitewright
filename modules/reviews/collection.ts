import type { CollectionConfig } from 'payload'
import { revalidateHomeAfterChange, revalidateHomeAfterDelete } from '@/collections/hooks/revalidate'

/**
 * What other people say: clients, press, promoters, members.
 *
 * Same shape everywhere, different label — which is the whole thesis of these modules.
 */
export function reviewsCollection({
  labels,
}: {
  labels: { singular: string; plural: string }
}): CollectionConfig {
  return {
  slug: 'reviews',
  labels,
  admin: {
    useAsTitle: 'author',
    defaultColumns: ['author', 'source', 'order', 'active'],
    group: 'Contenido',
  },
  access: { read: () => true },
  defaultSort: 'order',
  hooks: {
    afterChange: [revalidateHomeAfterChange],
    afterDelete: [revalidateHomeAfterDelete],
  },
  fields: [
    { name: 'text', label: 'Cita', type: 'textarea', required: true },
    { name: 'author', label: 'Quién lo dice', type: 'text', required: true },
    {
      name: 'source',
      label: 'Medio o sala',
      type: 'text',
      admin: { placeholder: 'Ej.: Radio 3 · Estudio Norte' },
    },
    { name: 'sourceUrl', label: 'Enlace al original', type: 'text' },
    {
      name: 'order',
      label: 'Orden',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      label: 'Activa (visible en la web)',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  }
}
