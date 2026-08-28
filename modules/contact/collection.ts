import type { CollectionConfig, Field } from 'payload'
import { APIError } from 'payload'
import { sendRequestEmails } from './emails'
import {
  countSince,
  exceedsGlobalCeiling,
  IP_WINDOW_MS,
  recordSubmission,
  requestIp,
  TOO_MANY_ERROR,
} from 'sitewright-core'

/**
 * Recent submissions per IP. Kept in memory on purpose: the IP is personal data and there
 * is no need to store it to slow down someone insisting. See `lib/rateLimit.ts`.
 */
const submissionsByIp = new Map<string, number[]>()

// Without this, a burst from many different IPs would leave one entry per IP.
function purge(now: number) {
  if (submissionsByIp.size < 500) return
  for (const [ip, marks] of submissionsByIp) {
    if (marks.every((t) => now - t >= IP_WINDOW_MS)) submissionsByIp.delete(ip)
  }
}

/**
 * Requests arriving from the public form: bookings, enquiries, enrolments.
 *
 * Everything that protects it is the same everywhere and lives in the core (honeypot,
 * content checks, per-IP and global brakes). What changes per business is the vocabulary:
 * what kinds of request there are, and whether a date or a city is worth asking for.
 *
 * **Consent is not decoration**: without it the submission is refused, and the date it was
 * given is stored, because that is what the RGPD asks you to be able to show.
 */
export function contactCollection({
  labels,
  kinds,
  askDate = true,
  askCity = true,
  interestIn,
}: {
  labels: { singular: string; plural: string }
  /** The kinds of request, in the client's words. Empty means do not ask. */
  kinds?: Record<string, string>
  askDate?: boolean
  askCity?: boolean
  /** A collection whose items the form can point at ("me interesa esto"). */
  interestIn?: 'catalog' | 'pricing'
}): CollectionConfig {
  return {
  slug: 'requests',
  labels,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'processed', 'createdAt'],
    group: labels.plural,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        // Only anonymous submissions from the public form are filtered; from the panel (an
        // authenticated user) anything can be created.
        if (operation !== 'create' || req.user) return data

        // 1) Honeypot: an invisible field a person never fills in, but bots do.
        if (data?.website) {
          throw new APIError('No se ha podido enviar el formulario.', 400)
        }

        // 2) Minimum content checks, to drop junk.
        const name = String(data?.name ?? '').trim()
        const email = String(data?.email ?? '').trim()
        if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new APIError('Revisa el nombre y el email.', 400)
        }

        // 3) Links in the message: the usual shape of contact-form spam.
        if (/https?:\/\/|\[url=|<a\s/i.test(String(data?.message ?? ''))) {
          throw new APIError('No se permiten enlaces en el mensaje.', 400)
        }

        // 4) Consent is not decoration: without it there is no legal basis to store the
        //    request or to reply to it, so the submission is refused rather than kept.
        if (!data?.consent) {
          throw new APIError('Hay que aceptar la política de privacidad para enviar el formulario.', 400)
        }
        data.consentAt = new Date().toISOString()

        // 5) Submission pace. Last, because the global ceiling queries the database and the
        //    cheap checks should reject first. Each request sends two emails, one of them to
        //    the address typed in the form: with no brake, the site is a way to mail third
        //    parties (see lib/rateLimit.ts).
        const now = Date.now()
        const ip = requestIp(req.headers)

        if (ip) {
          const { allowed, marks } = recordSubmission(submissionsByIp.get(ip), now)
          if (!allowed) throw new APIError(TOO_MANY_ERROR, 429)
          submissionsByIp.set(ip, marks)
          purge(now)
        }

        // `req` is passed so the count reads inside the running transaction, not another.
        const recent = await req.payload.count({
          collection: 'requests',
          where: { createdAt: { greater_than: countSince(now) } },
          req,
        })
        if (exceedsGlobalCeiling(recent.totalDocs)) {
          req.payload.logger.warn(
            `[requests] hourly ceiling reached (${recent.totalDocs}); submission rejected.`,
          )
          throw new APIError(TOO_MANY_ERROR, 429)
        }

        return data
      },
    ],
    afterChange: [sendRequestEmails],
  },
  access: {
    // Anyone may submit the form...
    create: () => true,
    // ...but only authenticated users can read, edit or delete.
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Teléfono', type: 'text' },
    ...(kinds && Object.keys(kinds).length
      ? ([
          {
            name: 'kind',
            label: 'Tipo',
            type: 'select',
            options: Object.entries(kinds).map(([value, label]) => ({ value, label })),
          },
        ] as Field[])
      : []),
    // `interestIn` names a collection ('catalog' | 'pricing') that only exists in the
    // generated project when that module is enabled — Payload's own CollectionSlug type
    // for this specific site won't know about it otherwise, so the cast goes through
    // `unknown`: relationTo is only ever set from this same module list, never from input.
    ...(interestIn
      ? ([
          {
            name: 'interest',
            label: 'Le interesa',
            type: 'relationship',
            relationTo: interestIn,
            admin: { description: 'Lo que eligió en el formulario.' },
          },
        ] as unknown as Field[])
      : []),
    ...(askCity ? ([{ name: 'city', label: 'Ciudad', type: 'text' }] as Field[]) : []),
    ...(askDate
      ? ([
          {
            name: 'eventDate',
            label: 'Fecha',
            type: 'date',
            admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } },
          },
        ] as Field[])
      : []),
    { name: 'message', label: 'Mensaje', type: 'textarea' },
    {
      name: 'consent',
      label: 'Aceptó la política de privacidad',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      // Stored with the date because that is what the RGPD asks you to be able to show if
      // the consent is ever disputed.
      name: 'consentAt',
      label: 'Fecha del consentimiento',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, date: { displayFormat: 'd MMM yyyy HH:mm' } },
    },
    {
      name: 'processed',
      label: 'Contestada',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Marca esta casilla cuando hayáis contestado.',
      },
    },
  ],
  }
}
