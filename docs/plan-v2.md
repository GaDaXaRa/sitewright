# Sitewright — plan de la v2

> Versión navegable: https://claude.ai/code/artifact/bbbd2cba-ece7-46ba-80ad-8c8acbd10700
> Propuesto el 14 de septiembre de 2026, sobre el núcleo 0.16.0.
> El plan de la v1, con lo que se cerró y lo que se aplazó → [plan-v1.md](plan-v1.md).

## El problema

La v1 resolvió el parto, y lo resolvió de verdad: una conversación produce un blueprint, y
el blueprint produce una web desplegada con la auditoría en verde. Once módulos, dieciocho
baterías en el núcleo con el listón de mutación en 95, y una CI que genera tres webs enteras
en cada push para que una errata en un módulo no la descubra un cliente.

Lo que no resuelve es lo que viene después. **Una web no se entrega, se mantiene.** El
segundo mes alguien quiere una sección que no estaba; el sexto, Payload lleva doce versiones
publicadas y ninguna ha llegado a ninguna parte; al año la web sigue «en verde» porque la
última vez que alguien la auditó fue el día que se desplegó. Ninguna de esas tres cosas la
cuenta hoy un comando, y la única razón por la que todavía no ha dolido es que son cinco
webs y caben en la cabeza de una persona.

**La v2 es la vida de la web, no su nacimiento.**

## Lo que ya está, para no volver a derivarlo

| Pieza | Estado |
|---|---|
| Núcleo `sitewright-core` | 0.16.0 en npm · 18 baterías · mutación 96,29% con el corte en 95 |
| Módulos | Los once, copiados al sitio y editables, con sus pruebas viajando dentro |
| Generador | Determinista, escritores puros y probados, tres blueprints compilando en la CI |
| Auditoría | 17 puertas: identidad, canonical, sitemap, JSON-LD, `llms.txt`, cabeceras, legal, consentimiento, imágenes, relleno, peso, alcanzables, páginas vacías, panel privado, contraste, portada, esquema |
| Deriva | El sello `.sitewright-sync.json` distingue «se ha quedado atrás» de «lo tocaron aquí» |
| Puesta al día | `sync-core` (npm) y `sync-site` (chasis y módulos), y `doctor` que lo mide |

Nada de esto se toca en la v2 salvo para ampliarlo.

## Los cinco ejes

### 1 · El blueprint sigue mandando el segundo día

Hoy `generate.js` escribe **un directorio entero**. Añadir un módulo a una web viva es
cirugía a mano sobre `site.config.ts`, `site.modules.ts`, `SiteSettings.ts`, `page.tsx`,
`styles.css` y `seed.ts` — exactamente los seis ficheros que la arquitectura dice que nadie
debería tocar a mano. La skill de la entrevista lo reconoce por escrito: «no edites el sitio
generado a mano».

Lo llamativo es que **la mitad ya está hecha**: `writtenDrift` regenera la web desde el
`sitewright.json` que lleva dentro, la compara fichero a fichero y `doctor` la enseña. Sabe
decir qué cambiaría. Lo único que no sabe hacer es aplicarlo.

- `npm run sync-written -- ../<sitio>` con el contrato de `sync-site`: sin `--apply` no
  escribe, enseña el diff, y el sello decide qué es de la fábrica y qué escribió alguien
  aquí. Pisar lo personalizado sigue pidiendo `--force`.
- Lo que no puede hacer solo, lo dice: un módulo nuevo es una colección nueva, y eso es
  `migrate:create` y `seed`. Callarlo sería dejar una web que compila y revienta el panel.
- Skill **`añadir-modulo`**: la segunda entrevista. Tres preguntas, no quince, porque la
  identidad, la paleta y lo legal ya están escritos.

**La puerta**: una prueba que genera un sitio desde el blueprint A, le aplica A+faq, y lo
compara con un sitio generado desde A+faq directamente. Byte a byte. Incremental tiene que
ser idéntico a desde cero, o no vale.

