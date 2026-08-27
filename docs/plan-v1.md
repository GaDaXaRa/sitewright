# Sitewright — plan de la v1

> Versión navegable: https://claude.ai/code/artifact/b4bcc857-d055-458d-b864-e80fbf625b1f
> Acordado el 27 de agosto de 2026.

## El problema

Lo valioso de Organic Yoga no es su código, son sus decisiones: su `CLAUDE.md` guarda unas
veinticinco lecciones caras (el canonical apuntando al subdominio de Vercel, el favicon con
dirección estable, un hook que escribe necesitando `req`, los fondos de sección repartidos
en tiempo de render). Si cada web nueva se improvisa en una conversación, eso se pierde en
el sitio número dos y la calidad pasa a ser una lotería.

Sitewright congela esas decisiones en código y en comprobaciones automáticas, y deja a la
conversación solo lo que de verdad cambia: qué muestra el negocio, cómo habla y qué aspecto
tiene.

## Arquitectura: cuatro piezas

1. **Núcleo** (`core/`) — lo invariante: lógica pura, hooks, colecciones base, sistema de
   imágenes, constructores de SEO y JSON-LD. Paquete npm consumido por ruta local. Aquí
   viven las pruebas duras y la mutación.
2. **Blueprint** (`site.json`) — las respuestas de la entrevista. La conversación no
   escribe código: escribe este fichero, que se edita a mano, se versiona y se reejecuta.
3. **Generador** (`generator/`) — scripts deterministas: andamiaje, módulos, tokens, seed,
   aprovisionamiento. La IA solo escribe lo irrepetible: textos, hero y campos propios.
4. **Auditoría** (`npm run audit`) — las puertas que no se pueden saltar. Es lo que hace
   que "profesional" sea repetible en vez de aspiracional.

## Decisiones cerradas

| Asunto | Decisión | Por qué |
|---|---|---|
| Modelo de contenido | Módulos componibles, no plantillas por sector | Servicios, proyectos y eventos son el mismo módulo con otra etiqueta |
| CMS | Siempre Payload + Neon | Un solo camino de código; lo que se dimensiona son las colecciones |
| Idiomas | Solo español | Textos fijos de interfaz centralizados para no rastrear después |
| Infraestructura | Vercel + Neon + Blob + Resend, cuentas propias, aprovisionamiento automatizado | Tras una capa de proveedor, para poder añadir VPS o cuentas del cliente |
| Conversión | Contacto e inscripción con cupo, sin pagos | Trasplante de `Enrollments`, con enganche post-envío listo |
| Legal | Paquete RGPD obligatorio | Aviso legal, privacidad, cookies, consentimiento con fecha, analítica tras el banner |
| Contenido | Borrador de IA + hoja de encargo | Algo real el primer día; lo que no consta, se pide |
| Calidad | Pruebas duras y mutación en el núcleo; auditoría en cada sitio | El código compartido se prueba una vez; el contenido rompe webs vivas |
| Reparto | Núcleo fino: secciones y CSS se copian al sitio | Libertad cuando el cliente pide algo fuera del molde |
| Diseño | Tokens + variantes por sección; hero y paleta libres | Lo que delata una plantilla es la paleta, no la rejilla |
| Distribución | Un repo privado; núcleo por ruta local | Se publica en npm cuando dos webs necesiten versiones distintas |
| Idioma del código | Inglés dentro, español de cara a la persona | El cliente final no es técnico |

## Biblioteca de módulos

| Módulo | Yoga | Colectivo de DJs | Asociación |
|---|---|---|---|
| Catálogo | Servicios | Sesiones, eventos, artistas | Actividades |
| Agenda | Horarios semanales | Próximas fechas y archivo | Calendario |
| Precios | Tarifas y bonos | Contratación | Cuotas de socio |
| Equipo | — | Miembros | Junta directiva |
| Medios | Galería | Audio y vídeo embebidos | Documentos |
| Opiniones · FAQ · Avisos · Contacto | Sí | Sí | Sí |

Dos exigencias nuevas que trae la diana y que Organic Yoga nunca tuvo:

- **El tiempo**: un evento pasado no se borra, se archiva. Cambia listados, sitemap y
  JSON-LD (aquí `Event` y `MusicGroup`, no `LocalBusiness`).
- **Los embebidos de terceros**: SoundCloud, Mixcloud y YouTube ponen cookies, así que van
  detrás del consentimiento y con un marcador de posición digno mientras no se acepte.

## La entrevista

Seis fases, quince preguntas como techo, adaptativa, y con un resumen legible para
confirmar antes de escribir nada:

1. **Quiénes son** — vocabulario del panel y tono de los textos.
2. **Qué tienen que mostrar** — módulos y sus etiquetas.
3. **Qué tienen que conseguir** — contacto o inscripción, cupo, avisos.
4. **Qué aspecto tiene** — referencias, claro/oscuro, paleta, tipografías, variantes, motivo.
5. **Datos duros** — dominio, titular legal, correos, redes, cuentas.
6. **Contenido** — qué existe, qué se redacta en borrador, qué entra en la hoja de encargo.

## Puertas de la auditoría

- **Identidad coherente**: canonical, sitemap, robots y los `@id` del JSON-LD salen de `SITE_URL`.
- **JSON-LD válido** y del tipo declarado, con precios desde relaciones del CMS.
- **GEO**: `llms.txt` generado del CMS, sin un dato que no conste en él.
- **Seguridad**: `nosniff`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`.
- **Accesibilidad**: axe sin violaciones serias y contraste AA sobre la paleta elegida.
- **Rendimiento**: presupuesto de LCP y CLS; imágenes con tamaños y texto alternativo.
- **Legal**: las tres páginas, consentimiento con fecha, ningún embebido antes de aceptar.
- **Esquema al día**: sin diferencias entre migraciones y lo que Payload espera.

## Hitos

| | Hito | Tamaño | Entrega |
|---|---|---|---|
| H1 | La diana, a mano | 2–3 d | Web del colectivo desplegada + lista de diferencias |
| H2 | Extraer el núcleo | 3–4 d | `core/` con la batería en verde, usado por las dos webs |
| H3 | Plantilla y módulos | 3–4 d | Chasis que despliega vacío + módulos |
| H4 | La auditoría | 2–3 d | `npm run audit` con informe y código de salida |
| H5 | Blueprint y generador | 4–5 d | De blueprint a web desplegada sin conversación |
| H6 | La entrevista | 2–3 d | Conversación → `site.json` → web |
| H7 | Prueba de fuego | 1 d | Tercera web (portafolio personal) + lista de fricciones |

El orden importa: **el núcleo se extrae después de tener dos webs reales**. Lo común de una
sola muestra es adivinación.

## Hecho

La v1 termina cuando, partiendo de una conversación, sale **una web desplegada con la
auditoría en verde en menos de una jornada**, y funciona igual para colectivo, portafolio
personal y negocio personal.

## Riesgos

- **Extraer el núcleo demasiado pronto** — por eso H1 se hace a mano.
- **Una entrevista agotadora** — quince preguntas de techo; el resto, valores por defecto.
- **Migraciones compartidas** — cada sitio nace con su historial; nunca se copian.
- **Organic Yoga como cobaya** — está en producción y con cliente; no se migra al núcleo
  hasta que dos webs nuevas lo hayan probado.

## Aplazado a propósito

Vigilancia de deriva entre núcleo y copias · bilingüe con localización de Payload · VPS y
cuentas del cliente · pagos y reservas · importar la web anterior del cliente · entrega y
mantenimiento (guía generada, capturas automáticas, guion de vídeo, CI periódica).
