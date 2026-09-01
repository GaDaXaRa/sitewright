# Trabajar en el núcleo

Se extrajo comparando dos webs reales, y **aquí viven las pruebas duras**: cada sitio prueba
su dominio y no vuelve a probar esto.

```bash
npm run build          # compila a dist/, que es lo que consumen los sitios
npm run test
npm run typecheck
npm run test:mutacion  # corta por debajo del 95%
```

## Reglas de la casa

- **Nada de aquí puede saber de un negocio concreto.** Si una función necesita el nombre de
  una colección, una etiqueta o una ruta, la recibe; no la conoce.
- **No se importan los tipos generados de ningún sitio.** Los datos entran con las formas
  mínimas de `src/lib/types.ts`, para que añadir un campo en el CMS de una web no rompa otra.
- **Los componentes de `ui` no traen estilos**: pintan clases conocidas (`consent`, `embed`,
  `embed-blocked`…) y cómo se ven es cosa de la hoja de cada sitio — justo la mitad que un
  cliente pide cambiar.

## Desarrollar contra un sitio

```bash
npm --prefix ../core run build
npm install --install-links ../sitewright/core   # desde el sitio
```

Dos cosas que costaron un rato:

- **`--install-links`**: con un enlace simbólico, Turbopack no resuelve el paquete, porque
  su raíz está fijada al proyecto. Se instala como copia, que además es lo que pasa cuando
  viene del registro.
- **npm no refresca un `file:` con la misma versión**: hay que borrar `node_modules/sitewright-core`
  antes de instalar.

Para volver a la versión publicada: `npm install sitewright-core@latest`.
