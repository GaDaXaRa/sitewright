# Generador

Del blueprint al sitio en disco. Todo es **determinista**: el mismo blueprint escribe los
mismos ficheros, así que un sitio generado se puede regenerar, diffear y discutir.

```bash
node generate.js --blueprint blueprints/ejemplo-asociacion.json --out ../../mi-sitio
node provision.js blueprints/ejemplo-asociacion.json   # imprime los comandos de infraestructura
node --test                                            # pruebas del validador
```

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

## El blueprint

Tres cosas y una paleta: **identidad**, **módulos** (etiquetas y rutas) y **diseño**, más los
datos legales. Es pequeño porque la extracción se lo ganó: después de sacar el núcleo y
escribir nueve módulos, lo que de verdad cambia entre un negocio y otro es eso.

Lo valida [`schema.js`](schema.js), y valida **cosas que duelen**: dos módulos peleándose por
la misma ruta, un formulario sin dirección a la que escribir, un sitio sin titular legal.
