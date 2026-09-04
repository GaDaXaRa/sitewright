# H1 — qué es común y qué no

Cuaderno de campo del hito 1: la web del colectivo de djs ([subsuelo](../../subsuelo))
construida a mano sobre el chasis de [Organic Yoga](../../organicYoga). Esta es la materia
prima de H2: **lo que aparezca como igual es candidato a núcleo; lo que aparezca como
distinto se queda en el sitio.**

Estado: **desplegada** en https://subsuelo-rho.vercel.app (lint, typecheck, 68 pruebas y build en verde).

## 1. Igual en las dos webs — al núcleo tal cual

Se portaron sin cambiar nada más que el idioma de los identificadores:

| Pieza | Qué resuelve |
|---|---|
| `lib/site.ts` | La única fuente de identidad del dominio |
| `lib/slug.ts`, `lib/media.ts`, `lib/relations.ts`, `lib/list.ts` | Ayudantes puros |
| `lib/sectionTones.ts` | Fondos alternos sobre las secciones que se pintan |
| `lib/originalCopy.ts` + `hooks/images.ts` + `endpoints/restoreOriginal.ts` + `admin/ImageButtons.tsx` | Todo el sistema de imágenes: versionado de URL, copia intacta y restaurar |
| `lib/rateLimit.ts` | Frenos por IP y techo global del formulario público |
| `collections/Media.ts`, `collections/Users.ts` | Cookie de sesión segura, tamaños, punto focal |
| `middleware.ts`, cabeceras de `next.config.ts`, `app/robots.ts` | Dominio canónico, seguridad, rastreadores de IA |
| `components/JsonLd.tsx`, iconos y `metadataBase` del layout | El favicon con dirección estable incluido |

**Conclusión**: son el núcleo, sin discusión. Ninguna decisión de aquí resultó ser del yoga.

## 2. Igual en la forma, distinto en el contenido — núcleo parametrizable

| Pieza | Qué es común | Qué cambia por sitio |
|---|---|---|
| `hooks/revalidate.ts` | La fábrica `revalidator(...rutas)` y el `/llms.txt` | Qué colección invalida qué página |
| `lib/data.ts` | Cargador cacheado, degradar en vez de romper, el "ahora" viajando con los datos | Qué colecciones se leen |
| `globals/SiteSettings` | Identidad, SEO invisible, portada con punto focal, contacto, redes, **datos legales** | Los títulos de cada sección |
| `Bookings` / `Enrollments` | Honeypot, validaciones, enlaces prohibidos, frenos, consentimiento con fecha | Los campos del negocio |
| `lib/bookingTexts.ts` | El escapado, la tabla de filas, el "—" en lo vacío | La redacción |
| `lib/legalTexts.ts` | **Entero**: aviso legal, privacidad y cookies generados de Ajustes | Nada |
| `lib/llmsTxt.ts` | El armazón de secciones y la regla de no inventar | Qué secciones hay |
| `lib/jsonLd.ts` | Nodo de organización, `WebSite`, migas, `FAQPage`, referencias por `@id` | El tipo de organización y los nodos del dominio |
| `Consent` + `Analytics` + `Embed` | **Nuevo y común**: consentimiento único, analítica y embebidos detrás de él | Qué plataformas |
| `Nav`, `Footer`, `InnerPage`, `Faq`, `Quotes`, `sitemap.ts` | La estructura | Las etiquetas y las rutas |

**Conclusión**: aquí está el trabajo de H3. Casi todo se parametriza con dos cosas: **las
rutas del sitio** y **las etiquetas del negocio**. Ambas salen del blueprint.

## 3. Solo de este sitio

- `collections/Sessions.ts`, `Events.ts`, `Members.ts` → los módulos **catálogo**,
  **agenda con archivo** y **equipo**.
- `lib/events.ts` → el módulo temporal. Reutilizable tal cual en cualquier sitio con fechas.
- `lib/embeds.ts` → el módulo de medios embebidos.
- `Hero` con la próxima fecha, `EventRow`, `SessionCard`, `Members`, `styles.css`.

## 4. Lo que descubrió la diana y el yoga nunca contó

1. **El slug de un evento no puede salir del título.** Una noche mensual repite nombre y el
   slug es único: la segunda fecha no se crea. Lleva la fecha dentro. *Lo destapó el seed.*
2. **Una fecha deja de ser próxima cuando termina, no cuando empieza.** Si no, la fiesta de
   esta noche desaparece de la portada a media tarde.
3. **El archivo necesita el año.** "2 de agosto" no dice nada en una lista de fechas pasadas.
4. **Las horas se escriben en la zona de la sala**, no en la del visitante.
5. **Los embebidos obligan a tener consentimiento de verdad**, no un banner decorativo: hay
   que poder no cargarlos y ofrecer algo digno en su lugar.
6. **`max-width` en `ch` se resuelve con la tipografía del contenedor**, no con la del
   titular: la columna del hero medía 190px con un titular de 120px dentro.
7. **El lint de React prohíbe `Date.now()` en el render.** El "ahora" tiene que viajar con
   los datos, lo cual además es correcto: la misma página no puede colocar una fecha en
   "próximas" o "pasadas" según cuándo la ejecute React.
8. **Un gris elegido a ojo suspende el AA.** `#6f6a64` daba 3,67:1. Hay que medirlo, y por
   eso la auditoría de H4 debe medirlo sola.

## 4 bis. Lo que enseñó el despliegue (dos intentos fallidos)

9. **`payload migrate` no arranca si alguien ha corrido el modo dev contra esa base.** El
   modo dev deja una fila `batch = -1` en `payload_migrations` y el build se queda
   preguntando. Aquí pasó porque desarrollo y producción comparten rama de Neon. El
   generador tiene que **crear dos ramas desde el principio**, y el despliegue debe
   comprobar esa fila antes de construir (`scripts/fix-prod-migration.mjs` la limpia).
10. **La dirección pública de un proyecto de Vercel no se puede adivinar.**
    `<proyecto>.vercel.app` puede ser de otra persona (lo era), `<proyecto>-<equipo>.vercel.app`
    está detrás del SSO del equipo, y la pública es `<proyecto>-<palabra>.vercel.app`. Hay
    que **leer el alias real tras el primer despliegue** y solo entonces fijar
    `NEXT_PUBLIC_SITE_URL`. Mientras tanto el sitio redirige a un dominio que no existe.
11. **`next build` reutiliza su caché y puede dar en verde lo que Vercel da en rojo.** El
    type-check tiene que ser su propio comando (`npm run typecheck`), y lo que escondía era
    un error real: `.map(eventLine)` metía el índice del array en el parámetro `past`.
12. **El almacén Blob sí se crea desde la CLI** — me equivoqué al darlo por imposible: la
    versión 56 trae `vercel blob create-store`, que en versiones anteriores no existía.
    Requiere `--access public` (las imágenes se sirven directas desde el CDN) y conviene
    `--region fra1`, porque por defecto lo crea en Washington. Enlaza el almacén al proyecto,
    pone el token en los tres entornos **y en el `.env.local`**, con lo que las subidas
    locales pasan a ir al almacén de producción.

