import { siteGraph } from 'sitewright-core'
import { SITE_URL } from './site'

/**
 * El grafo de esta web, atado a su dirección.
 *
 * La lógica vive en el núcleo —es la misma en todas las webs, y allí se prueba y se muta—;
 * lo único de aquí es a qué dirección pertenece. Se ata una vez para que los módulos sigan
 * importando `ORG_ID` y `buildHomeJsonLd` sin saber de dónde salen.
 */
export const { ORG_ID, organizationNode, websiteNode, breadcrumbNode, buildHomeJsonLd } =
  siteGraph(SITE_URL)
