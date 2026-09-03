import type { CollectionConfig } from 'payload'
import { revalidator } from '@/collections/hooks/revalidate'

/**
 * Frequently asked questions: the module that pays off most in GEO, because it answers in
 * the words people actually use when they ask.
 */
export function faqCollection({
  labels,
  route,
}: {
  labels: { singular: string; plural: string }
  route: string
}): CollectionConfig {
  const revalidation = revalidator(route)

  return {
    slug: 'faqs',
    labels,
    admin: {
      useAsTitle: 'question',
      defaultColumns: ['question', 'order', 'active'],
      group: 'Contenido',
    },
    access: { read: () => true },
    defaultSort: 'order',
    hooks: { afterChange: [revalidation.afterChange], afterDelete: [revalidation.afterDelete] },
    fields: [
      { name: 'question', label: 'Pregunta', type: 'text', required: true },
      { name: 'answer', label: 'Respuesta', type: 'textarea', required: true },
      {
        name: 'order',
        label: 'Orden',
        type: 'number',
        defaultValue: 0,
        admin: { position: 'sidebar', description: 'Se muestran de menor a mayor número.' },
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
