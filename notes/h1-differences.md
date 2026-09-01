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
