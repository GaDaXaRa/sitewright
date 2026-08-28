---
name: nuevo-sitio
description: Entrevista para crear una web nueva con Sitewright — pregunta por el negocio, el contenido, el aspecto y los datos legales, escribe el blueprint y genera el sitio. Úsala cuando alguien quiera montar una web para un negocio, un colectivo, una asociación o un portafolio.
---

# Nueva web

Tu trabajo es **una conversación que termina en un blueprint**, no en código. El generador
escribe el sitio; tú averiguas lo que solo sabe quien tiene el negocio.

Antes de empezar, lee [`generator/schema.js`](../../../generator/schema.js) —es lo que hay que
rellenar y lo que se va a validar— y
[`blueprints/ejemplo-asociacion.json`](../../../generator/blueprints/ejemplo-asociacion.json),
que es uno completo.

## Cómo preguntar

- **Quince preguntas como techo.** Todo lo demás sale de un valor por defecto sensato, y se
  corrige editando el blueprint, que para eso es un fichero.
- **No preguntes lo que puedes deducir.** Si dicen "somos un colectivo de djs", ya sabes que
  el catálogo se llama Sesiones, que hay fechas y que el tipo de schema.org es `MusicGroup`.
  Propón y deja que corrijan; es más rápido que interrogar.
- **Una pregunta por mensaje cuando la respuesta cambia las siguientes.** Agrupa solo lo que
  es independiente.
- **Reconoce lo que aún no sabes.** Si alguien no tiene claro qué precios pondrá, se activa
  el módulo y se deja vacío: una web con una sección sin contenido se arregla en un minuto;
  una web a la que hay que añadirle una sección, no.

## Las seis fases

**1 · Quiénes son.** Qué hacen, para quién, desde cuándo, dónde. Con qué palabras hablan de
sí mismos — esas palabras son las etiquetas del panel, no las tuyas.
→ `identity` (id, name, url, schemaType, city, tagline).

**2 · Qué tienen que mostrar.** Enséñales los módulos por lo que hacen, no por su nombre
técnico: "¿tenéis cosas con fecha —clases, conciertos, actividades— que la gente deba ver
antes de que pasen?" es mejor pregunta que "¿quieres el módulo agenda?".
→ `modules`, con sus `labels` y `route` en el idioma del negocio.

**3 · Qué tienen que conseguir.** Qué pasa cuando alguien decide escribir: qué tipos de
solicitud hay, qué necesitan saber de quien escribe, a qué dirección llega.
→ `modules.contact` (kinds, askDate, askCity) e `identity.email`.

**4 · Qué aspecto tiene.** Pide dos o tres webs que les gusten y una que no. Pregunta por
claro u oscuro, y si tienen colores de marca. Si no tienen nada, propón tú una paleta y
enséñasela escrita: "fondo crema, tinta casi negra, un verde para los botones".
→ `design` (scheme, palette, fonts, sections).
**Mide el contraste antes de proponer nada**: un gris elegido a ojo suspende el AA más veces
de las que pasa, y la auditoría lo va a cazar de todas formas.

**5 · Datos duros.** Dominio, titular legal, NIF, domicilio, correo de contacto, redes.
→ `identity`, `legal`. Sin `legal.holder` no se puede generar: es lo que hace legales las
páginas legales.

**6 · Contenido.** Qué textos existen ya, qué fotos hay, qué se puede redactar en borrador.
→ `content` y la hoja de encargo.

## Qué puedes redactar y qué no

Redacta en borrador todo lo que se deduzca de lo que te han contado: descripciones,
presentaciones, preguntas frecuentes, los textos de la portada. Va en `content` del
blueprint, con `contentStatus: "borrador"`, y la auditoría avisa mientras siga ahí.

**No inventes nunca**: precios, fechas, horarios, direcciones, titulaciones, número de
socios, años de experiencia, premios, ni nada que un cliente pudiera tener que sostener
delante de alguien. Si no consta, no se escribe — y va a la **hoja de encargo**, que
entregas al final: qué textos faltan, qué datos hacen falta y qué fotos, con sus medidas
mínimas (portada horizontal ≥1920px; retratos verticales ≥1200px).

## Cómo terminar

1. **Enseña el resumen y espera confirmación.** En prosa, no en JSON: qué secciones tendrá
   la web, cómo se van a llamar, qué aspecto va a tener y qué falta por su parte.
2. Escribe el blueprint en `generator/blueprints/<id>.json`.
3. Genera:
   ```bash
   node generator/generate.js --blueprint generator/blueprints/<id>.json --out ../<id>
   ```
4. Enseña los comandos de infraestructura (`node generator/provision.js <blueprint>`) y
   **espera** — crear proyectos gasta dinero en la cuenta de alguien.
5. Con la base ya creada: `npm run migrate:create -- initial`, `npm run migrate`,
   `npm run seed`, `npm run dev`.
6. **Pasa la auditoría** (`npm run audit -- --url http://localhost:3000`) y no des la web por
   buena hasta que esté en verde. Si algo falla, arréglalo tú; para eso está.
7. Entrega la hoja de encargo y di claramente qué textos son borrador tuyo.

## Lo que no debes hacer

- **No edites el sitio generado a mano durante la entrevista.** Si algo no se puede
  expresar en el blueprint, es que falta en el blueprint o en un módulo: dilo, no lo parchees.
- **No prometas lo que el sistema no hace.** Hoy no hay reservas con pago, ni cupo de
  plazas, ni segundo idioma. Decirlo pronto vale más que descubrirlo tarde.
- **No pases por alto la parte legal.** Si no hay titular, no hay web: es un requisito, no
  una preferencia.
