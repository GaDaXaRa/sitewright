# @sitewright/core

Lo que no cambia de un sitio a otro: lógica pura, el sistema de imágenes, los frenos del
formulario público y la fontanería de SEO y GEO.

Se extrajo comparando dos webs reales —[Organic Yoga](../../organicYoga) y
[Subsuelo](../../subsuelo)— en el hito 1, y **aquí viven las pruebas duras**: cada sitio
prueba su dominio, no vuelve a probar esto.

```bash
npm run build       # compila a dist/ (es lo que consumen los sitios)
npm run test        # la batería
npm run typecheck
```

Reglas de la casa:

- **Nada de aquí puede saber de un negocio concreto.** Si una función necesita el nombre de
  una colección, una etiqueta o una ruta, la recibe; no la conoce.
- **No importa los tipos generados de ningún sitio.** Los datos entran con formas mínimas
  declaradas en `src/lib/types.ts`, para que un cambio en el CMS de un sitio no rompa esto.
