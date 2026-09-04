import type { CollectionConfig, Where } from 'payload'
import type { LlmsContext, LlmsSection } from './llmsTxt'

/**
 * Qué módulos tiene esta web, como datos.
 *
 * Antes cada módulo se enchufaba escribiendo a mano en seis ficheros distintos —la
 * configuración de Payload, el cargador, la portada, el sitemap, `llms.txt` y los
 * estilos— y añadir uno a una web ya desplegada eran quince ediciones. Ahora el generador
 * escribe un solo fichero, `src/site.modules.ts`, y todo lo que se puede recorrer en un
 * bucle lo recorre.
 *
 * Lo que no está aquí, a propósito: los componentes de sección. Un registro de componentes
 * heterogéneos obliga a tipar sus props como `any`, y hoy cada llamada de la portada se
 * comprueba una por una. Esa comprobación vale más que el bucle.
 */
export type ModuleQuery = {
  collection: string
  where?: Where
  limit?: number
  sort?: string
  depth?: number
}

export type SiteModule = {
  /** El del directorio en `modules/`. */
  id: string
  /**
   * Con qué nombre viaja su contenido: `faqs`, `team`, `partners`.
   *
   * `null` es una declaración, no un olvido: la presentación y el formulario no atan
   * ningún dato, y distinguir «no lo dice» de «lo dice vacío» es lo que hace útil al
   * contrato.
   */
  variable: string | null
  /** El encabezado que ve una persona, en las palabras del cliente. */
  title: string
  /** Dónde vive su página, si tiene. */
  route?: string
  /** La colección de Payload, cuando el módulo guarda algo. */
  collection?: CollectionConfig
  /** Qué se le pide a la base. Sin esto, el módulo no lee nada. */
  query?: ModuleQuery
  /**
   * Elegir uno entre lo consultado: el aviso que toca hoy, y no los diez que hay.
   * Lo que devuelve sustituye a la lista bajo `variable`.
   */
  pick?: (docs: Record<string, unknown>[], now: number) => unknown
  /** Su aportación a `/llms.txt`, si tiene algo que contar. */
  llms?: (items: never[], ctx: LlmsContext) => LlmsSection | LlmsSection[]
  /** Lo específico del blueprint que su sección necesita, como el segundo encabezado. */
  options?: Record<string, unknown>
  /** Si escribe una página índice —y por tanto puede anunciarse y enlazarse—. */
  indexPage?: boolean
  /** Si cada documento tiene página propia, bajo qué ruta. */
  documentPages?: boolean
}

/** Los que guardan algo, que son los que Payload tiene que conocer. */
export function moduleCollections(modules: SiteModule[]): CollectionConfig[] {
  return modules.map((m) => m.collection).filter((c): c is CollectionConfig => Boolean(c))
}

/**
 * Las secciones con página propia que además tienen algo dentro.
 *
 * Es la única pregunta que hacen el menú y el sitemap, y la hacen igual: anunciar una
 * página que dice «todavía no hay nada publicado» es pedirle a un buscador que clasifique
 * la web como fina, y enlazarla es mandar allí a una persona para nada.
 */
export function publishedSections(
  modules: SiteModule[],
  content: Record<string, unknown>,
): SiteModule[] {
  return modules.filter((m) => {
    if (!m.indexPage || !m.route) return false
    const items = m.variable ? content[m.variable] : null
    return Array.isArray(items) && items.length > 0
  })
}