*Tamaño: 4–5 días.* Es el eje del que dependen los demás.

### 2 · La flota

Todo lo que hay es de una web cada vez: `doctor -- ../<sitio>`. Con cinco no pasa nada; con
doce no lo mira nadie.

- **`npm run doctor -- --all`** sobre un registro de sitios, en una tabla: núcleo, chasis,
  esquema, dependencias, última auditoría. Una pantalla, todo el parque.
- **Las dependencias no las mide nadie.** `package.json` está fuera de la comparación de
  deriva a propósito —lo mueve npm en cada instalación—, pero el efecto secundario es que
  una web clava `payload 3.88.0` y `next 16.3.0` el día que nace y ahí se queda. Ni el
  número de versiones perdidas ni un CVE salen por ninguna parte. `doctor` tiene que
  contarlas, con `npm audit` al lado.
- **`npm run sync-deps -- ../<sitio>`** sube lo clavado a lo que hoy lleva la plantilla, y
  se para ahí: quien decide si entra es la CI de esa web —typecheck, `test:int`, build—, no
  el guion. Nunca automático, y nunca a través de un mayor sin que alguien lo escriba.
- **Auditoría periódica.** Estaba aplazado en la v1 con ese nombre. Hoy la auditoría de un
  sitio corre cuando Vercel termina un despliegue, así que una web que no se despliega no se
  audita nunca. Un cron semanal contra producción que abra una incidencia cuando una puerta
  se ponga roja: un certificado caducado, una colección que alguien vació desde el panel, un
  embebido que murió.

*Tamaño: 3–4 días.*

### 3 · Las puertas que se prometieron y no están

El plan de la v1 dice, con estas palabras: «**Accesibilidad**: axe sin violaciones serias y
contraste AA sobre la paleta elegida» y «**Rendimiento**: presupuesto de LCP y CLS». Lo que
existe es la mitad del contraste —parejas de tokens medidas en la hoja de estilos— y un
techo de kilobytes sobre el HTML. Ni axe ni una sola métrica de rendimiento.

Es el fallo que la regla 9 existe para evitar, cometido por el propio plan: una puerta
anunciada que no hay. Hay dos salidas honestas —implementarla o tacharla— y aquí se propone
la primera, porque son justo las dos que nota un cliente.

- **Accesibilidad**: axe-core sobre el HTML descargado, con `linkedom`, sin navegador. No
  cubre todo, y lo que no cubra se dice en voz alta: etiquetas, puntos de referencia, orden
  de encabezados, `lang`, nombres de campos e identificadores repetidos sí; el foco y el
  contraste calculado sobre píxeles, no. Una puerta que no mide tiene que decirlo, y para eso
  ya está `skip`.
- **Rendimiento**: la API de PageSpeed Insights contra la URL pública. LCP, CLS e INP, con un
  presupuesto por sitio. Es gratis, no hace falta navegador en la CI y mide la web que ve la
  gente, no una simulación en un portátil.
- **La tarjeta social.** Hoy las páginas de sección emiten **sólo un título**: ni descripción
  ni imagen. Una sección compartida por WhatsApp sale como un enlace pelado, y la portada
  sólo tiene imagen si alguien subió una foto de cabecera. Falta una imagen social generada
  —`defaultIconSvg` ya demuestra la máquina: nombre y paleta producen una imagen— y su
  puerta: toda página indexada lleva título, descripción e imagen.

*Tamaño: 4–5 días.*

### 4 · Lo que pide un cliente y hoy no hay

- **Inscripción con cupo.** La v1 decidió «contacto e inscripción con cupo, sin pagos» y
  sólo llegó la primera mitad: `requests` tiene tipos, honeypot, frenos y consentimiento con
  fecha, pero ninguna noción de plaza. Un taller con doce sitios es lo que más piden un
  estudio y una escuela. Plazas, contador, cierre solo al llenarse y lista de espera. Sin
  pagos, que eso es otra cosa y está más abajo.
