# Guía para agentes — {{name}}

Web + CMS generada con [Sitewright](https://www.npmjs.com/package/sitewright-core) a partir
de `{{id}}.json`. Lo que no cambia entre sitios vive en el paquete
`sitewright-core`; **no lo edites desde aquí**: se toca en el repositorio de Sitewright y
se publica una versión.

## Qué tiene este sitio

| Sección | Módulo | Ruta |
|---|---|---|
{{modules}}

Lo que el núcleo no puede saber está en [`src/site.config.ts`](src/site.config.ts):
identidad, rutas y menú. Se edita ahí y nada más tiene que moverse.

## Convenciones

- **El código va en inglés**: identificadores, comentarios y mensajes de commit.
- **Lo que ve una persona va en español**: etiquetas del panel, textos de la web y correos.
  El cliente final no es técnico.
- Los comentarios explican **por qué**, no qué hace la línea.

## Entorno

- **Dos ramas de Neon**: `dev` en tu `.env` y la de producción en Vercel. Compartir una
  sola es lo que deja marcas de modo dev en producción y **tumba el despliegue**.
- Sin `BLOB_READ_WRITE_TOKEN` las imágenes van a disco local y la copia original no se
  guarda: eso solo se prueba desplegado.

## Cómo verificar

```bash
npm run lint && npm run typecheck && npm run test:int && npm run build
npm run audit -- --url http://localhost:3000
```

**`typecheck` no es opcional**: `next build` reutiliza su caché y puede dar por bueno un
fichero que no ha vuelto a comprobar.

## Lo que ya nos ha mordido

- **Todo cambio de esquema necesita migración** (`npm run migrate:create -- <nombre>` y
  `npm run generate:types`). En desarrollo Payload empuja el esquema solo; producción
  **solo aplica migraciones**.
- **Nunca ejecutes el seed contra producción**: deja una marca de modo dev
  (`batch = -1`) que cuelga `payload migrate` en el build. Se limpia con
  `scripts/fix-prod-migration.mjs`.
- **El favicon vive en `public/` con dirección fija.** Dentro de la carpeta de la app Next le
  pone un hash que cambia en cada despliegue, y Google necesita una URL estable. Si el
  cliente sube el suyo desde el panel, se sirve en `/icono.png`, que tampoco cambia.
- **Tras tocar un componente del panel, `npm run generate:importmap`**, o `/admin` se queda
  en blanco.
- **La auditoría antes de desplegar, no después.** Su puerta de esquema es la que caza lo
  que rompe el build; "faltan migraciones" en cambio es normal antes de desplegar, porque
  las aplica el propio build.

## Lo que es de este sitio y no del sistema

Las secciones, la hoja de estilos y los módulos de `src/modules/` son **copias**: edítalos
sin pedir permiso. Si el cambio sirve para cualquier web, va al repositorio de Sitewright.
