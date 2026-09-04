import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { mediaCollection, usersCollection } from 'sitewright-core/payload'
import { mediaRevalidation } from './collections/hooks/revalidate'
import { SiteSettings } from './globals/SiteSettings'
import { site } from './site.config'
import { modules } from './site.modules'
import { moduleCollections } from './lib/modules'

/**
 * The tests create real bookings, and the hook that announces each one sends email.
 * Without this, every run of the suite wrote to the developer's real inbox.
 *
 * Vitest sets `NODE_ENV=test` on its own; `EMAIL_DISABLED=1` turns it off by hand where
 * that does not happen (the e2e tests boot a normal dev server).
 */
const IN_TESTS =
  process.env.NODE_ENV === 'test' ||
  Boolean(process.env.VITEST) ||
  process.env.EMAIL_DISABLED === '1'

// The two collections every site has, built by the core. Only what the client reads —
// here, the example in the alt-text help — belongs to this site.
const Users = usersCollection()
const Media = mediaCollection({
  // The example is written in the client's own words by the generator: an abstract one
  // ("una imagen del sitio") teaches nobody what a good alt text looks like.
  altExample: 'Una foto del equipo trabajando',
  revalidation: mediaRevalidation,
})

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: `— ${site.name}` },
  },
  // Cada módulo aporta la suya desde el manifiesto.
  collections: [Users, Media, ...moduleCollections(modules)],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  // The admin panel is in Spanish: the people who use it are not developers.
  i18n: {
    supportedLanguages: { es },
    fallbackLanguage: 'es',
  },
  // Email through Resend, only when there is an API key; otherwise Payload writes the
  // messages to the console, which is what development wants.
  //
  // **Never in the tests.** They create real bookings, and the notification hook was
  // mailing the developer's inbox on every run.
  email:
    process.env.RESEND_API_KEY && !IN_TESTS
      ? resendAdapter({
          defaultFromAddress: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          defaultFromName: process.env.EMAIL_FROM_NAME || site.name,
          apiKey: process.env.RESEND_API_KEY,
        })
      : undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Schema changes are applied through migrations (npm run migrate:create + migrate).
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    // The plugin is always present (so its client component lands in the importMap), but it
    // only stores in Vercel Blob when there is a token. In development, with no token,
    // `enabled: false` → images are written to local disk.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: {
        media: {
          // Without this, every image is requested from a Payload function that goes and
          // fetches it from the store: close to a second when cold, and the panel loads
          // many at once. The photos are public — they are on the site — so there is
          // nothing for Payload's access control to protect.
          disablePayloadAccessControl: true,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN || '',
    }),
  ],
})