## 5. Lo que esto cambia del plan

- La **biblioteca de módulos se confirma**, y aparece uno que no estaba: *medios embebidos
  con consentimiento*.
- El **paquete legal es 100% núcleo** — más de lo que suponíamos.
- La **auditoría (H4) necesita cuatro comprobaciones nuevas**: contraste AA de la paleta
  del blueprint; que ningún `iframe` de terceros se cargue antes del consentimiento; que el
  host del canonical **responda 200 y no un redirect** (habría cazado el sitio redirigiendo
  a un dominio inexistente); y que no haya filas `batch = -1` en `payload_migrations`.
- El **generador (H5) tiene un orden obligado** en el aprovisionamiento: crear las dos ramas
  de Neon, desplegar una vez, **leer el alias real** y solo entonces fijar la URL pública.
- El **blueprint necesita un campo por módulo para las rutas**, porque la revalidación, el
  sitemap y el menú dependen de ellas.


---

# H2 — lo que se extrajo, y lo que enseñó

El núcleo existe: [`core/`](../core), 98 pruebas y **96,14% de mutación** con corte en 95%.
Subsuelo lo consume; Organic Yoga **no se toca** hasta que el núcleo tenga rodaje.

## Lo que se llevó

- **Lógica pura** (`sitewright-core`): identidad del dominio, imágenes, relaciones, slug,
  listas, escapado, tonos de sección, contenido con fecha, embebidos, decisiones del
  respaldo de imagen, frenos del formulario y las tres páginas legales.
- **Payload** (`sitewright-core/payload`): hooks de imagen, endpoint de restaurar,
  colecciones `media` y `users` como fábricas, y la fábrica de revalidación.
- **Cliente** (`sitewright-core/ui`): consentimiento, analítica condicionada, embebidos y
  los botones del panel.

De un sitio de 4.255 líneas, el sitio se queda con su dominio, sus secciones y su CSS.

## Lo que enseñó

13. **Un enlace simbólico no vale como paquete local**: con la raíz de Turbopack fijada al
    proyecto, `sitewright-core` no se resolvía. Se instala con `--install-links`, que
    además ensaya lo que pasará cuando esté publicado. Y **npm no refresca un `file:` con
    la misma versión**: hay que borrar la copia antes de instalar.
14. **El paquete tiene que ser ESM de verdad.** Con `moduleResolution: bundler`, TypeScript
    emite imports sin extensión: Turbopack los traga y Node no, así que el sitio compilaba
    pero sus pruebas no cargaban el núcleo. `NodeNext` y extensión `.js` en todos los
    imports relativos.
15. **Lo que se parametriza no es "el nombre del negocio", son tres cosas concretas**: las
    rutas (revalidación, sitemap, menú), las etiquetas que lee el cliente (el ejemplo del
    texto alternativo, los títulos de sección) y el identificador del sitio (la clave donde
    se guarda el consentimiento). El resto viaja igual.
16. **El núcleo no puede importar los tipos generados de un sitio.** Las formas mínimas
    (`MediaLike`, `LegalSettings`) van declaradas en el núcleo, o añadir un campo en el CMS
    de una web rompería la otra.
17. **La mutación paga el viaje.** Destapó un `.filter()` en las páginas legales que no
    podía quitar ninguna sección jamás: código muerto que nadie habría notado, y que la
    cobertura daba por probado.
18. **Los componentes de cliente sobreviven a `tsc`**: la directiva `'use client'` se
    conserva en `dist/`, y el `importMap` de Payload acepta apuntar a `sitewright-core/ui`.
    El panel monta sin quedarse en blanco.

## Lo que esto cambia del plan

- **H3 se estrecha**: la plantilla ya no tiene que "extraer" nada, solo colocar lo que el
  núcleo no puede saber. La lista de arriba (rutas, etiquetas, identificador) es
  literalmente el esquema mínimo del blueprint.
- **Publicar el núcleo deja de ser opcional**: `file:` no sobrevive a un despliegue en
  Vercel, porque allí solo se sube el repositorio del sitio.


---

# H3 — chasis y módulos

La plantilla compila y responde **estando vacía** (portada, tres páginas legales,
`llms.txt`, sitemap, robots, panel y API), y los **nueve módulos** existen, se cablean y
compilan juntos: se montó un sitio con todos activos y se construyó de verdad antes de dar
esto por bueno ([`modules/example/`](../modules/example)).

## La forma de un módulo

`module.json` (etiquetas por defecto, rutas, sección, qué aporta) · `collection.ts` (fábrica
parametrizada) · `Section.tsx` · `jsonld.ts` · `llms.ts` · `seed.ts`. Se **copian** al sitio,
no se importan: es la decisión de núcleo fino, y a partir de ahí son del sitio.

## Lo que enseñó

19. **Lo que varía de un negocio a otro son etiquetas y rutas, y nada más.** Las nueve
    fábricas terminaron con la misma firma —`{ labels, route }` más algún interruptor— y eso
    confirma el esquema mínimo del blueprint.
20. **Payload no acepta campos `readonly`.** El truco de `as const` para componer campos
    opcionales rompe el tipo `Field[]`; hay que anotar `as Field[]`.
21. **Turbopack no sigue un `node_modules` enlazado fuera de la raíz del proyecto**, así que
    ni para verificar vale el atajo: la copia de prueba tuvo que vivir dentro del repositorio
    con sus dependencias en enlaces duros.
22. **Un módulo no es solo una colección**: es colección + sección + rutas + su aporte al
    grafo y a `llms.txt` + su ejemplo. Separarlos habría dejado el trabajo de reunirlos en el
    generador, que es justo donde no debe estar.

## Lo que falta de H3

- El **contenido de ejemplo** (`seed.ts`) de cada módulo: los manifiestos lo declaran y no
  está escrito.
- Las **páginas propias** de cada módulo (`/servicios/[slug]`, `/agenda`…): la sección ya
  admite `contexto`, pero el armazón lo ensambla el generador en H5.
- El **cupo de inscripciones** que se decidió en la entrevista: el módulo de contacto guarda
  consentimiento y frena el abuso, pero no limita plazas.


---

# H4 — la auditoría

`npm run audit` existe, corre contra una web que esté respondiendo y **sale con código 1
cuando algo falla**, que es lo que la convierte en puerta y no en informe. Vive en el núcleo
(`sitewright-core/audit`), con 126 pruebas que comprueban no que funcione, sino que **caza
los fallos concretos que ocurrieron en producción**.

## Las puertas

