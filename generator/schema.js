/**
 * The blueprint: the answers, as data.
 *
 * The shape is small on purpose, and it is small because the extraction earned it. After
 * pulling the core out and writing nine modules, what actually varies from one business to
 * the next turned out to be three things — **identity, routes and labels** — plus the
 * palette. Everything else is the same site.
 *
 * Validation is here, pure and tested, because a blueprint with a typo has to fail in front
 * of a person, not halfway through writing files into a directory.
 */

export const MODULE_IDS = [
  'catalog',
  'schedule',
  'pricing',
  'team',
  'media',
  'reviews',
  'faq',
  'notices',
  'contact',
]

const SCHEMA_TYPES = ['Organization', 'LocalBusiness', 'Person', 'MusicGroup', 'NGO']

const HEX = /^#[0-9a-fA-F]{6}$/
const ID = /^[a-z][a-z0-9-]*$/
const ROUTE = /^\/[a-z0-9-/]*$/

function required(value, path, errors, what = 'falta') {
  if (value === undefined || value === null || value === '') errors.push(`${path}: ${what}`)
}

/**
 * Returns the list of problems, empty when the blueprint is usable.
 *
 * It checks shape, not taste: it will not stop anyone shipping an ugly palette, but it will
 * stop a site whose two modules claim the same route, which is the kind of thing that only
 * shows up as a mysterious 404 three days later.
 */
export function validateBlueprint(blueprint) {
  const errors = []
  const bp = blueprint ?? {}

  // ── identity
  const identity = bp.identity ?? {}
  required(identity.id, 'identity.id', errors)
  if (identity.id && !ID.test(identity.id)) {
    errors.push('identity.id: solo minúsculas, números y guiones (se usa en claves y rutas)')
  }
  required(identity.name, 'identity.name', errors)
  required(identity.url, 'identity.url', errors)
  if (identity.url && !/^https:\/\//.test(identity.url)) {
    errors.push('identity.url: tiene que ser https y la dirección donde responde de verdad')
  }
  if (identity.schemaType && !SCHEMA_TYPES.includes(identity.schemaType)) {
    errors.push(`identity.schemaType: uno de ${SCHEMA_TYPES.join(', ')}`)
  }

  // ── modules
  const modules = bp.modules ?? {}
  const enabled = Object.keys(modules)
  if (!enabled.length) errors.push('modules: hace falta al menos uno')

  const unknown = enabled.filter((id) => !MODULE_IDS.includes(id))
  if (unknown.length) errors.push(`modules: no existen ${unknown.join(', ')}`)

  const routes = []
  for (const [id, module] of Object.entries(modules)) {
    if (!MODULE_IDS.includes(id)) continue
    const labels = module?.labels ?? {}
    required(labels.singular, `modules.${id}.labels.singular`, errors)
    required(labels.plural, `modules.${id}.labels.plural`, errors)

    if (module?.route) {
      if (!ROUTE.test(module.route)) {
        errors.push(`modules.${id}.route: empieza por / y sin acentos ni mayúsculas`)
      }
      routes.push([id, module.route])
    }
  }

  // Two modules on one route is a 404 nobody understands three days later.
  const seen = new Map()
  for (const [id, route] of routes) {
    if (seen.has(route)) errors.push(`modules.${id}.route: "${route}" ya lo usa ${seen.get(route)}`)
    else seen.set(route, id)
  }

  // The contact module is what makes the legal pages non-negotiable, so it cannot be
  // half-configured: without a destination address a request is received by nobody.
  if (modules.contact && !identity.email && !bp.contact?.email) {
    errors.push('identity.email: hace falta para que las solicitudes lleguen a alguien')
  }

  // ── design
  const design = bp.design ?? {}
  const palette = design.palette ?? {}
  for (const key of ['ground', 'surface', 'ink', 'inkSoft', 'inkFaint', 'accent']) {
    required(palette[key], `design.palette.${key}`, errors)
    if (palette[key] && !HEX.test(palette[key])) {
      errors.push(`design.palette.${key}: un color en formato #rrggbb`)
    }
  }
  const fonts = design.fonts ?? {}
  required(fonts.display, 'design.fonts.display', errors)
  required(fonts.body, 'design.fonts.body', errors)

  // ── legal: the whole point of generating these pages is that they cannot be forgotten.
  const legal = bp.legal ?? {}
  required(legal.holder, 'legal.holder', errors, 'falta el titular de la web (RGPD)')

  return errors
}

/** The order the sections are painted in, defaulting to the order the modules were written. */
export function sectionOrder(blueprint) {
  const enabled = Object.keys(blueprint.modules ?? {}).filter((id) => MODULE_IDS.includes(id))
  const declared = blueprint.design?.sections ?? []
  const rest = enabled.filter((id) => !declared.includes(id))
  return [...declared.filter((id) => enabled.includes(id)), ...rest]
}
