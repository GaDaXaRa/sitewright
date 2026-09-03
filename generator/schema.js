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
  'about',
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

/**
 * Modules that are a section and nothing else: they live in the settings, so they have no
 * collection to label in singular and plural — what they need is the heading they show.
 */
const WITHOUT_COLLECTION = ['about']

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
  // El dominio puede no existir todavía: durante la semana en que se construye la web, lo
  // normal es que nadie lo haya comprado. Sin él, el sitio usa la dirección que le da
  // Vercel, que es real desde el primer despliegue.
  if (identity.url && !/^https:\/\//.test(identity.url)) {
    errors.push('identity.url: tiene que ser https y la dirección donde responde de verdad')
  }
  if (identity.url && /\/$/.test(identity.url)) {
    errors.push('identity.url: sin barra final, o se concatenarán rutas con doble barra')
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
    if (WITHOUT_COLLECTION.includes(id)) {
      required(module?.title, `modules.${id}.title`, errors, 'falta el título de la sección')
    } else {
      const labels = module?.labels ?? {}
      required(labels.singular, `modules.${id}.labels.singular`, errors)
      required(labels.plural, `modules.${id}.labels.plural`, errors)
    }

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

  // ── content: optional, and checked only for the shape the seed expects.
  const content = bp.content ?? {}
  for (const [id, items] of Object.entries(content)) {
    if (id === 'settings') continue
    if (!MODULE_IDS.includes(id)) errors.push(`content.${id}: no es un módulo`)
    else if (!modules[id]) errors.push(`content.${id}: el módulo no está activo`)
    else if (!Array.isArray(items)) errors.push(`content.${id}: tiene que ser una lista`)
  }

  // ── legal: the whole point of generating these pages is that they cannot be forgotten.
  const legal = bp.legal ?? {}
  required(legal.holder, 'legal.holder', errors, 'falta el titular de la web (RGPD)')

  return errors
}

/**
 * Whether the copy in the blueprint is a draft nobody has approved yet.
 *
 * It matters because drafted copy reads exactly like written copy, and a site can go live
 * with three paragraphs an assistant made up. The audit warns while this is true.
 */
export function isDraft(blueprint) {
  return Boolean(blueprint.content) && blueprint.contentStatus !== 'revisado'
}

/** The order the sections are painted in, defaulting to the order the modules were written. */
export function sectionOrder(blueprint) {
  const enabled = Object.keys(blueprint.modules ?? {}).filter((id) => MODULE_IDS.includes(id))
  const declared = blueprint.design?.sections ?? []
  const rest = enabled.filter((id) => !declared.includes(id))
  return [...declared.filter((id) => enabled.includes(id)), ...rest]
}

/**
 * Todo lo que un módulo puede decirle al generador sobre cómo se monta.
 *
 * Existe porque un cableado es un objeto suelto de veintitantas claves opcionales: una
 * errata no rompe nada, simplemente hace que esa parte del sitio no se escriba, y eso ya
 * pasó —una web salió a medias sin un solo error—. Añadir una clave aquí sin enseñarle al
 * generador a leerla no sirve de nada, así que la lista es el contrato.
 */
export const WIRING_KEYS = [
  'id',
  'variable',
  'collectionSlug',
  'collectionImport',
  'collectionCall',
  'settingsFields',
  'dataQuery',
  'dataPick',
  'sectionImport',
  'sectionRender',
  'renders',
  'overlay',
  'overlayRender',
  'jsonldImport',
  'jsonldNodes',
  'jsonldFirst',
  'llmsImport',
  'llmsSection',
  'llmsSpread',
  'navLink',
  'navCta',
  'indexPage',
  'detailPage',
  'seed',
]

/** Un cableado que el generador no entiende del todo escribe medio sitio en silencio. */
export function validateWiring(id, wiring) {
  const errors = []
  if (!wiring || typeof wiring !== 'object') return [`modules/${id}/wiring.js: no exporta un objeto \`wiring\``]

  if (wiring.id !== id) errors.push(`modules/${id}/wiring.js: su id dice "${wiring.id}"`)
  // `variable: null` es una declaración: este módulo no ata ningún dato. Lo que no vale es
  // no decir nada, porque entonces no se sabe si falta o si sobra.
  if (!('variable' in wiring)) {
    errors.push(`modules/${id}/wiring.js: falta \`variable\` (null si no ata ningún dato)`)
  }
  if (wiring.dataQuery && typeof wiring.variable !== 'string') {
    errors.push(`modules/${id}/wiring.js: consulta datos, así que \`variable\` tiene que nombrarlos`)
  }

  for (const key of Object.keys(wiring)) {
    if (!WIRING_KEYS.includes(key)) {
      errors.push(`modules/${id}/wiring.js: "${key}" no es una clave que el generador lea`)
    }
  }
  // Una consulta cuyo resultado nadie recoge es trabajo contra la base de datos que no
  // llega a ninguna página.
  if (wiring.dataPick && !wiring.dataQuery) {
    errors.push(`modules/${id}/wiring.js: \`dataPick\` sin \`dataQuery\``)
  }
  if (wiring.collectionCall && !wiring.collectionImport) {
    errors.push(`modules/${id}/wiring.js: \`collectionCall\` sin \`collectionImport\``)
  }
  return errors
}
