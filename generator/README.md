# Generador

Del blueprint al sitio en disco. Todo es **determinista**: el mismo blueprint escribe los
mismos ficheros, así que un sitio generado se puede regenerar, diffear y discutir.

```bash
node generate.js --blueprint blueprints/ejemplo-asociacion.json --out ../../mi-sitio
node provision.js blueprints/ejemplo-asociacion.json   # imprime los comandos de infraestructura
node --test                                            # pruebas del validador
```

## Cómo está partido

`generate.js` **dirige**: lee los argumentos, valida, copia el chasis, le pide a cada
escritor su fichero y lo guarda. Quien redacta vive en [`lib/`](lib), en funciones puras que
reciben el blueprint y devuelven texto — sin leer el disco ni escribir nada.

| Fichero | Qué redacta |
|---|---|
| `lib/site.js` | `site.config.ts`, `site.modules.ts` y la portada |
| `lib/panel.js` | `SiteSettings.ts` y `scripts/seed.ts` |
| `lib/docs.js` | El README y el CLAUDE.md de la web, desde `templates/` |
| `lib/design.js` | La paleta, los colores propios y las tipografías |
| `lib/text.js` | `replaceOrDie` y los ayudantes que usan todos |

Estaban las novecientas líneas dentro de `generate.js`, que se ejecuta al importarlo: **nada
de eso se podía llamar desde una prueba**, y lo único que lo vigilaba era compilar tres webs
enteras en la CI, minutos por vuelta y sólo después de subir. Ahora lo prueba
[`writers.test.js`](writers.test.js) en milisegundos, y la matriz de la CI sigue donde
estaba para lo que una prueba no ve: que el sitio compile.

La prosa que lee una clienta —el README y la guía de su web— **no está en el código**: vive
en [`templates/`](templates), en markdown de verdad. Estuvo dentro de plantillas literales
de JavaScript con cada comilla invertida escapada a mano, y eso ya se subió roto una vez en
`provision.js`. Se rellena con `fill`, que comprueba las dos direcciones: un `{{hueco}}` sin
valor llegaría literal al repositorio de una clienta, y un valor sin hueco es alguien que
renombró el hueco en el `.md` y dejó de llegar el dato sin que nada lo dijera.

Un escritor **no puede parar el proceso**. Cuando no reconoce la plantilla lanza
`TemplateChanged` y `generate.js` decide: borrar lo escrito a medias y decir cuál falló. Que
pudiera llamar a `process.exit` era justo lo que hacía imposible probarlo.

## Qué escribe

`site.config.ts` (identidad, rutas) · `payload.config.ts` (colecciones de los módulos con sus
etiquetas) · `globals/SiteSettings.ts` (más los campos que pida cada módulo) · `lib/data.ts`
(una consulta por módulo) · `page.tsx` (orden de secciones, tonos alternos, grafo JSON-LD,
menú y pie) · `llms.txt` · la paleta y las tipografías.

## Qué no escribe, a propósito

- **Los textos, el hero y las fotos.** Es lo que hace que una web no parezca una plantilla,
  y es trabajo de una persona (o de la conversación de H6).
- **El aprovisionamiento.** `provision.js` imprime los comandos; ejecutarlos toca dinero y
  cuentas ajenas, así que lo hace quien manda.

## Dónde vive cada blueprint

Los de `blueprints/` son **ejemplos ficticios**, y están aquí porque documentan la forma del
fichero. El blueprint de una web real vive **en el repositorio de esa web**, que es privado:
lleva el nombre legal de quien la encarga, sus textos y su contacto, y este repositorio es
público.

Lo escribe el propio generador en `sitewright.json`, en la raíz del sitio, para que la
receta viaje con la web. Guardarlo aparte ya salió caro: de las dos webs en producción,
una no tenía el suyo en ninguna parte, y hubo que reconstruirlo leyendo hacia atrás sus
ficheros generados.

## Y el segundo día

Editar ese `sitewright.json` **cambia la web**, no sólo el papel: `sync-written` la regenera
desde él y trae lo que falte, sin pisar lo que alguien haya escrito allí.

```bash
# desde la raíz del repositorio, no desde aquí
npm run sync-written -- ../mi-sitio            # enseña qué cambiaría
npm run sync-written -- ../mi-sitio --apply    # lo trae
```

Es la vía **y la única**. `generate.js --out` apuntando a una web que ya existe se niega, y
con `--force` borra el directorio entero —`.git` incluido— antes de escribir: sirve para
crear y para regenerar en un temporal, nunca para poner al día.

Un módulo nuevo trae una colección nueva, y eso el guion no lo puede hacer: lo dice al
terminar (`migrate:create`, `migrate`, y `seed` si se quiere su contenido de ejemplo). Que
la vía incremental y la inicial no diverjan lo vigila
[`scripts/regenerate.test.js`](../scripts/regenerate.test.js), comparando las dos webs
fichero a fichero.

## El blueprint

Tres cosas y una paleta: **identidad**, **módulos** (etiquetas y rutas) y **diseño**, más los
datos legales. Es pequeño porque la extracción se lo ganó: después de sacar el núcleo y
escribir nueve módulos, lo que de verdad cambia entre un negocio y otro es eso.

Lo valida [`schema.js`](schema.js), y valida **cosas que duelen**: dos módulos peleándose por
la misma ruta, un formulario sin dirección a la que escribir, un sitio sin titular legal.

## Generación segura

El destino debe ser nuevo. `--force` solo acepta un directorio existente si está vacío:
no borra una web, sus personalizaciones ni su historial. El generador prepara el sitio en
un directorio temporal junto al destino y lo entrega al terminar; un error limpia solo
esa copia temporal. Para cambiar una web existente, usa `sync-site` y `sync-written`.

Los textos se serializan como valores de JavaScript antes de insertarlos en los ficheros.
Las pruebas incluyen comillas, apóstrofos, saltos de línea y marcadores de plantilla.
