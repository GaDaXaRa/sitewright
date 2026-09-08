/**
 * Qué es de la fábrica y qué es de cada web.
 *
 * El generador copia `template/` y `modules/` tal cual, y luego reescribe un puñado de
 * ficheros con lo que dice el blueprint. Esa frontera vivía sólo dentro de `generate.js`,
 * y por eso una corrección en un fichero copiado —una componente de un módulo, la guía
 * del panel— se quedaba en el repositorio para siempre: nadie sabía decir qué webs se la
 * estaban perdiendo. Declarada aquí, `doctor` la mide y `sync-site` la aplica.
 */

/** Del chasis no viaja lo que npm, Next o Payload escriben por su cuenta. */
export const TEMPLATE_SKIP =
  /node_modules|\.next|payload-types\.ts|tsconfig\.tsbuildinfo|package-lock\.json/

/** De un módulo no viaja lo que es del generador, no del sitio. */
export const MODULE_SKIP = /wiring\.js|package\.json|section\.css/

/**
 * Lo que el generador escribe a partir del blueprint: es de cada web, y compararlo con la
 * plantilla sólo diría que Selectas no se llama «Plantilla».
 *
 * La lista la vigila una prueba contra el propio `generate.js`: si mañana escribe un
 * fichero más y no aparece aquí, `sync-site` lo pisaría con el de la plantilla y borraría
 * el contenido de un cliente.
 */
export const WRITTEN = [
  '.env.example',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'public/icon.svg',
  'scripts/seed.ts',
  'src/app/(frontend)/layout.tsx',
  'src/app/(frontend)/page.tsx',
  'src/app/(frontend)/styles.css',
  'src/globals/SiteSettings.ts',
  'src/site.config.ts',
  'src/site.modules.ts',
  'sitewright.json',
]

/**
 * Lo que la web se hace a sí misma después de nacer.
 *
 * Los iconos los rehace `scripts/icons.mjs` a partir del que sube la clienta al panel, y
 * `next-env.d.ts` lo reescribe Next en cada arranque.
 */
export const PER_SITE = [
  // El sello de `sync-site`: qué le entregó la fábrica a esta web. Es de aquí y de ahora,
  // así que ni se compara con la plantilla ni se copia de una web a otra.
  '.sitewright-sync.json',
  'next-env.d.ts',
  'public/apple-icon.png',
  'public/favicon.ico',
  'public/icon-192.png',
  'public/icon-512.png',
]

/** Si un fichero del chasis viaja igual a todas las webs. */
export function isShared(relativePath) {
  return !WRITTEN.includes(relativePath) && !PER_SITE.includes(relativePath)
}
