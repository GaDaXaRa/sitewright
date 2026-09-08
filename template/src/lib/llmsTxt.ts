import type { SiteSetting } from '@/payload-types'
import { llmsTxt, type LlmsSection } from 'sitewright-core'
import { SITE_URL } from './site'

/**
 * El resumen que leen los asistentes, atado a la dirección de esta web.
 *
 * Lo que escribe el fichero vive en el núcleo. Lo que se queda aquí es el contrato con los
 * módulos, y se queda porque **lleva los ajustes de esta web**: la presentación, por
 * ejemplo, es un campo que el generador añade por sitio, y un tipo del paquete no lo
 * conocería.
 */
export type { LlmsSection }

/**
 * Lo que un módulo necesita para escribir su parte, con una sola firma.
 *
 * Antes cada uno pedía lo suyo —uno la ruta, otro el reloj, otro dos encabezados— y no
 * había forma de llamarlos en un bucle. `options` es lo específico del blueprint.
 */
export type LlmsContext = {
  title: string
  route?: string
  now: number
  settings: SiteSetting | null | undefined
  options?: Record<string, unknown>
}

export const buildLlmsTxt = llmsTxt(SITE_URL)