| Puerta | Qué mira |
|---|---|
| identidad | Canonical, sitemap y robots nombran el mismo host, **y ese host responde 200 en vez de redirigir** |
| seguridad | `nosniff`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` |
| datos estructurados | El JSON-LD parsea, declara tipos, sus `@id` son del dominio y **sus referencias resuelven** |
| geo | `/llms.txt` existe y no se ha colado un `undefined` que el CMS nunca dijo |
| legal | Las tres páginas existen **y se enlazan desde la portada** |
| consentimiento | **Ningún iframe de terceros viaja en el HTML antes de aceptar** |
| imágenes | Todas con texto alternativo; aviso si se sirven sin medidas |
| contraste | AA sobre los tokens de la paleta, medido |
| peso | Techo del HTML de cada página |
| esquema | Sin filas `batch = -1` y con todas las migraciones aplicadas |

## Lo que pasó al estrenarla

23. **Cazó un fallo en caliente, en la primera ejecución**: Subsuelo tenía otra vez la marca
    `batch = -1` (dev y producción comparten rama, y yo había levantado el servidor). Es
    exactamente lo que tumbó el primer despliegue, esta vez detectado antes.
24. **En Organic Yoga cazó su hueco real**: no tiene aviso legal, ni privacidad, ni cookies,
    y recoge datos personales por formulario. Cuatro puertas en rojo, y ninguna es teórica.
25. **Una comprobación que no encuentra qué mirar tiene que decirlo.** El contraste
    desaparecía del informe cuando los tokens se llamaban de otra forma (`--washi`, `--sumi`),
    y un informe donde una puerta falta se lee igual que uno donde pasa. Ahora sale como "sin
    comprobar" y admite `--contrast-pairs`.
26. **Solo se miden parejas de texto**: un borde no se lee, y WCAG le pide 3:1, no 4,5:1.
    Medir `--line` da un rojo que no es un rojo.

## Lo que la auditoría todavía no mira

- **Accesibilidad de verdad** (axe en un navegador): hoy solo se mide el contraste de la
  paleta y el texto alternativo. Necesita Playwright y es H4.1.
- **Rendimiento de verdad** (LCP, CLS): hoy solo hay un techo de peso del HTML.
- **Que el formulario guarde el consentimiento**: se comprueba el iframe, no el envío.


---

# H5 — blueprint y generador

`node generate.js --blueprint <fichero> --out <directorio>` escribe un sitio completo, y lo
escrito **compila**: se generó una asociación cultural de ejemplo (siete módulos, paleta
clara, tipografía con serifa) y pasó tipos y build sin tocar una línea a mano.

## El blueprint

Tres cosas y una paleta: **identidad**, **módulos** (etiquetas y rutas) y **diseño**, más los
datos legales. Es pequeño porque la extracción se lo ganó, y su validador comprueba cosas que
duelen: dos módulos peleándose por la misma ruta, un formulario sin dirección a la que
escribir, un sitio sin titular legal. Diez pruebas con `node --test`, sin dependencias.

## Lo que enseñó

27. **Un módulo tiene que poder pedir sus propios campos en Ajustes.** El de contacto
    necesitaba un texto introductorio editable, y no existía forma de añadirlo: el generador
    ahora inyecta `settingsFields` de cada módulo. Sin eso, lo que el cliente lee lo decide
    el código, que es justo lo que este sistema evita.
28. **Las banderas booleanas no llevan valor detrás.** `--force` leía el argumento siguiente
    —que no existía— y no hacía nada: el generador regeneraba sobre una copia vieja y yo
    depurando un fallo que ya estaba arreglado.
29. **El cableado vive con el módulo, no en el generador.** Cada módulo trae su `wiring.js`
    con los trozos de código que le corresponden; el generador solo los ordena. Es lo que
    permite añadir un módulo sin tocar el generador.
30. **El aprovisionamiento se imprime, no se ejecuta.** Toca dinero y cuentas ajenas, y su
    orden no se puede adivinar: la dirección pública de un proyecto de Vercel solo se sabe
    **después** del primer despliegue.

## Los tres huecos, cerrados (dos de tres)

- **Páginas propias**: hechas. Cada módulo trae su índice y, cuando tiene sentido, su ficha
  (`indexPage` / `detailPage` en su `wiring.js`). El sitio de ejemplo compila con
  `/actividades`, `/actividades/[slug]`, `/calendario`, `/cuotas`, `/junta/[slug]` y
  `/preguntas-frecuentes`, y el sitemap las incluye — las de ficha dentro del `try`, porque
  necesitan base de datos y las fijas tienen que salir igual sin ella.
- **Contenido de ejemplo**: hecho. Cada módulo aporta su `seed`, y el generador los reúne.
  Dos decisiones dentro: el aviso emergente nace **desactivado** (un pop-up de ejemplo
  saludando al cliente en su web nueva es lo primero que tendría que ir a apagar), y las
  tarifas traen una **"a convenir"** a propósito, que es el caso que nunca debe publicarse
  como Offer y así la auditoría lo ve desde el primer día.
- **De blueprint a web desplegada**: **probado**. Con una API key de Neon se creó el proyecto
  `raiz-ejemplo` con sus dos ramas, se generó el sitio del blueprint, se migró, se sembró, se
  arrancó y **pasó la auditoría: 34 puertas, cero fallos**, con la comprobación de esquema
  hecha contra la rama de producción.

31. **`neonctl` funciona sin navegador con `NEON_API_KEY`**, así que un agente puede crear
    proyecto y ramas sin depender de un login interactivo. Es lo que faltaba para cerrar el
    hito de verdad.


## Lo que enseñó cerrar los huecos

32. **La paleta no llegaba al hero.** El degradado de respaldo y el velo estaban escritos con
    colores fijos oscuros, así que en una paleta clara el titular quedaba ilegible — y
    **ninguna puerta lo caza**: el contraste mide tokens, no texto sobre un degradado. Ahora
    ambos se construyen con `color-mix` sobre los tokens del sitio.
33. **Un módulo tiene que traer su CSS.** Las secciones de catálogo y precios pintaban clases
    que la hoja base no tenía y salían como una lista de enlaces subrayados. Cada módulo trae
    su `section.css` y el generador lo añade a la hoja del sitio.
34. **El menú es del sitio, no de la portada.** Las páginas interiores lo perdían y quedaban
    sin salida. Vive en `site.config.ts`, y lo pintan igual la portada y el armazón interior.
35. **La marca de modo dev aparece en cuanto arrancas `npm run dev` contra la rama de
    producción**, y le pasa a cada sitio nuevo. La cura no es limpiarla: son **dos ramas desde
    el minuto uno**, que es lo que ahora prescribe `provision.js` y lo que se hizo en el
    ejemplo.
36. **La auditoría de esquema hay que pasarla contra producción**, no contra desarrollo: la
    rama de dev tendrá marcas por definición, y son inofensivas ahí.


---

# H6 — la entrevista

La skill vive en [`.claude/skills/nuevo-sitio/SKILL.md`](../.claude/skills/nuevo-sitio/SKILL.md):
seis fases, quince preguntas de techo, y termina escribiendo un blueprint, generando el
sitio y pasándole la auditoría.

Lo que la hace distinta de "una IA que hace webs" está en dos reglas:

- **No preguntar lo que se puede deducir.** "Somos un colectivo de djs" ya dice que el
  catálogo se llama Sesiones, que hay fechas y que el tipo es `MusicGroup`. Proponer y dejar
  corregir es más rápido que interrogar.
- **No inventar nunca** precios, fechas, direcciones, titulaciones ni años de experiencia:
  lo que no consta va a la **hoja de encargo** que se entrega al final. Lo demás se redacta
  en borrador, entra en el blueprint como `content` y la auditoría avisa mientras siga sin
  revisar.

## Lo que hizo falta por debajo

- **El blueprint lleva los textos.** `content` por módulo y para los ajustes, sembrado por el
  generador: así el sitio es reproducible y nadie teclea dos veces lo mismo en el panel.
- **Una puerta nueva en la auditoría**: `contenido` avisa si sigue publicado el relleno del
  seed. Avisa y no falla, porque una web en construcción puede tenerlo y una puerta que
  bloquea un despliegue legítimo acaba desactivada.

37. **El generador descartaba en silencio los textos de portada del blueprint.** Una
    sustitución que no casaba, sin error y sin aviso: lo escrito en `content.settings`
    simplemente no llegaba. Lo destapó comprobar la salida en vez de fiarme de que el código
    hacía lo que decía. Es el argumento de siempre a favor de mirar el resultado.


---

# H7 — la prueba de fuego

Un **portafolio personal** (una ilustradora), que nadie había usado de referencia y que
activa un subconjunto distinto: cuatro módulos, sin agenda, sin equipo y sin precios. De
blueprint a web auditada, con su base de datos y sus dos ramas: **la parte mecánica son seis
minutos**. Lo valioso no es esa cifra, sino los siete fallos que salieron por el camino, que
ya están arreglados y que ninguna cantidad de compilar habría enseñado.

## Lo que se atascó

38. **El seed del catálogo no contemplaba `dated`.** Con fechas activadas, `publishedAt` es
    obligatorio y el seed no lo ponía: el sitio generado **no pasaba su propio `typecheck`**,
    aunque el seed corriera igual (tsx no comprueba tipos).
39. **La auditoría daba un error de Postgres en crudo** cuando la base de producción todavía
    no se ha desplegado nunca. Eso no es un fallo del sitio: es el estado normal antes del
    primer despliegue, y ahora se dice así.
40. **El banner de cookies prometía consentimiento para reproductores que ese sitio no
    tiene.** Un texto fijo hablando de SoundCloud y YouTube en una web de ilustración. El
    consentimiento ahora dice solo lo que el sitio hace de verdad.
41. **La página de preguntas frecuentes no estaba enlazada desde ningún sitio.** Existía, se
    generaba, entraba en el sitemap y no había forma de llegar a ella pinchando. Hizo falta
    un tercer sitio para verlo.
42. **Un residuo de una edición dejó un módulo con sintaxis rota, y el generador escribió un
    sitio a medias sin quejarse**: el directorio parecía generado y era la plantilla vacía.
    Ahora, si un módulo no carga, borra lo escrito y lo dice.
43. **La ruta al núcleo estaba fijada a un layout concreto.** `file:../sitewright/core` solo
    resuelve si el sitio es hermano del repositorio; se calcula desde donde cae el sitio.
44. **El sitio heredaba el `package-lock.json` de la plantilla**, que apunta al núcleo desde
    la plantilla: npm buscaba en un directorio que nadie había escrito y fallaba con un
    ENOENT que no explicaba nada. El lock ya no se copia.

## Lo que confirmó

- **Tres webs, tres caras distintas**: oscura y de cartel para el colectivo, clara y con
  serifa para la asociación, cálida y editorial para el portafolio. El enfoque de tokens más
  variantes aguanta sin que se note la plantilla.
- **Las secciones que no hay, no se notan**: el portafolio no tiene agenda ni equipo ni
  precios, y la portada no tiene huecos — el reparto de tonos se hace sobre lo que se pinta.
- **La auditoría hace de red de verdad**: en las tres webs ha cazado algo real, y en esta
  avisó del relleno del seed que sigue publicado, que es exactamente su trabajo.


---

# Publicar el núcleo

`sitewright-core@0.1.0`, MIT, público. Con eso un sitio generado ya se puede desplegar:
`file:` no sobrevive a Vercel porque allí solo se sube el repositorio del sitio.

45. **El ámbito `@sitewright` no estaba disponible** como organización, así que el paquete es
    **sin ámbito**: `sitewright-core`. Los imports quedan más cortos y no depende de que
    exista ninguna organización.
46. **npm devuelve 404 cuando la credencial no puede publicar**, no 403: un `.npmrc` que yo
    había dejado en la carpeta pisaba la sesión con un token de solo lectura y el error decía
    "no existe" en vez de "no puedes". Costó dos intentos entender que el problema era la
    credencial y no el nombre.
47. **Un `export` repetido en el `~/.zshrc` gana el último, no el primero.** Al leer la
    primera coincidencia estaba usando el token viejo mientras la terminal usaba el nuevo:
    mismo fichero, dos verdades distintas.


---

# El icono del sitio (v0.2 del núcleo)

Todos los sitios generados heredaban el favicon de la web de la que salió la plantilla. Se
arregla en dos piezas, y la restricción que manda es vieja conocida:

- **La dirección tiene que ser estable.** Dentro de la carpeta de la app, Next le pone un
  hash que cambia en cada despliegue, y Google necesita una URL fija para asociar el icono
  al sitio: mientras no la tiene, enseña el globo genérico. Por eso los ficheros viven en
  `public/` y la subida del CMS **no** se sirve desde su dirección del almacén —que cambia
  con cada subida— sino desde una ruta fija, `/icono.png`.
- **El cliente lo cambia sin desplegar**: un campo `favicon` en Ajustes y esa ruta sirviendo
  sus bytes.

El generador escribe `public/icon.svg` con las iniciales del nombre sobre el color de acento
del blueprint, y `npm run icons` lo convierte en `favicon.ico` (48×48, que es lo que Google
pide), `apple-icon.png`, `icon-192.png` e `icon-512.png`.

48. **Un `metadata` estático y un `generateMetadata` no pueden convivir** en el mismo
    segmento: Next lo rechaza. Lo que no depende del CMS se queda en una constante privada
    y se mezcla dentro de `generateMetadata`.
49. **npm sirve la versión cacheada aunque el `package.json` pida otra.** Tras publicar
    0.2.0, la plantilla siguió instalando 0.1.0 hasta pedirla explícitamente con
    `--prefer-online`. Media hora de "pero si ya está publicado".


50. **Producción tenía el esquema empujado por detrás.** Al desplegar el icono, la migración
    murió con "la columna ya existe": `favicon_id`, su clave y su índice estaban en la base
    de producción **sin fila en `payload_migrations`**. El esquema era exactamente el que la
    migración crea, así que se resolvió registrándola como aplicada.

    **No he podido determinar cuándo se empujó.** El `.env` local apunta a la rama `dev`
    desde el 28, `.env.local` no lleva `DATABASE_URL`, y la auditoría había dado producción
    limpia después del despliegue anterior. Lo que sí quedó claro es que la marca `batch = -1`
    que reapareció era el síntoma del mismo hecho. Si vuelve a pasar, el culpable es algo
    ejecutando Payload en modo desarrollo contra la cadena de producción; la puerta de
    esquema lo caza antes de cada despliegue, que es justo para lo que está.

51. **"Faltan migraciones" es un falso rojo antes de desplegar.** La auditoría lo marca en
    rojo y en ese momento es lo normal: las aplica el build. La comprobación vale **después**
    del despliegue, y así lo dice DEPLOY.md.


---

# Lo que enseñó la primera web hecha por otra persona

Sandunguera (una DJ, cliente real) la generó otro agente con la skill. Comparando lo
generado con lo que quedó, el agente tuvo que tocar cinco cosas y **tres eran huecos de la
herramienta**, no decisiones de esa web. Se han traído dos, más una tercera de higiene:

52. **El color del texto del botón estaba cableado.** La plantilla escribía `#14100f` en
    `.btn-primary`: se lee sobre un acento claro y desaparece sobre uno oscuro, y **ninguna
    puerta lo cazaba** porque medir `--ink` sobre `--ground` no dice nada del texto sobre un
    botón. Ahora lo calcula el generador (`buttonColors`, en el núcleo) y la auditoría mide
    la pareja `--on-accent` sobre `--accent`.

    El detalle que lo hace interesante: en esa paleta —granate y mango— **ningún texto
    servía para el acento y su versión suave a la vez**. El agente lo resolvió a mano
    dejando el hover en el propio acento oscurecido; la función deriva ahora exactamente esa
    misma conclusión, y prefiere los colores del sitio antes que blanco o negro para que la
    web siga pareciéndose a sí misma.

