---
name: anadir-modulo
description: Añade una sección a una web Sitewright que ya existe — edita su blueprint, aplica los cambios sin pisar lo que se personalizó y deja dicha la migración. Úsala cuando alguien quiera una sección nueva (equipo, precios, agenda, opiniones, preguntas frecuentes…) en una web ya hecha.
---

# Una sección más

La web ya existe y está desplegada. Tu trabajo es **editar su blueprint y aplicarlo**, no
escribir código: el generador redacta los ficheros, `sync-written` los lleva, y lo que
alguien haya personalizado en esa web se queda como está.

Antes de preguntar nada, mira lo que hay:

```bash
npm run doctor -- ../<sitio>
```

Te dice qué módulos tiene, si va al día de núcleo y de chasis, y **qué ficheros son suyos**
—personalizados allí—. Eso último cambia lo que puedes prometer: si la portada o la hoja de
estilos llevan trabajo a mano, la sección nueva no aparecerá sola.

## Las tres preguntas

Sólo tres, porque la identidad, la paleta, el tono y los datos legales ya están en el
`sitewright.json` de esa web. Léelo antes: es el contexto entero.

**1 · Qué quieren enseñar.** Pregunta por lo que tienen, no por el módulo. «¿Son personas,
con su foto y lo que hace cada una?» es mejor pregunta que «¿quieres el módulo team». La
tabla de los once está en [`modules/README.md`](../../../modules/README.md), y la distinción
que más se confunde es `schedule` (fechas que pasan y se archivan) frente a `timetable` (un
cuadrante que se repite).

**2 · Cómo lo llaman ellos.** Singular y plural, con sus palabras: son las etiquetas del
panel y el título de la sección. El mismo módulo es «Servicios», «Proyectos», «Sesiones» o
«Actividades» según quién hable.

**3 · Dónde va.** La ruta (`/equipo`, `/tarifas`) y en qué lugar de la portada. El orden lo
manda `design.sections` del blueprint; si no está, es el orden en que están escritos los
módulos.

Nada más. Lo que no preguntes sale de un valor por defecto y se corrige editando un fichero.

## Cómo hacerlo

1. **Edita el `sitewright.json` de la web**, no una copia en `generator/blueprints/`: el
   blueprint de una web real vive dentro de esa web. Añade la entrada en `modules` con sus
   `labels` y su `route`.

2. **Enseña qué cambiaría, antes de cambiar nada:**

   ```bash
   npm run sync-written -- ../<sitio>
   ```

   Lee la salida en voz alta con quien te lo pidió. Lo que diga `PERSONALIZADO AQUÍ` no se
   va a tocar, y si está entre los ficheros que la sección necesita para existir
   —`site.config.ts`, `site.modules.ts`, `page.tsx`, `styles.css`, `SiteSettings.ts`,
   `seed.ts`— el propio comando lo dice y te da el `diff` para llevar el trozo a mano.

3. **Aplícalo:**

   ```bash
   npm run sync-written -- ../<sitio> --apply
   ```

4. **La migración, que el guion no puede hacer.** Un módulo nuevo trae una colección nueva:
   sin migrar, el despliegue sale bien y el panel revienta más tarde, que es la peor forma
   de enterarse. En el sitio:

   ```bash
   npm run migrate:create -- <modulo> && npm run migrate
   npm run typecheck
   ```

5. **Mira el diff** (`git diff` en la web) antes de subir nada. No te fíes de que el comando
   dijera que fue bien: comprueba el efecto.

6. **Auditoría antes de dar nada por bueno.** Una sección nueva vacía es una página que la
   web anuncia y no tiene nada dentro, y eso ya lo caza una puerta:

   ```bash
   npm run dev    # y en otra terminal
   npm run audit -- --url http://localhost:3000
   ```

7. **Desplegar es `git push`.** Nada de `vercel --prod`.

## Lo que no debes hacer

- **No regeneres encima con `generate.js --out <la web> --force`.** Borra el directorio
  entero, `.git` incluido. Para eso está `sync-written`.
- **No edites a mano los ficheros que redacta el generador** para meter la sección. Si algo
  no se puede expresar en el blueprint, falta en el blueprint o en un módulo: dilo.
- **No borres un módulo que sobra.** Quitarlo del blueprint deja de referenciarlo; el
  directorio se queda, y `sync-written` lo dice. Lo borra una persona, mirando antes si
  alguien lo tocó.
- **No inventes el contenido.** Una sección nueva nace vacía y se llena desde el panel. Si
  redactas un borrador, que sea sólo lo que te hayan contado, y dilo en voz alta.
- **No prometas lo que no hay.** Hoy no hay cupo de plazas, ni pagos, ni segundo idioma.
