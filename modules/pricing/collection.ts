import type { CollectionConfig, Field } from 'payload'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * What things cost: rates, passes, membership fees, booking prices.
 *
 * The one rule that matters: **a price that is not closed is "a convenir"**, and it is not
 * published as an Offer. A search engine drops an incomplete offer anyway, and writing a
 * number nobody agreed to is worse than saying there is none.
 */
export function pricingCollection({
  labels,
  route,
  linkedTo,
}: {
  labels: { singular: string; plural: string }
  route: string
  /** The catalogue collection each price belongs to, when the site has one. */
  linkedTo?: 'catalog'
}): CollectionConfig {
  const revalidation = revalidator(route)

  return {
    slug: 'pricing',
    labels,
    admin: {
      useAsTitle: 'name',
      defaultColumns: ['name', 'price', 'period', 'active'],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: 'order',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      {
        name: 'priceKind',
        label: 'Tipo de precio',
        type: 'select',
        defaultValue: 'fixed',
        options: [
          { label: 'Precio cerrado', value: 'fixed' },
          { label: 'A convenir', value: 'agreed' },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'price',
            label: 'Precio (€)',
            type: 'number',
            admin: { width: '50%', condition: (data) => data?.priceKind !== 'agreed' },
          },
          {
            name: 'period',
            label: 'Periodo',
            type: 'text',
            admin: {
              width: '50%',
              placeholder: 'al mes · por sesión · bono de 10',
              condition: (data) => data?.priceKind !== 'agreed',
            },
          },
        ],
      },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      {
        name: 'includes',
        label: 'Qué incluye',
        type: 'array',
        labels: { singular: 'Punto', plural: 'Puntos' },
        fields: [{ name: 'text', label: 'Punto', type: 'text', required: true }],
      },
      ...(linkedTo
        ? ([
            {
              name: 'belongsTo',
              label: 'Pertenece a',
              type: 'relationship',
              relationTo: linkedTo,
              admin: {
                description:
                  'Enlaza la tarifa con lo que se ofrece. Así los precios salen en el marcado sin emparejar por nombre, que es lo que los hace divergir.',
              },
            },
          ] as Field[])
        : []),
      {
        name: 'highlighted',
        label: 'Destacada',
        type: 'checkbox',
        defaultValue: false,
        admin: { position: 'sidebar' },
      },
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