53. **Faltaba la presentación.** El agente añadió a mano un campo "Sobre mí" y su sección:
    todo negocio tiene una, y el blueprint no sabía expresarla. Es el décimo módulo, y el
    primero **sin colección** — vive en Ajustes, porque es un texto que su dueño reescribe,
    no una lista. Eso obligó a que el generador tolere módulos sin colección ni consulta.

54. **Un módulo sin datos propios escribía un hueco en la desestructuración** de
    `llms.txt` (`const { settings, , faqs }`): un `null` colado en una lista de variables.
    Compilaba en el generador y rompía en el sitio.

55. **Los sitios generados nacían sin guía.** El único `CLAUDE.md` que tenía Sandunguera
    importaba las reglas de Next y nada más. Ahora el generador escribe una con lo que ya
    nos ha mordido: dos ramas de Neon, migración obligatoria, el favicon con dirección
    estable, el `importMap` tras tocar el panel, y que el núcleo **no se edita desde el
    sitio**. Quien abra ese repositorio después será otro agente, y llegaba sin nada.

Lo que **no** se ha traído: los comentarios que justifican esa paleta concreta, el dominio
sin `www` y el vinilo dibujado a mano. Son de esa web. Aunque el `www` deja tarea: la
entrevista tiene que preguntarlo, porque decide qué versión indexa Google y hubo que editar
`site.config.ts` a mano.


