# H1 — qué es común y qué no

Cuaderno de campo del hito 1: la web del colectivo de djs ([subsuelo](../../subsuelo))
construida a mano sobre el chasis de [Organic Yoga](../../organicYoga). Esta es la materia
prima de H2: **lo que aparezca como igual es candidato a núcleo; lo que aparezca como
distinto se queda en el sitio.**

Estado: la diana está en verde en local (lint, 66 pruebas, build) y sin desplegar.

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

## 5. Lo que esto cambia del plan

- La **biblioteca de módulos se confirma**, y aparece uno que no estaba: *medios embebidos
  con consentimiento*.
- El **paquete legal es 100% núcleo** — más de lo que suponíamos.
- La **auditoría (H4) necesita al menos dos comprobaciones nuevas**: contraste AA de la
  paleta del blueprint y que ningún `iframe` de terceros se cargue antes del consentimiento.
- El **blueprint necesita un campo por módulo para las rutas**, porque la revalidación, el
  sitemap y el menú dependen de ellas.
