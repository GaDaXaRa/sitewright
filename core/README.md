# @sitewright/core

Lo que no cambia de un sitio a otro: lógica pura, el sistema de imágenes, los frenos del
formulario público y la fontanería de SEO y GEO.

Se extrajo comparando dos webs reales —[Organic Yoga](../../organicYoga) y
[Subsuelo](../../subsuelo)— en el hito 1, y **aquí viven las pruebas duras**: cada sitio
prueba su dominio, no vuelve a probar esto.

```bash
npm run build          # compila a dist/ (es lo que consumen los sitios)
npm run test           # 98 pruebas
npm run typecheck
npm run test:mutacion  # 96,14% — corta por debajo del 95%
```

## Qué hay dentro

| Entrada | Qué trae |
|---|---|
| `@sitewright/core` | Lógica pura: identidad del dominio, lectura de imágenes y relaciones, slug, listas, escapado, tonos de sección, contenido con fecha, embebidos, decisiones del respaldo de imagen, frenos del formulario y las tres páginas legales |
| `@sitewright/core/payload` | Hooks de imagen, endpoint de restaurar, colecciones `media` y `users`, y la fábrica de revalidación |
| `@sitewright/core/ui` | Componentes de cliente: consentimiento, analítica condicionada, embebidos y los botones del panel |

Los componentes de `ui` **no traen estilos**: pintan clases conocidas (`consent`, `embed`,
`embed-blocked`…) y cómo se ven es cosa de la hoja de estilos de cada sitio, que es
justamente la mitad que un cliente pide cambiar.

## Cómo lo consume un sitio

```json
{ "dependencies": { "@sitewright/core": "file:../sitewright/core" } }
```

```bash
npm run core:sync   # compila el núcleo, retira la copia anterior e instala
```

Dos cosas que costaron un rato:

- **`--install-links`**: con un enlace simbólico, Turbopack no resuelve el paquete (la raíz
  está fijada al proyecto). Se instala como copia, que además es lo que pasará cuando esté
  publicado.
- **npm no vuelve a copiar un `file:` con la misma versión**, así que `core:sync` borra la
  copia anterior antes de instalar.

Reglas de la casa:

- **Nada de aquí puede saber de un negocio concreto.** Si una función necesita el nombre de
  una colección, una etiqueta o una ruta, la recibe; no la conoce.
- **No importa los tipos generados de ningún sitio.** Los datos entran con formas mínimas
  declaradas en `src/lib/types.ts`, para que un cambio en el CMS de un sitio no rompa esto.
