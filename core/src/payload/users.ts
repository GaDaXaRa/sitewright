import type { CollectionConfig } from 'payload'

/**
 * The panel's users.
 *
 * The one thing that is not Payload's default is the session cookie: Payload does not mark
 * it `secure` on its own, so the admin session travelled without that attribute and a
 * single http:// request to the domain would send it in the clear, before the redirect to
 * https could save it. Development is served over http, where marking it would break login.
 */
export function usersCollection(slug = 'users'): CollectionConfig {
  return {
    slug,
    labels: { singular: 'Usuario', plural: 'Usuarios' },
    admin: { useAsTitle: 'email' },
    auth: {
      cookies: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      },
    },
    fields: [],
  }
}
