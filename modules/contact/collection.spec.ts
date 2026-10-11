import { expect, it } from 'vitest'
import { privacyPolicy } from 'sitewright-core'
import { contactCollection } from './collection'
const collection = contactCollection({ labels: { singular: 'Solicitud', plural: 'Solicitudes' } })
const prepare = collection.hooks!.beforeValidate![0]!
it('public submissions cannot arrive marked resolved or with internal notes', async () => {
  const data = await prepare({
    data: { status: 'resolved', processed: true, internalNotes: 'injected' },
    req: {},
    operation: 'create',
  } as never)
  expect(data).toMatchObject({ status: 'new', processed: false })
  expect(data).not.toHaveProperty('internalNotes')
})
it('keeps the legacy answered checkbox consistent with the new workflow', async () => {
  expect(
    await prepare({
      data: { status: 'resolved' },
      req: { user: { id: 1 } },
      operation: 'update',
    } as never),
  ).toMatchObject({ processed: true })
  expect(
    await prepare({
      data: { processed: false },
      req: { user: { id: 1 } },
      operation: 'update',
    } as never),
  ).toMatchObject({ status: 'new' })
})
it('shows old answered requests as resolved without changing their stored data', async () => {
  const field = collection.fields.find((field) => 'name' in field && field.name === 'status')
  if (!field || !('hooks' in field)) throw new Error('Missing workflow field')
  const read = field.hooks!.afterRead![0]!
  expect(await read({ value: null, siblingData: { processed: true } } as never)).toBe('resolved')
})
it('describes in the privacy policy every field a visitor can fill in', () => {
  // The policy lists the form's fields by name, and one it does not know is left out
  // silently. Adding a field here without teaching the core to name it would publish a
  // policy that hides data the site collects.
  const everything = contactCollection({
    labels: { singular: 'Solicitud', plural: 'Solicitudes' },
    kinds: { other: 'Otra cosa' },
    interestIn: 'pricing',
  })
  const workflow = ['status', 'internalNotes', 'consent', 'consentAt', 'processed']
  const visitor = everything.fields.flatMap((field) =>
    'name' in field && !workflow.includes(field.name) ? [field.name] : [],
  )
  const policy = (formFields: string[]) =>
    privacyPolicy(null, { modules: ['contact'], formFields })
      .flatMap((section) => section.paragraphs)
      .join(' ')

  expect(visitor.length).toBeGreaterThan(0)
  for (const name of visitor) expect(policy([name]), name).not.toBe(policy([]))
})
