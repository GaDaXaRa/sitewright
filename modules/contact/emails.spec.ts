import { expect, it, vi } from 'vitest'
import { sendRequestEmails } from './emails'
it('attempts both notifications even when one delivery fails', async () => {
  const sendEmail = vi.fn().mockRejectedValue(new Error('mail unavailable'))
  const req = {
    payload: {
      findGlobal: vi.fn().mockResolvedValue({ email: 'owner@example.test', siteName: 'Example' }),
      sendEmail,
      logger: { error: vi.fn(), warn: vi.fn() },
    },
  }
  const doc = { id: 1, name: 'María', email: 'visitor@example.test' }
  expect(await sendRequestEmails({ doc, req, operation: 'create' } as never)).toEqual(doc)
  expect(sendEmail).toHaveBeenCalledTimes(2)
  expect(req.payload.logger.error).toHaveBeenCalledTimes(2)
})
