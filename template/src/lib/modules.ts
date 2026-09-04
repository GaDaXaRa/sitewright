import type { ComponentType } from 'react'
import type { CollectionConfig, Where } from 'payload'
import type { SiteSetting } from '@/payload-types'
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
  /** El encabezado de su sección en la portada, en las palabras del cliente. */
  title: string
  /**
   * Cómo se llama en plural: «Selectas», «Bolos», «Tarifas».
   *
   * No es lo mismo que el título: en la portada la sección puede llamarse «La plataforma»
   * y su página seguir siendo «Selectas», que es lo que la gente escribe y busca.
   */
  plural?: string
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
  /**
   * Su página propia, si la tiene. Vive en el módulo, no la escribe el generador: era
   * JSX dentro de una cadena de texto, sin resaltado y sin comprobar hasta generarla.
   *
   * Se carga en diferido porque este manifiesto lo lee también la configuración de
   * Payload, y arrastrar componentes de React hasta el CLI hace que se atragante con la
   * primera hoja de estilos que encuentre.
   */
  Page?: () => Promise<{ default: ComponentType<ModulePageProps> }>
  /** Si escribe una página índice —y por tanto puede anunciarse y enlazarse—. */
  indexPage?: boolean
  /** Si cada documento tiene página propia, bajo qué ruta. */
  documentPages?: boolean
}

/**
 * Lo que recibe la página propia de un módulo.
 *
 * `items` va tipado como `never[]` a propósito: es lo que permite que un componente que
 * declara `items: Question[]` encaje en el registro sin perder su propio tipado por
 * dentro. Lo que se pierde es la comprobación de que lo que trae la base encaja con lo que
 * pinta —por eso la portada, donde están casi todas las llamadas, sigue generada—.
 */
export type ModulePageProps = {
  items: never[]
  settings: SiteSetting
  now: number
  /** El encabezado de la página, que es su <h1>. */
  title: string
  route: string
  options?: Record<string, unknown>
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
