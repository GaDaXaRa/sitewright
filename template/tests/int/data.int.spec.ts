import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn(), findGlobal: vi.fn(), getPayload: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@/payload.config', () => ({ default: {} }))
vi.mock('@/site.modules', () => ({
  modules: [{ id: 'catalog', variable: 'catalog', query: { collection: 'catalog' } }],
}))
import { loadSettings, loadSiteContent } from '@/lib/data'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getPayload.mockResolvedValue({ find: mocks.find, findGlobal: mocks.findGlobal })
  mocks.findGlobal.mockResolvedValue({ id: 1, siteName: 'Ejemplo' })
  mocks.find.mockResolvedValue({ docs: [{ id: 42, title: 'Publicada' }] })
})

it('returns published content when the CMS responds', async () => {
  expect(await loadSiteContent()).toMatchObject({
    settings: { siteName: 'Ejemplo' },
    catalog: [{ id: 42 }],
  })
})

it('does not turn a failed collection read into a cacheable empty site', async () => {
  const error = new Error('database unavailable')
  mocks.find.mockRejectedValue(error)
  await expect(loadSiteContent()).rejects.toBe(error)
})

it('does not replace site identity with defaults when settings cannot be read', async () => {
  const error = new Error('settings unavailable')
  mocks.findGlobal.mockRejectedValue(error)
  await expect(loadSettings()).rejects.toBe(error)
})
