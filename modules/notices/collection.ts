import type { CollectionConfig } from 'payload'
import { revalidateHomeAfterChange, revalidateHomeAfterDelete } from '@/collections/hooks/revalidate'

/**
 * The notice the client wants seen on arrival. Only the first active, in-date one shows.
 *
 * It doubles as their publishing panel: it can be scheduled and switched off without being
 * deleted, which is what stops "temporary" announcements living forever.
 */
export function noticesCollection({
  labels,
  buttonUrl = '/',
}: {
  labels: { singular: string; plural: string }
  /** Where its button points by default — usually the module the notice is about. */
  buttonUrl?: string
}): CollectionConfig {
  return {
  slug: 'notices',
  labels,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'startsAt', 'endsAt'],
    group: 'Contenido',
    description:
      'Mensajes que aparecen en una ventana al entrar en la web. Solo se muestra el primero activo y en fecha.',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateHomeAfterChange],
    afterDelete: [revalidateHomeAfterDelete],
  },
  fields: [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      required: true,
      admin: { placeholder: 'Ej.: Plazas abiertas para septiembre' },
    },
    { name: 'text', label: 'Texto', type: 'textarea' },
    { name: 'image', label: 'Imagen (opcional)', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        {
          name: 'buttonLabel',
          label: 'Texto del botón',
          type: 'text',
          defaultValue: 'Ver más',
          admin: { width: '50%' },
        },
        {
          name: 'buttonUrl',
          label: 'Enlace del botón',
          type: 'text',
          defaultValue: buttonUrl,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'active',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Desmárcalo para dejar de mostrarlo sin borrarlo.' },
    },
    {
      type: 'collapsible',
      label: 'Programación (opcional)',
      admin: { position: 'sidebar', initCollapsed: true },
      fields: [
        {
          name: 'startsAt',
          label: 'Mostrar desde',
          type: 'date',
          admin: { description: 'Si lo dejas vacío, se muestra desde ya.' },
        },
        {
          name: 'endsAt',
          label: 'Mostrar hasta',
          type: 'date',
          admin: { description: 'Si lo dejas vacío, se muestra indefinidamente.' },
        },
      ],
    },
  ],
  }
}
