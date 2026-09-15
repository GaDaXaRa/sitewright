import { expect, it } from 'vitest'
import { contactLink } from '@/lib/contactLink'
it('preserves existing parameters and the form anchor', () => {
  const link = new URL(contactLink('/?origen=horario#contacto', 'a&b'), 'https://example.test')
  expect(link.hash).toBe('#contacto')
  expect(link.searchParams.get('tarifa')).toBe('a&b')
  expect(link.searchParams.get('origen')).toBe('horario')
})
