import { describe, it, expect } from 'vitest'
import type { PayloadRequest } from 'payload'
import { activeOrSignedIn } from '@/collections/access'

const pide = (user: unknown) => activeOrSignedIn({ req: { user } as PayloadRequest })

// La página sólo pintaba lo activo, pero la API servía también lo desactivado: una reseña
// retirada seguía en `/api/reviews` para quien la pidiera.
describe('Lo que se desactiva en el panel', () => {
  it('no sale por la API a quien no ha entrado', () => {
    expect(pide(null)).toEqual({ active: { equals: true } })
  })

  it('sigue viéndose en el panel, que es donde se vuelve a activar', () => {
    expect(pide({ id: 1, email: 'a@b.es' })).toBe(true)
  })
})