56. **Los sitios generados nacían con tres pruebas en rojo.** Las del middleware y la
    identidad venían de la plantilla con `example.com` escrito a mano, y el generador nunca
    las adaptaba: cualquier web salía suspendiendo su propia batería desde el minuto uno, y
    quien la generó no llegó a ejecutarla. Ahora leen el dominio de `site.config.ts`, así
    que no pueden desfasarse.

57. **Un sitio puede tener tres dominios distintos a la vez**: el del blueprint, el de
    `site.config.ts` y el de `NEXT_PUBLIC_SITE_URL` — y este último gana en ejecución. En
    Sandunguera el blueprint decía `www`, la configuración no, y el `.env` volvía a decir
    `www`. La entrevista tiene que preguntar **con o sin www** y el generador escribir esa
    respuesta en los tres sitios.


58. **La puerta de imágenes marcaba en rojo lo que estaba bien.** Buscaba `srcset` en
    minúsculas y React sirve `srcSet`: cada `next/image` de cada web salía como "sin
    optimizar". Un aviso que miente entrena a la gente a ignorar el informe, que es la peor
    avería posible en una auditoría.

59. **El logo era la única imagen sin optimizar de verdad.** Iba como `<img>` a pelo porque
    "se ve pequeño y da igual el tamaño" — pero quien elige ese fichero es el cliente, que
    sube lo que tiene. Ahora el núcleo expone las medidas guardadas (`mediaSize`) y el menú
    lo sirve con `next/image`: en Sandunguera pasó de 17,9 KB a 2,2 KB en móvil, en todas
    las páginas.


60. **El banner de cookies no depende de si hay terceros, sino de si hay algo que decidir
    *antes* de actuar.** La medición se dispara al cargar la página, así que hay que
    preguntar de antemano; un reproductor solo se carga cuando alguien quiere oírlo, y su
    marcador de posición ya pide permiso allí mismo, con lo que la persona ha venido a
    buscar delante. De ahí que una web llena de audio embebido pueda no necesitar banner y
    una con solo un contador de visitas sí. Lo decide `needsCookieBanner`, y en Ajustes hay
    un control de tres posiciones: automático, siempre, nunca.

61. **Apagarlo tiene una consecuencia que no es obvia**, así que la casilla que lo confirma
    es obligatoria para guardar: sin banner, la medición **no se carga nunca** —nadie puede
    aceptarla— mientras que los reproductores siguen funcionando. La advertencia vive en el
    núcleo (`BANNER_OFF_WARNING`) para que el panel y la documentación no puedan contar
    cosas distintas.

62. **La política de cookies afirmaba algo falso.** Con la analítica sin consentimiento
    decía "no medimos las visitas" mientras las medía: el interruptor solo quitaba la
    pregunta, no la medición. Y había una prueba que fijaba esa frase, es decir, que
    defendía el error. Ahora distingue los tres casos de verdad.


63. **El icono del CMS se servía como WebP bajo una etiqueta que decía PNG.** La ruta
    `/icono.png` devolvía los bytes tal cual llegaban del almacén, y la página los declaraba
    `type="image/png"`: un navegador puede descartar el icono por esa incoherencia y quedarse
    sin ninguno, que es exactamente lo que se veía. Ahora la ruta **convierte con sharp** a
    PNG de 512×512 con recorte centrado, así que el nombre, el tipo declarado y los bytes
    dicen lo mismo — y el cliente puede subir lo que tenga, que era el punto de tener el
    campo.


64. **El listón de mutación se había caído sin que nadie mirase.** Al añadir color, iconos y
    consentimiento pasó del 96% al **89,98%**, por debajo del corte de 95: entraron módulos
    con pruebas que los ejecutaban sin comprobar lo que dicen. Se arregló fijando las listas
    de iconos enteras y la identidad de los colores derivados, no relajando el umbral.

65. **Stryker daba por supervivientes mutantes que sí mueren.** Los que tocan una constante
    de módulo (`FALLBACK_INKS`, `CMS_ICON_ROUTE`) no se pueden evaluar porque el ejecutor no
    reevalúa el módulo, y se contaban como fallos de las pruebas. Comprobado a mano —
    cambiando la constante, la batería falla— y configurado `ignoreStatic`. Contarlos era
    medir el ejecutor, no las pruebas.