- **Copia del contenido.** Las imágenes tienen copia intacta desde la v1; **los textos no
  tienen nada**. Neon guarda su histórico, pero dentro de este sistema no hay ni exportar ni
  restaurar: una clienta que vacía una colección desde el panel no tiene vuelta que no pase
  por la consola de una base de datos. `npm run backup` semanal a Blob —las colecciones y los
  ajustes en JSON— y `npm run restore -- <fecha>`, que enseña lo que cambiaría antes de tocar
  nada.
- **La entrega.** Aplazado en la v1 como «guía generada, capturas automáticas, guion de
  vídeo». La guía sí se hizo (`Guia.tsx`, y cada web lleva la suya). Lo que falta son las
  capturas de ese panel, tomadas del sitio real, que es lo que permite a una persona no
  técnica usarlo sin una llamada.

*Tamaño: 5–6 días.*

### 5 · Lo que se vuelve a aplazar, y por qué

- **Bilingüe** (castellano y catalán, euskera, gallego o inglés). La localización de Payload
  es la mitad fácil. La cara: la auditoría, `llms.txt`, el grafo JSON-LD, `hreflang`, el
  canónico, las páginas legales y la entrevista entera dan por hecho un idioma. Es una
  versión, no un eje. Es lo que más se va a pedir en España, así que es la primera candidata
  a la v3 — pero **después del eje 1**, porque una web bilingüe es la última que quieres
  editar a mano.
- **Pagos y reservas con pago**: facturación, TPV, devoluciones y el RGPD de los datos de
  pago. Otro negocio, no un sprint.
- **Importar la web anterior del cliente**: suena bien y es un raspador más el criterio de
  qué merece conservarse. Con cinco webs sale más barato a mano.
- **VPS y cuentas del cliente**: la capa de proveedor existe, y ningún cliente la ha pedido.
  Regla 8 — antes de suponer que hace falta, mirar: no consta que haga falta.

## El orden, y por qué es ese

| | Hito | Tamaño | Entrega |
|---|---|---|---|
| A | Regeneración incremental | 4–5 d | Un módulo nuevo en una web viva, editando su blueprint |
| B | Accesibilidad, rendimiento y tarjeta social | 4–5 d | Tres puertas más, y el plan deja de prometer lo que no hay |
| C | La flota | 3–4 d | `doctor --all`, dependencias medidas y auditoría semanal |
| D | Cupo, copia y entrega | 5–6 d | Lo que pide quien paga |

**A va primero** porque todo lo demás es más fácil sobre webs que se regeneran: una puerta
nueva en el núcleo llega sola, pero una que exija un fichero nuevo en el sitio, no. **B va
segunda** porque es deuda declarada: está escrita como si existiera. **C** cuando haya algo
que repartir a la flota. **D la última** porque es el único eje cuya forma puede cambiarla la
frase de un cliente, y cuanto más tarde se congele, mejor.

## Cómo se sabe que la v2 está hecha

Una web de hace seis meses **admite una sección nueva editando su blueprint**, va al día de
núcleo, chasis y framework porque un comando lo dice sin que nadie lo recuerde, y su
auditoría —con accesibilidad y rendimiento de verdad, no prometidos— pasa sola cada semana.

## Riesgos

- **El eje 1 puede borrar el trabajo de alguien en una web viva.** Para eso está el sello, y
  la puerta es la prueba de que incremental e inicial coinciden byte a byte. Ni un `--apply`
  sin diff delante, ni sin el typecheck del propio sitio detrás.
- **Puertas nuevas que crían ruido.** Una puerta que da falsas alarmas se acaba apagando —es
  la razón por la que `checkPlaceholders` avisa en vez de fallar—. Cada puerta nueva nace
  como aviso y asciende a fallo el día que caza algo real.
- **`sync-deps` cruzando un mayor de Payload.** Decide la CI de la web, no el guion, y nunca
  sola.
- **El registro de sitios con datos de clientes.** Este repositorio es público: el registro
  lleva rutas y dominios, no nombres legales ni cadenas de conexión.
