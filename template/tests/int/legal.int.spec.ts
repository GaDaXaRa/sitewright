import { expect, it } from 'vitest'
import type { CollectionConfig } from 'payload'
import { legalProfile } from '@/lib/legal'

/**
 * The legal pages describe the site from its manifest. What matters is that the form's
 * fields reach them by name — layout fields have none and say nothing about data — and
 * that a site without a form says it has none instead of borrowing someone else's.
 */
it('names the modules and the fields of the contact form', () => {
  const requests = {
    slug: 'requests',
    fields: [
      { name: 'name', type: 'text' },
      { type: 'row', fields: [] },
      { name: 'message', type: 'textarea' },
    ],
  } as unknown as CollectionConfig

  expect(
    legalProfile([
      { id: 'media', variable: 'embeds', title: 'Sesiones' },
      { id: 'contact', variable: null, title: 'Escríbenos', collection: requests },
    ]),
  ).toEqual({ modules: ['media', 'contact'], formFields: ['name', 'message'] })
})

it('reports no form fields on a site without a form', () => {
  expect(legalProfile([{ id: 'about', variable: null, title: 'Sobre mí' }])).toEqual({
    modules: ['about'],
    formFields: [],
  })
})
