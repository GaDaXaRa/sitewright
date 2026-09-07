/**
 * La guía, en un navegador, sin levantar el panel.
 *
 * Es la única parte del núcleo cuyo trabajo es verse bien, y comprobarlo requería un
 * Payload en marcha con su base de datos y su contraseña. Esto la pinta con la misma
 * componente, las variables de verdad de Payload y el mismo hueco que le deja la
 * plantilla —el nav de 275px y cero relleno vertical, que es de donde salen casi todos
 * los problemas de márgenes—. Escribe `core/.preview/`, que no se versiona.
 *
 * Uso: `npm run preview:guide` y abrir esa carpeta con un servidor estático.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Guide } from '../dist/ui/Guide.js'

const OUT = new URL('../.preview/', import.meta.url)
const COLORS = new URL('../node_modules/@payloadcms/ui/dist/scss/colors.scss', import.meta.url)

/** Las variables de Payload, sacadas de su propia hoja: inventarlas sería mentirse. */
function themeVariables() {
  const scss = readFileSync(COLORS, 'utf8')
  const base = scss.match(/--color-base-\d+: rgb\([^)]*\);/g) ?? []
  const elevations = scss.match(/--theme-elevation-\d+: var\(--color-base-\d+\);/g) ?? []
  const [light, dark] = [elevations.slice(0, 21), elevations.slice(21, 42)]
  const derived = `
    --theme-bg: var(--theme-elevation-0);
    --theme-text: var(--theme-elevation-800);`

  return `:root{
${base.join('\n')}
${light.join('\n')}${derived}
--base-px: 20; --base-body-size: 13;
--base: calc((var(--base-px) / var(--base-body-size)) * 1rem);
--gutter-h: calc(var(--base) * 3);
--spacing-view-bottom: var(--gutter-h);
--app-header-height: calc(var(--base) * 2.8);
--style-radius-m: 4px;
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
html[data-theme=dark]{
${dark.join('\n')}${derived}
}
@media (max-width: 1024px){ :root{ --gutter-h: calc(var(--base) * 2) } }
@media (max-width: 768px){ :root{ --gutter-h: calc(var(--base) * .8); --spacing-view-bottom: calc(var(--base) * 2) } }`
}

// Una web de ejemplo con secciones renombradas: si la guía sólo se mira con los nombres
// por defecto, no se ve que el texto se adapta a los de cada clienta.
const SECTIONS = [
  { id: 'about', title: 'Selectas' },
  { id: 'team', title: 'Selecta', plural: 'Las Selectas' },
  { id: 'schedule', title: 'Fecha', plural: 'Agenda' },
  { id: 'media', title: 'Sesión', plural: 'Sesiones' },
  { id: 'catalog', title: 'Qué hacemos' },
  { id: 'partners', title: 'Colabora', plural: 'Colaboran' },
  { id: 'faq', title: 'Pregunta', plural: 'Preguntas' },
  { id: 'contact', title: 'Solicitud', plural: 'Solicitudes' },
]

const body = renderToStaticMarkup(
  React.createElement(Guide, { siteName: 'Selectas', sections: SECTIONS, support: null }),
)

const nav = [...SECTIONS.map((s) => s.plural ?? s.title), 'Fotos']
  .map((name) => `<span>${name}</span>`)
  .join('')

mkdirSync(OUT, { recursive: true })
writeFileSync(
  new URL('index.html', OUT),
  `<!doctype html><html data-theme="light"><head><meta charset="utf-8"><title>Guía</title>
<style>${themeVariables()}
html { font-size: 13px; }
body { margin: 0; font-family: var(--font-body); background: var(--theme-bg); color: var(--theme-text); }
.shell { min-height: 100vh; display: grid; grid-template-columns: 275px auto; }
.shell nav { padding: 1.5rem; font-size: .95rem; color: var(--theme-elevation-600);
  background: var(--theme-elevation-50); border-right: 1px solid var(--theme-elevation-100); }
.shell nav span { display: block; padding: .3rem 0; }
.wrap { min-width: 0; width: 100%; }
</style></head><body><div class="shell"><nav>${nav}</nav><div class="wrap">${body}</div></div></body></html>`,
)

console.log('Escrito core/.preview/index.html')