---

# v1.1

66. **Una página del sitemap a la que no lleva ningún enlace es una página que nadie lee.**
    La auditoría hace ahora un recorrido corto desde la portada —hasta veinticinco páginas—
    y compara lo alcanzable con lo publicado en el sitemap. Es la puerta que habría cazado
    la página de preguntas huérfana de la tercera web.

67. **El dominio se pregunta y se escribe en los tres sitios.** La entrevista pide
    explícitamente con o sin `www` —y enseña a comprobarlo con un `curl`, porque el que
    responde 200 es el canónico y el que devuelve 308 no— y el generador lo escribe también
    en `.env.example`, que era el tercer lugar donde vivía y el que ganaba en ejecución.

68. **La conexión de producción tiene que ser la agrupada.** Con el endpoint directo, cada
    función abre su propia conexión y el límite se agota justo cuando hay tráfico. Hay puerta.

69. **`vercel env pull` redacta las variables sensibles**, así que leí once caracteres de
    relleno y concluí que las dos webs usaban el endpoint directo. No se puede comprobar
    desde fuera qué cadena usa un despliegue: la puerta mide **la que le pasas**. Las dos
    quedaron con la agrupada porque la escribí yo, no porque lo verificara.


70. **El dominio puede no existir todavía**, y es el estado normal de una web durante la
    semana en que se construye. El blueprint ya no lo exige: sin él, el sitio usa
    `VERCEL_PROJECT_PRODUCTION_URL` —la dirección que la plataforma da al proyecto, real
    desde el primer despliegue y que pasa a ser la definitiva cuando se configura el dominio
    ahí—. El orden es: lo que alguien escribió, lo que dice el blueprint, lo que da la
    plataforma, y localhost.

71. **Un canónico que no es público no puede ser destino de una redirección.** Sin dominio,
    `SITE_URL` puede resolver a `localhost`, y el middleware habría mandado a cada visitante
    de producción a su propia máquina. Ahora comprueba que el canónico sea https y no sea
    local antes de redirigir a ningún sitio: nunca debería dispararse, y el coste de
    equivocarse ahí es la web entera.

72. **Una prueba no puede depender de que el blueprint traiga dominio.** La del middleware
    leía la dirección resuelta, que con dominio pendiente es `localhost`, y probaba algo que
    no existe. Ahora fija el suyo y recarga el módulo.

73. **Publiqué el núcleo con el listón de mutación en rojo** (94,66%) por no medirlo antes de
    publicar. El artefacto no cambió —faltaban pruebas, no código— pero el orden correcto es
    medir y luego publicar. Va en el guion de publicación.


74. **Un guion puede mentir terminando con éxito.** `core:sync` existía justo para evitar
    que un sitio se quedara con un núcleo viejo, y borraba `node_modules/@sitewright`: un
    nombre muerto desde que el paquete pasó a llamarse `sitewright-core`. Borraba nada,
    salía con cero, y el sitio seguía con la copia antigua. Tres veces lo pagué creyendo
    que era despiste mío. Lo que hay que comprobar es el efecto —el hash de lo instalado
    contra lo construido—, no el código de salida.

75. **Lo que no es un guion, una puerta o un hook hay que recordarlo**, y recordar es
    justo lo que falla. Los tropiezos repetidos no estaban en el código, que tiene 174
    pruebas y un listón de mutación, sino en publicar, instalar, desplegar y comprobar,
    que no tenían ni una puerta. Las reglas cortas viven ahora en `CLAUDE.md`, cada una
    con el comando que la verifica; este cuaderno es el archivo, no la chuleta.


76. **La CI encontró algo antes de existir del todo.** Al escribirla salió que
    `payload-types.ts` está en `.gitignore` a propósito —cada sitio genera el suyo— y que
    por tanto la copia de cada quien se queda atrás cuando alguien añade un campo. La mía
    no conocía `favicon` ni `cookieBanner`, así que mi `typecheck` local llevaba tiempo
    comprobando una forma de los datos que ya no era la real. La CI los genera antes de
    mirar, que es la única manera de que lo comprobado sea lo que hay.

77. **`node --test <directorio>` intenta cargar el directorio como módulo** en Node 24 y
    falla con un error que habla de un módulo que nadie escribió. Hay que darle ficheros.

78. **La auditoría lee `DATABASE_URL` del entorno que la lanza, no del entorno que
    audita.** Auditando `https://www.sandunguera.es` desde el portátil, la puerta de la
    conexión agrupada mira la cadena de *desarrollo* —directa, como debe ser en local— y
    da un fallo que no existe en producción. Lo ambiental miente: esa comprobación
    debería exigir una cadena pasada a propósito, no coger la que haya puesta.


79. **Un fichero llamado `checks2` es un fichero sin nombre.** Las dieciocho puertas se
    partieron en dos por tamaño, no por sentido. Ahora van por lo que vigilan —que la web
    se encuentre, lo que leen las máquinas, lo que puede acabar en multa, y lo que ve
    quien entra—, que es como se buscan.

80. **Los módulos no se compilan en ninguna parte.** Sólo existen dentro de una web
    generada, así que un error de tipos en un módulo no lo ve nadie hasta que hay un
    cliente delante; por eso cinco colecciones llevaban meses con el objeto devuelto mal
    indentado. La CI genera ahora una web de ejemplo y la comprueba entera.

81. **El generador conocía a un módulo por su nombre.** `notices` estaba escrito a mano
    seis veces en el cargador de datos, y el reloj del render venía de tapadillo dentro de
    su propio código: un segundo módulo que eligiera entre lo consultado habría declarado
    `now` dos veces y roto la compilación. Ahora `dataPick` es parte del contrato —de
    dónde elige, qué ata y qué vale cuando la base no responde— y el generador no escribe
    el nombre de ningún módulo.

82. **El generador llevaba a mano la lista de qué colección es cada módulo**, que cada
    módulo ya declara en su `collection.ts`. Faltaba `contact`, así que sembrar contenido
    suyo habría escrito `collection: 'undefined'`. Ahora lo dice el cableado.

83. **Un cableado son veinticuatro claves opcionales sin esquema**: una errata no rompe
    nada, sólo deja sin escribir esa parte de la web, en silencio. El generador valida
    ahora el contrato y no genera nada si no cuadra. La primera vez que se ejecutó
    protestó por `variable` en dos módulos donde el `null` era deliberado: la regla estaba
    mal, no los módulos, y distinguir «no lo declara» de «lo declara vacío» es justo lo
    que hace útil al contrato.


84. **El repositorio no podía generar una web.** `template/.env.example` lo tapaba el
    `.env*` del `.gitignore`, así que nunca estuvo versionado: todas las webs se generaron
    con la copia sin seguimiento de mi portátil. Desde un clon limpio, el generador se
    paraba en el primer `read`. Lo descubrió la CI en su primera ejecución, que es
    exactamente para lo que está.

