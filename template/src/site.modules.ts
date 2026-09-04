import type { SiteSetting } from '@/payload-types'
import type { SiteModule } from '@/lib/modules'

/**
 * Los módulos de esta web. **Lo escribe el generador**: es el único fichero que cambia
 * cuando se añade o se quita una sección.
 *
 * Sin ninguno, la web sigue en pie: portada, páginas legales, panel, sitemap y `llms.txt`.
 */
export const modules: SiteModule[] = []

/**
 * La forma de lo que devuelve el cargador, con los tipos de cada módulo.
 *
 * Existe para que la portada siga comprobándose llamada por llamada: un registro genérico
 * de componentes obligaría a tipar sus props como `any`, y esa comprobación vale más que
 * el bucle que se ahorraría.
 */
export type Content = {
  settings: SiteSetting
  now: number
}
