# Sitewright

Generador de sitios web profesionales: una conversación produce un *blueprint*, y el
blueprint produce una web Next.js + Payload desplegada, con CMS, SEO, GEO, seguridad y
RGPD de serie.

Pensado para colectivos, portafolios personales, asociaciones y pequeños negocios
personales. La referencia de calidad es [organicyoga.es](https://www.organicyoga.es).

- **Reglas de trabajo** → [CLAUDE.md](CLAUDE.md) — léelo antes de tocar nada
- **Cómo funciona por dentro** → [documentación navegable](https://claude.ai/code/artifact/9a5f1f1d-6e5b-4b03-93f1-7548ba17f3af) — cada pieza, y qué se rompió para que exista cada regla
- **Plan de la v1** → [docs/plan-v1.md](docs/plan-v1.md)
- **Estado**: v1.4. Dos webs en producción sobre esta arquitectura, una de ellas de cliente.

## Operaciones

Las que pueden romper algo tienen un único punto de entrada, porque hacerlas a mano salió
mal más de una vez:

```
npm run release                     publica sitewright-core tras pasar las puertas
npm run doctor -- ../<sitio>        qué versión tiene, qué se está perdiendo y qué es suyo
npm run sync-core -- ../<sitio>     instala el núcleo y verifica el resultado
npm run sync-site -- ../<sitio>     trae el chasis y los módulos
npm run sync-written -- ../<sitio>  trae lo que el blueprint de esa web dice que es
```

Los dos que copian encima de ficheros —`sync-site` y `sync-written`— **no escriben sin
`--apply`**: enseñan qué cambiaría. `sync-core` sí instala directo, porque instalar un
paquete se deshace y pisar el fichero de alguien no. Y `sync-written` es el que convierte
editar el `sitewright.json` de una web en añadir una sección a una web viva.

## Convenciones

- **El código va en inglés**: identificadores, comentarios y mensajes de commit.
- **Lo que ve una persona va en español**: etiquetas del panel, textos de la web y el
  vocabulario del blueprint. El cliente final no es técnico.
- Los comentarios explican **por qué**, no qué hace la línea. Densidad baja.
