# Módulos

Un módulo es **un tipo de contenido con todo lo que arrastra**: su colección en el CMS, su
sección en la portada, sus rutas, su aporte al JSON-LD y a `llms.txt`, y su contenido de
ejemplo.

Se **copian** al sitio (`src/modules/<id>/`), no se importan de un paquete: es la decisión
de "núcleo fino". A partir de ahí son del sitio y se pueden editar sin pedir permiso. Lo que
no se copia —imágenes, revalidación, consentimiento, frenos del formulario— vive en
[`@sitewright/core`](../core).

## Qué trae cada uno

| Fichero | Para qué |
|---|---|
| `module.json` | El manifiesto: etiquetas por defecto, rutas, sección y qué aporta |
| `collection.ts` | Fábrica de la colección de Payload, parametrizada por etiquetas |
| `Section.tsx` | La sección de la portada (y de su página, si la tiene) |
| `jsonld.ts` | Los nodos que añade al grafo, si añade alguno |
| `llms.ts` | Su sección de `/llms.txt`, si aporta alguna |
| `seed.ts` | Contenido de ejemplo, para que la web se vea antes de tener textos |

## La regla del vocabulario

**El mismo módulo cambia de nombre según el negocio**: el catálogo es "Servicios" en un
estudio, "Proyectos" en un portafolio, "Sesiones" en un colectivo y "Actividades" en una
asociación. Por eso ninguna etiqueta está escrita en el código: entran por la fábrica, y el
blueprint decide cuál toca.

## Los nueve

| Módulo | Qué es | Página propia |
|---|---|---|
| `catalog` | Lo que el negocio ofrece o ha hecho | Sí, con ficha por elemento |
| `schedule` | Contenido con fecha: próximo y archivo | Sí |
| `pricing` | Precios, bonos y "a convenir" | Sí |
| `team` | Las personas | Ficha por persona |
| `media` | Audio y vídeo embebidos, tras consentimiento | Sí |
| `reviews` | Opiniones, prensa, citas | No |
| `faq` | Preguntas frecuentes | Sí |
| `notices` | Aviso emergente programable | No |
| `contact` | Formulario, con consentimiento y avisos por correo | No |