85. **La plantilla llevaba el nombre de la primera web que se hizo con ella.** El ejemplo
    de entorno decía `EMAIL_FROM_NAME=Subsuelo`, y eso viajó a todas: quien copiara el
    ejemplo sin mirarlo mandaría los correos de su cliente firmados por otro. Ahora lo
    escribe el generador con el nombre de quien encarga la web.


86. **El sitemap se decidía al generar y no según lo que hay.** Anunciaba `/junta`, que
    **no existe** —team sólo escribe fichas—, y anunciaba secciones que dicen «todavía no
    hay nada publicado». Ahora se construye desde las páginas que de verdad se escriben y
    desde el mismo cargador que las pinta, así que no puede prometer nada distinto de lo
    que se verá. El menú usa la misma condición, para que lo que se le cuenta a un
    buscador y lo que ve una persona no puedan discrepar.

87. **La auditoría no sabía distinguir una sección vacía de una página vacía.** La primera
    versión de la puerta marcó la portada de sandunguera, que enseña «todavía no hay bolos
    confirmados» en una sección de cinco: eso es contenido. Una página está vacía cuando
    **todas** sus secciones lo están.

88. **Nadie llevaba la cuenta de cuánto se ha quedado atrás una web.** subsuelo lleva desde
    agosto siete versiones por detrás del núcleo, con arreglos que le harían falta, y no
    había forma de saberlo sin mirarlo a mano. `npm run doctor -- ../<sitio>` lo dice, y la
    auditoría avisa —sin fallar: una web atrasada sigue funcionando—.

89. **Publicar sin registro de cambios hace inútil saber que vas atrasado.** Saber que
    faltan siete versiones no ayuda si no dice qué traen. `core/CHANGELOG.md` se escribió
    hacia atrás desde el historial, y está redactado para quien decide si le compensa
    actualizar, no para quien escribió el código.


90. **El módulo de equipo hacía fichas y no índice.** Para la junta de una asociación
    bastaba con el trozo de portada, pero la quinta web es un colectivo cuyo sentido
    declarado es la visibilidad de quienes lo forman: sin `/selectas` no hay página que
    enlazar, ni que compartir, ni que indexe un buscador. Y era además la causa de que el
    sitemap anunciara `/junta`, una ruta sin página. Ahora el módulo trae índice y entrada
    de menú, como los demás.

91. **La página propia de una sección pintaba un `<h2>` vacío.** El índice le pasa
    `title=""` porque el encabezado es el `<h1>` de la página, y la sección lo pintaba
    igual. Sólo le pasaba a `catalog` —lo comprobé en vez de suponerlo— y ahora, sin
    título, no hay cabecera.


92. **Cambiar el `package.json` de la plantilla sin su lockfile deja la CI en rojo.**
    `npm ci` se niega si no cuadran, y el error no menciona la publicación que lo causó:
    el guion de release actualizaba uno y no el otro. Ahora refresca los dos.


93. **Un blueprint podía hacer que el generador escribiera TypeScript inválido.** Los
    ajustes que se siembran se concatenaban por trozos, así que redactar en
    `content.settings` una clave que ya salía de `identity` —la ciudad— producía un objeto
    con la misma propiedad dos veces. Ahora es un mapa: un solo sitio donde se decide, y lo
    redactado en la entrevista pisa a lo deducido, que es el orden correcto. El blueprint
    de ejemplo lleva ya esa colisión para que la CI la vigile.

94. **Regenerar con `--force` borra el directorio entero**, `node_modules` incluido. Es lo
    que promete —y es lo correcto, porque media web vieja mezclada con media nueva es
    peor— pero cuesta una instalación completa cada vez.


95. **`\bempty\b` cuenta el guion como frontera de palabra.** La puerta de páginas vacías
    daba por hueca la página de las doce Selectas porque cada ficha sin retrato pinta un
    `member-photo-empty`. Mi prueba cubría el sufijo (`not-emptyish`) y no el prefijo, que
    es justo el caso real. La clase tiene que ser exactamente `empty`, no contenerla.


96. **npm dice `ok` y sale con cero antes de que la versión se pueda instalar.** La deja
    «preparada» y tarda minutos en propagarse: el `npm install` que venía detrás falló con
    un ETARGET que no mencionaba la publicación, y un reintento contestó «no se puede
    publicar sobre la versión 0.8.1 ya preparada», que fue la única pista de que sí había
    llegado. Publicar y dar por hecho que ya está es otro caso de herramienta que miente;
    el guion espera ahora a que el registro la sirva de verdad.


97. **El cableado hacía inalcanzable una condición del propio módulo.** La sección de
    agenda se esconde si no hay nada por delante *y* nadie ha pedido un texto de espera
    —`if (!upcoming.length && !emptyText) return null`— pero el cableado pasaba siempre un
    texto por defecto, así que la portada de una web recién hecha anunciaba «no hay nada
    convocado» y enlazaba a una página vacía. Ahora el texto es opcional de verdad.

98. **Regenerar una web ya desplegada la destruye.** `--force` borra el directorio entero:
    `.env`, `.vercel`, las migraciones escritas a mano y `node_modules`. El generador se
    ejecuta una vez por web; a partir de ahí, los cambios del blueprint hay que llevarlos
    a mano. Es la deuda más grande que queda.


99. **Resuelto el misterio de subsuelo.** La marca de modo dev en producción la deja
    **sembrar la base de producción**: un `payload run` con el esquema en modo desarrollo
    empuja el esquema y escribe una fila con `batch = -1`, que bloquea el `migrate` del
    siguiente build. La puerta de la auditoría lo cazó en la quinta web a los diez minutos
    de existir, y ahora el guion de aprovisionamiento manda limpiarla en el mismo paso.

100. **El aprovisionamiento tenía un paso que ya sobraba.** Decía cazar el alias bueno a
     mano y escribir `NEXT_PUBLIC_SITE_URL`; desde que el sitio puede existir sin dominio
     lo resuelve solo, y se comprobó aquí: sin tocar nada, la web declaró
     `https://selectas.vercel.app`, que es justo la que responde 200.


101. **Cada web se quedaba con el README de la plantilla**, que habla del chasis y apunta a
     `../core`, un directorio que no existe al lado de un sitio generado: quien abría el
     repositorio de su propia web leía la documentación de otra cosa. Ahora el generador
     escribe uno para quien la mantiene.

102. **Crear el repositorio no termina el trabajo, y hacen falta dos permisos que ningún
     guion puede darse a sí mismo**: el token de `gh` no puede subir `.github/workflows`
     sin el ámbito `workflow` —hay que empujar por SSH— y la app de Vercel en GitHub tiene
     que tener el repositorio nuevo en su lista, o `vercel git connect` falla diciendo que
     quizá hay una errata. Los dos van ahora en el guion de aprovisionamiento.


103. **Lo que sólo imprime, nadie lo ejecuta.** `provision.js` se rompió con una comilla
     invertida dentro de una plantilla literal —escribiendo, precisamente, la lección
     sobre la marca de modo dev— y se subió roto: ningún trabajo de la CI lo llamaba.
     Ahora lo llama uno.


