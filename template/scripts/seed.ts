import { getPayload } from 'payload'
import config from '../src/payload.config'
import { site } from '../src/site.config'

/**
 * The minimum a site needs to be opened: someone who can log in, and settings to edit.
 * Each module the generator adds appends its own example content here.
 *
 * Run with `npm run seed`. **Never against production**: it leaves a dev-mode mark in
 * `payload_migrations` that stops `payload migrate` during the build.
 */
export const seed = async () => {
  const payload = await getPayload({ config: await config })

  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs === 0) {
    const email = process.env.SEED_EMAIL || `admin@${site.id}.es`
    const password = process.env.SEED_PASSWORD || 'cambiame-ahora'
    await payload.create({ collection: 'users', data: { email, password } })
    payload.logger.info(`Usuario creado: ${email}`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: { siteName: site.name, analyticsConsent: true },
  })

  payload.logger.info('Seed completado.')
  process.exit(0)
}

await seed()
