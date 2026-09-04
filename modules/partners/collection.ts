import type { CollectionConfig } from 'payload'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * Quién apoya, patrocina o programa: la tira de logos.
 *
 * El nombre es obligatorio y el logo no, al revés de lo que parece. Un logo sin nombre no
 * se puede describir a quien no lo ve —y la auditoría lo caza—, mientras que un
 * colaborador anunciado antes de tener su imagen es un caso normal mientras se recopilan.
 */
export function partnersCollection({
  labels,
}: {
  labels: { singular: string; plural: string }
}): CollectionConfig {
  const revalidation = revalidator()

  return {
    slug: 'partners',
    labels,
    admin: {
      useAsTitle: 'name',
      defaultColumns: ['name', 'order', 'active'],
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
        admin: { description: 'Es lo que lee quien no ve el logo, así que ponlo completo.' },
      },
      {
        name: 'logo',
        label: 'Logo',
        type: 'upload',
        relationTo: 'media',
        admin: {
          description:
            'Fondo transparente (PNG o SVG) y con margen. Se sirve a la misma altura que los demás, así que uno muy apaisado se verá pequeño.',
        },
      },
      {
        name: 'treatment',
        label: '¿Cómo es este logo?',
        type: 'select',
        defaultValue: 'color',
        options: [
          { label: 'A color — se deja tal cual', value: 'color' },
          { label: 'Tiene un recuadro de fondo', value: 'boxed' },
          { label: 'De un solo color oscuro, con fondo transparente', value: 'dark' },
          { label: 'De un solo color claro, con fondo transparente', value: 'light' },
        ],
        admin: {
          description:
            'Sirve para que todos se vean parejos sobre el fondo de la web. No modifica el fichero: si te equivocas, cámbialo y ya está.',
        },
      },
      {
        name: 'url',
        label: 'Enlace',
        type: 'text',
        admin: { description: 'Su web, si la tiene. Se abre en una pestaña nueva.' },
      },
      {
        name: 'order',
        label: 'Orden',
        type: 'number',
        defaultValue: 0,
        admin: { position: 'sidebar', description: 'Se muestran de menor a mayor número.' },
      },
      {
        name: 'active',
        label: 'Activo (visible en la web)',
        type: 'checkbox',
        defaultValue: true,
        admin: { position: 'sidebar' },
      },
    ],
  }
}
