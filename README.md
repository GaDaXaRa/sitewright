# Sitewright

Generador de sitios web profesionales: una conversación produce un *blueprint*, y el
blueprint produce una web Next.js + Payload desplegada, con CMS, SEO, GEO, seguridad y
RGPD de serie.

Pensado para colectivos, portafolios personales, asociaciones y pequeños negocios
personales. La referencia de calidad es [organicyoga.es](https://www.organicyoga.es).

- **Reglas de trabajo** → [CLAUDE.md](CLAUDE.md) — léelo antes de tocar nada
- **Plan de la v1** → [docs/plan-v1.md](docs/plan-v1.md)
- **Estado**: v1.1. Dos webs en producción, una de ellas de cliente.

## Operaciones

Las que pueden romper algo tienen un único punto de entrada, porque hacerlas a mano salió
mal más de una vez:

```
npm run release                  publica sitewright-core tras pasar las puertas
npm run sync-core ../<sitio>    instala el núcleo en un sitio y verifica el resultado
```

## Convenciones

- **El código va en inglés**: identificadores, comentarios y mensajes de commit.
- **Lo que ve una persona va en español**: etiquetas del panel, textos de la web y el
  vocabulario del blueprint. El cliente final no es técnico.
- Los comentarios explican **por qué**, no qué hace la línea. Densidad baja.
