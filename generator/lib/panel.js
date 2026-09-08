/**
 * El lado del panel: los ajustes del sitio y el contenido de ejemplo.
 *
 * Funciones puras: reciben el blueprint y devuelven el texto del fichero. No leen el disco
 * ni escriben nada — de eso se ocupa `generate.js`—, y por eso se pueden probar sin generar
 * una web entera.
 */

import { replaceOrDie } from './text.js'

// ── globals/SiteSettings.ts ─────────────────────────────────────────────────────────────

export function siteSettings(template, bp, modules, wirings) {
  const fields = wirings
    .filter((w) => w.settingsFields)
    .map((w) => w.settingsFields(modules[w.id], bp))
    .join('\n')

  return fields
    ? template.replace(
        "    // The generator appends each module's own settings here.",
        fields,
      )
    : template
}

// ── scripts/seed.ts ─────────────────────────────────────────────────────────────────────

/**
 * The copy the interview drafted for the settings — cover title, intro, section headings.
 *
 * It goes through the seed like everything else so the site is reproducible: regenerating
 * and reseeding gives the same site, and nothing has to be typed into the panel twice.
 */
/**
 * Los ajustes que se siembran, decididos en un solo sitio.
 *
 * Antes se concatenaban por trozos, y el blueprint podía escribir en `content.settings`
 * una clave que ya salía de `identity` —la ciudad, sin ir más lejos—: el resultado era un
 * objeto con la misma propiedad dos veces, que TypeScript rechaza. Ahora es un mapa, y lo
 * que se redactó en la entrevista pisa a lo que se dedujo, que es el orden correcto.
 */
export function seedSettings(bp) {
  const settings = new Map([['siteName', 'site.name']])
  const add = (key, value) => {
    if (value !== undefined && value !== null && value !== '') settings.set(key, JSON.stringify(value))
  }

  add('tagline', bp.identity.tagline)
  add('email', bp.identity.email)
  add('city', bp.identity.city)
  add('schemaType', bp.identity.schemaType)
  add('legalHolder', bp.legal.holder)
  add('legalId', bp.legal.id)
  add('legalAddress', bp.legal.address)

  for (const [key, value] of Object.entries(bp.content?.settings ?? {})) add(key, value)
  settings.set('analyticsConsent', 'true')

  return [...settings].map(([key, value]) => `${key}: ${value},`).join('\n      ')
}

export function seedScript(bp, modules, wirings) {
  // Written copy wins over the module's generic example: what the interview drafted for
  // this business is worth more than "Primera actividad", and it is what the client will
  // correct rather than write from scratch.
  const written = (id) => {
    const items = bp.content?.[id]
    if (!Array.isArray(items) || !items.length) return null
    const collection = wirings.find((w) => w.id === id)?.collectionSlug
    if (!collection) return null
    return `  const ${id}Count = await payload.count({ collection: '${collection}' })
  if (${id}Count.totalDocs === 0) {
    for (const data of ${JSON.stringify(items, null, 2).split('\n').join('\n    ')} as never[]) {
      await payload.create({ collection: '${collection}', data })
    }
    payload.logger.info('${items.length} en ${collection}: textos del blueprint')
  }`
  }

  const blocks = wirings
    .filter((w) => w.seed)
    .map((w) => written(w.id) ?? w.seed({ ...modules[w.id], city: bp.identity.city }, bp))
    .join('\n\n')

  return `import { getPayload } from 'payload'
import config from '../src/payload.config'
import { site } from '../src/site.config'

/**
 * Example content, so the site can be looked at before ${bp.identity.name} has written a
 * word — and so the client sees what a filled-in field is supposed to look like.
 *
 * Idempotent by collection: running it twice duplicates nothing. **Never against
 * production**: it leaves a dev-mode mark in \`payload_migrations\` that stops
 * \`payload migrate\` during the build.
 */
export const seed = async () => {
  const payload = await getPayload({ config: await config })

  const users = await payload.count({ collection: 'users' })
  if (users.totalDocs === 0) {
    const email = process.env.SEED_EMAIL || \`admin@\${site.id}.es\`
    const password = process.env.SEED_PASSWORD || 'cambiame-ahora'
    await payload.create({ collection: 'users', data: { email, password } })
    payload.logger.info(\`Usuario creado: \${email}\`)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      ${seedSettings(bp)}
    },
  })

${blocks}

  payload.logger.info('Seed completado.')
  process.exit(0)
}

await seed()
`
}
