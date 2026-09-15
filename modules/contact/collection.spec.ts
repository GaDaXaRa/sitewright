import { expect, it } from 'vitest'
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