104. **El `--url` que escribe una persona no ganaba al del guion.** El `audit` de cada web
     trae su propio `--url` por defecto, y el CLI se quedaba con la primera aparición: con
     el servidor local levantado, `npm run audit -- --url https://…` auditaba localhost y
     el informe no decía contra qué. Varias veces di por auditada producción cuando estaba
     leyendo mi portátil. Ahora gana el último, y la auditoría de producción de verdad
     —lanzada llamando al CLI directamente— sale en 37 de 37.


105. **La única lógica del binario vivía donde no se podía probar.** Leer un argumento
     estaba dentro de `cli.ts`, que se ejecuta al importarlo: probarlo exigía lanzar una
     auditoría entera, así que nadie lo probó y el fallo del `--url` entró sin resistencia.
     Ahora está en `args.ts` con seis pruebas, incluida la que fija que gana el último.


106. **Faltaba el módulo de la tira de logos.** «Colaboran», «con el apoyo de»,
     «patrocinan»: lo necesita cualquier colectivo, asociación u ONG antes que casi nada,
     y no estaba. Dos decisiones que no son obvias: el **nombre es obligatorio y el logo
     no** —un logo sin nombre no se puede describir a quien no lo ve, y un colaborador
     anunciado antes de tener su imagen es normal mientras se recopilan—, y los logos se
     sirven **a altura fija**, porque igualarlos por ancho encoge los apaisados hasta lo
     ilegible. Sin semilla: un logo de ejemplo no existe.


107. **Menos generación y más configuración: el manifiesto.** El generador escribía a mano
     en la configuración de Payload, el cargador de datos, el sitemap y `llms.txt`, así que
     llevar un módulo a una web ya desplegada eran quince ediciones —lo medí añadiendo
     «Colaboran» a Selectas—. Ahora escribe un solo fichero, `src/site.modules.ts`, con qué
     módulos hay, qué le pide cada uno a la base y qué aporta; y esos cuatro consumidores
     son bucles genéricos de la plantilla. El generador pasó de mil líneas a 776.

108. **Lo que no se movió al manifiesto, y por qué.** La portada sigue generada. Un
     registro genérico de componentes obliga a tipar sus props como `any`, y hoy cada
     llamada de la portada se comprueba una por una; esa comprobación vale más que el bucle
     que se ahorraría. El tipo del contenido sí sale del manifiesto, derivado del esquema
     de Payload (`Config['collections'][…]`), así que no puede quedarse viejo.

109. **Las once secciones no llamaban igual a lo mismo.** `faqs`, `people`, `prices`,
     `partners`, `reviews`: cinco nombres para «lo que esta sección pinta». Sin un contrato
     uniforme no hay bucle posible, así que todas reciben `items`. Y las ocho funciones de
     `llms.txt` pedían cada una lo suyo —una la ruta, otra el reloj, otra dos encabezados—:
     ahora reciben `(items, ctx)`.


110. **Las páginas de las secciones eran JSX dentro de una cadena de texto.** Sesenta
     líneas de componente metidas en `wiring.js`, sin resaltado, sin autocompletado y sin
     comprobar hasta que alguien generaba una web. Ahora cada módulo trae su `Page.tsx` y
     **una sola ruta** —`[seccion]`— las sirve todas: el generador pasó de escribir ocho
     páginas a escribir dos, y las dos que quedan son las fichas, que necesitan su propio
     `generateStaticParams`.

111. **El manifiesto lo lee también la configuración de Payload**, así que importar desde
     él los componentes de página arrastraba React hasta el CLI y este se atragantaba con
     la primera hoja de estilos que encontraba (`react-image-crop`). Se cargan en diferido:
     `Page: () => import('…')`. Una función que nadie llama no arrastra nada.

112. **El título de una sección no es el nombre de su página.** En la portada puede
     llamarse «La plataforma» y su página seguir siendo «Selectas», que es lo que la gente
     escribe y busca. Al unificar las páginas se perdió esa distinción durante un rato: el
     manifiesto lleva ahora las dos.


113. **El problema de una tira de logos no es el fichero, es que llegan mezclados**: uno en
     PNG transparente con tinta negra, otro en JPG con recuadro blanco, otro a todo color.
     Sobre fondo crema los recuadros se ven como rectángulos; sobre fondo oscuro la tinta
     negra desaparece. Se arregla **sin tocar la imagen**: el panel pregunta cómo es el
     logo y el CSS hace el resto. Un logo es la marca de otra persona y editarlo puede
     saltarse sus normas de uso; casi todas las organizaciones tienen ya su versión en
     negativo, y pedirla es más rápido que fabricarla.

114. **Un selector no puede preguntar por el esquema de color, pero sí usarlo en un
     cálculo.** El generador escribe `--logo-invert: 0` en una web clara y `1` en una
     oscura, así que `filter: invert(var(--logo-invert))` es literalmente no hacer nada
     cuando toca no hacer nada, y la regla se escribe una sola vez en vez de dos veces por
     esquema. Lo mismo con `--logo-box-blend`: `multiply` borra un recuadro blanco sobre
     claro, y `screen` lo borra sobre oscuro una vez invertido.


115. **«Quitar el fondo» son dos cosas de dificultad muy distinta.** Un fondo plano —el
     recuadro blanco de un logo— se quita mirando las cuatro esquinas y volviendo
     transparente lo que se les parezca; recortar de verdad una foto necesita un modelo de
     segmentación, que serían 170 MB en cada despliegue o mandar las imágenes de una
     clienta a un tercero. Se ha hecho lo primero, y se llama por su nombre.

116. **Negarse es una respuesta.** Si las esquinas no coinciden no hay fondo que quitar, y
     si el fondo es casi toda la imagen quitarlo la dejaría en blanco. En los dos casos se
     dice por qué en vez de devolver algo estropeado: un botón que a veces arruina la
     imagen es peor que uno que a veces dice que no.

117. **Un array de bytes no recorta lo que se sale, le da la vuelta.** Al calcular la
     transparencia de un borde, un valor por encima de 255 no queda en 255 sino en el
     resto de dividir entre 256: un píxel casi opaco acababa casi transparente. El tope va
     explícito, y esa línea es justo la que mató tres mutantes.


118. **El velo de la portada no era una opción, eran dos cosas a la vez**: `brightness(0.5)`
     sobre la foto **y** un degradado negro del 35 al 50% encima. Apagar la foto entera es
     lo único que garantiza que el título se lea sobre cualquier imagen, y por eso sigue
     siendo lo de siempre; pero quien ha elegido esa foto quiere que se vea.

119. **«Sólo detrás del texto» es la respuesta de diseño, no el interruptor.** Un degradado
     radial que nace donde está escrito deja la foto intacta y el título legible. Se sale
     del bloque de texto a propósito: un velo que termina justo en la letra se nota.
     Ofrecer sólo «sí/no» habría dejado a la gente eligiendo entre una foto apagada y un
     título ilegible.
