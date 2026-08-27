# Cableado de referencia

Un sitio con **los nueve módulos activos**, compilado de verdad para comprobar que montan.
Es la forma que tiene que escribir el generador en H5 a partir del blueprint:

- [`payload.collections.ts`](payload.collections.ts) — las colecciones, con sus etiquetas y rutas.
- [`data.ts`](data.ts) — una consulta por módulo, cacheada por render, degradando si la base no responde.
- [`page.tsx`](page.tsx) — el orden de las secciones, el reparto de tonos y el grafo de JSON-LD.

Tres cosas que este ejemplo fija y que no son decoración:

1. **El orden de las secciones sale del blueprint**, y `alternateTones` reparte los fondos
   sobre las que de verdad se pintan: dos secciones que pasan a ser vecinas cuando el
   cliente se queda sin contenido nunca comparten fondo.
2. **Los precios llegan al marcado por la relación**, no emparejando por nombre: los
   nombres divergen, y emparejarlos así es como un precio acaba en lo que no era.
3. **Las personas se declaran una vez** y se referencian por `@id` desde la organización y
   desde lo que firman.
