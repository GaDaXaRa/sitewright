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
12. **El almacén Blob no se crea desde la CLI**: es un paso de panel. Sin él, subir imágenes
    falla en producción aunque todo lo demás funcione.

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

- **Lógica pura** (`@sitewright/core`): identidad del dominio, imágenes, relaciones, slug,
  listas, escapado, tonos de sección, contenido con fecha, embebidos, decisiones del
  respaldo de imagen, frenos del formulario y las tres páginas legales.
- **Payload** (`@sitewright/core/payload`): hooks de imagen, endpoint de restaurar,
  colecciones `media` y `users` como fábricas, y la fábrica de revalidación.
- **Cliente** (`@sitewright/core/ui`): consentimiento, analítica condicionada, embebidos y
  los botones del panel.

De un sitio de 4.255 líneas, el sitio se queda con su dominio, sus secciones y su CSS.

## Lo que enseñó

13. **Un enlace simbólico no vale como paquete local**: con la raíz de Turbopack fijada al
    proyecto, `@sitewright/core` no se resolvía. Se instala con `--install-links`, que
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
    conserva en `dist/`, y el `importMap` de Payload acepta apuntar a `@sitewright/core/ui`.
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
