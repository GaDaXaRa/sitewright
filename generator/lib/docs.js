/**
 * Lo que lee quien abre el repositorio de la web: su README y su guía.
 *
 * La prosa **no está aquí**: vive en `generator/templates/`, en markdown de verdad. Estuvo
 * dentro de plantillas literales de JavaScript, con cada comilla invertida escapada a mano,
 * y eso ya se subió roto una vez en `provision.js` y volvió a morder escribiendo el módulo
 * del horario. Además, así se lee con resaltado y se corrige una errata sin abrir un `.js`.
 *
 * Lo que queda aquí es lo único que no es prosa: qué secciones tiene esta web. La plantilla
 * la recibe quien llama, como en `siteSettings`, para que estas funciones sigan sin tocar
 * el disco y se puedan probar sin generar nada.
 */
import { fill } from './text.js'

/**
 * El README de la web, para la persona que la mantiene.
 *
 * Antes se quedaba el de la plantilla, que habla del chasis y apunta a `../core`, un
 * directorio que no existe al lado de un sitio generado: quien abría el repositorio de su
 * propia web leía la documentación de otra cosa.
 */
export function siteReadme(template, bp, modules) {
  return fill(
    template,
    {
      name: bp.identity.name,
      // Lleva dentro su propia línea en blanco, o no habría manera de que la ausencia de
      // eslogan no dejara un hueco en blanco al principio del fichero.
      tagline: bp.identity.tagline ? `${bp.identity.tagline}\n\n` : '',
      sections: Object.entries(modules)
        .filter(([, m]) => m.route)
        .map(([, m]) => `- **${m.labels?.plural ?? m.title}** — \`${m.route}\``)
        .join('\n'),
    },
    'el README de la web',
  )
}

/**
 * La guía de la web, para quien la abra después.
 *
 * Lo más probable es que sea otro agente, y llegará sin saber nada: ni que el esquema
 * necesita una migración, ni que desarrollo y producción son dos ramas, ni que el icono
 * tiene que conservar su dirección. Cada una de esas costó una tarde real en algún sitio, y
 * dejarlas escritas aquí es más barato que volver a pagarlas.
 */
export function siteGuide(template, bp, modules) {
  return fill(
    template,
    {
      name: bp.identity.name,
      id: bp.identity.id,
      modules: Object.entries(modules)
        .map(([id, m]) => `| ${m.labels?.plural ?? m.title ?? id} | \`${id}\` | ${m.route ?? '—'} |`)
        .join('\n'),
    },
    'la guía de la web',
  )
}
