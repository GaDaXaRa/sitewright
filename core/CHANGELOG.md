# Cambios de sitewright-core

Qué gana una web al actualizar. Escrito para quien tiene que decidir si le compensa, no
para quien escribió el código.

## 0.15.0 — 8 de septiembre de 2026

- **La auditoría mide sola el texto sobre cualquier color de la paleta.** Hasta ahora
  comparaba una lista fija de parejas, y las webs que declaran colores propios —una banda
  índigo, un detalle dorado— se quedaban con ese texto sin medir. Ahora, además de la lista,
  busca en la hoja toda pareja `--on-<color>` / `--<color>` y la mide igual: la convención
  que ya usaba el botón, aplicada a lo que venga. Una web sin colores propios no nota nada.
- **El mensaje de error del formulario deja de ir en el segundo color de marca.** Ahora va en
  el acento. Eran dos problemas en la misma línea: «no se ha podido enviar» salía en el oro
  de Sandunguera —un error no es un color de marca—, y `--accent-soft` era el único token que
  la hoja leía como texto sin que ninguna puerta lo midiera. Ahí daba **3,88:1**, por debajo
  del AA, en la frase que alguien lee justo cuando algo acaba de fallar. En el acento da
  6,44. La puerta de contraste mide ahora esa pareja, así que no puede volver a pasar.

  Las webs ya hechas lo reciben regenerando su hoja: es un fichero que el generador escribe
  por sitio, y `sync-site` no lo toca.
- **El blueprint acepta los colores propios de un diseño**, con nombre libre, en
  `design.palette.extras`. Los diez de siempre tienen papel fijo y una web real usa más:
  Organic Yoga pinta sus bandas con un índigo y sus detalles con un ocre, en cuarenta y
  cuatro sitios de su hoja, y sin un hueco donde declararlos la única salida era escribir el
  hexadecimal a mano en cada regla. Cada uno sale con su tinta **medida**, no elegida.

  Y medirla dejó ver algo: en Organic Yoga, la tinta del propio sitio da **4,32:1** sobre su
  verde matcha, por debajo del 4,5 que pide el AA. Medirlo devuelve un negro que da 5,06.
  Elegido a ojo, ese texto habría salido a producción.

- **Segunda pasada al índice, esta vez con la lista de consumidores delante.** La de 0.14.0
  se hizo a ojo; ésta se hizo mirando las tres webs en producción, la plantilla y los
  módulos, y sale de ahí una regla que se puede repetir: **sale del paquete lo que alguien
  nombra**. Dejan de exportarse las piezas que el propio núcleo cablea por dentro:
  - de `sitewright-core/payload`, los ganchos `saveOriginalCopy` y `versionUrls` y los
    endpoints `restoreOriginalEndpoint` e `imageOpsEndpoint` —con `invertImage`,
    `clearImageBackdrop` y `OPS_ERROR`—, que **monta `mediaCollection`**;
  - de `sitewright-core`, las decisiones de la copia original (`decideOriginalCopy`,
    `rejectionReason`, `fileToRestore`, `RESTORE_ERROR` y sus tipos), `contrastRatio` —la
    usa `buttonColors` y la auditoría—, `joinWithAnd`, `PROVIDER_NAMES`,
    `initials`, `CMS_ICON_ROUTE` y los topes del freno del formulario (`MAX_PER_IP`,
    `MAX_GLOBAL`, `GLOBAL_WINDOW_MS`), que aplican `countSince` y `exceedsGlobalCeiling`.

  **Ninguna función cambia**: la copia original se sigue guardando, el panel sigue quitando
  fondos y volviendo al original, y el freno del formulario sigue frenando igual. Lo que se
  deja de prometer es la forma de montarlo a mano, que ninguna web usaba.

  Sí sigue saliendo `IP_WINDOW_MS`, porque el módulo de contacto purga con él su propio mapa
  de IPs; y `relationId`, porque subsuelo lo usa en cuatro ficheros. Comprobarlo antes fue
  la diferencia entre una limpieza y romper una web.
- **Se va `relationPointsTo`**, que no la llamaba nadie: ni una web, ni la plantilla, ni el
  propio núcleo. Sólo la llamaba su prueba.

## 0.14.0 — 8 de septiembre de 2026

- **El paquete deja de exportar lo que ninguna web usaba.** Se van del índice `compareVersions`,
  `normaliseVersion`, `versionsAfter`, `changelogSections` y `diagnose` —herramienta del
  `doctor` de la fábrica, que ahora vive con él— y las funciones de recorte de fondo
  (`colourDistance`, `isBackdrop`, `flatBackdrop`, `backdropShare`, `clearBackdrop`,
  `NO_BACKDROP`, `TOO_MUCH_BACKDROP`), que sólo las usa por dentro el endpoint de imágenes
  de `sitewright-core/payload`. **La función del panel no cambia**: quitar el fondo de un
  logo sigue estando donde estaba. Lo que cambia es que cada símbolo exportado era una
  promesa de compatibilidad, y estas no se le prometían a nadie.
- **La auditoría deja de preguntarle al registro npm.** Se va la puerta «Al día con el
  núcleo» y la opción `core` de `runAudit`: metía red y no determinismo en la puerta que
  juzga un despliegue, para decir lo mismo que ya dice `doctor`. Una web atrasada funciona;
  eso es mantenimiento, no un fallo de despliegue.
- **Dos textos de relleno menos que marcaban webs sanas.** «Aquí va» y «de ejemplo» estaban
  sueltos en la lista de placeholders y son español corriente: una web que explicara algo
  con un ejemplo salía avisada por escribir bien. Ahora se buscan las frases enteras del
  seed.

## 0.13.0 — 7 de septiembre de 2026

- **Una entrada menos en la auditoría: se va `--migrations-db` (y `AUDIT_DATABASE_URL`).**
  Servía para mirar la base de producción con un rol de sólo lectura después de cada
  despliegue, y no compensaba lo que costaba —un rol de Postgres a medida, su contraseña y
  su rotación—: el fallo caro que buscaba, un campo declarado que ninguna migración tiene,
  lo caza `schema:check` en cada push, sin conectarse a nada y **antes** de desplegar; y
  las migraciones sin aplicar no pueden existir después de un despliegue con éxito, porque
  las aplica el propio build. `--db` sigue estando, para mirar una base desde el portátil.

## 0.12.5 — 7 de septiembre de 2026

- Cuando la base no contesta, la auditoría dice por qué. Antes escribía «No se pudo
  consultar la base: AggregateError», que es lo que `pg` lanza al no poder conectarse y no
  informa de nada: ahora nombra el motivo —no resuelve el servidor, nadie contesta en ese
  puerto, la contraseña no vale—.

## 0.12.4 — 7 de septiembre de 2026

- **La puerta del esquema puede mirar producción sin que la de la conexión mienta.** Antes
  las dos leían la misma cadena, así que darle a la auditoría un rol de sólo lectura habría
  puesto en verde una puerta que habla de la conexión que usa la web —y esa seguiría sin
  comprobarse—. Ahora `--migrations-db` (o `AUDIT_DATABASE_URL`) es una entrada aparte: con
  ella el «1 sin comprobar» de todas las auditorías pasa a comprobar de verdad si la base
  tiene marcas de modo desarrollo y si están aplicadas todas las migraciones.

## 0.12.3 — 7 de septiembre de 2026

- La puerta que estrena 0.12.2 buscaba el título de la vista, que Payload manda en la
  pestaña aunque sólo sirva el login: se habría puesto roja en webs que están bien.
  Ahora mira el maquetado de la guía y nada más.

## 0.12.2 — 7 de septiembre de 2026

- **La guía del panel ya no se sirve sin haber entrado.** Payload pinta una vista propia
  sin mirar la sesión —sólo redirige cuando la ruta no existe—, así que cualquiera que
  pidiera `/admin/guia` recibía la documentación entera. Ahora lleva al login y vuelve a
  la guía al entrar. No se escapaba ningún dato, pero sí el mapa del panel. La auditoría
  lo comprueba en cada despliegue, para que no dependa de que alguien se acuerde.

## 0.12.1 — 7 de septiembre de 2026

- **La guía se lee mejor.** La plantilla del panel no pone relleno vertical a una vista
  propia, así que el título salía pegado al borde de arriba y el texto ocupaba toda la
  pantalla de ancho. Ahora tiene márgenes, ancho de lectura, índice en tarjeta y los
  campos en forma de tabla de referencia, que es como se consultan: buscando uno, no
  leyendo de corrido. Con `npm run preview:guide` se ve sin levantar el panel.

## 0.12.0 — 4 de septiembre de 2026

- **La guía de la clienta, dentro de su panel, y documenta el CMS entero.** Habla de su web
  con los nombres que ella le puso —«Bolos», no «agenda»—, y vive donde trabaja en vez de
  en un documento que se queda viejo el día que cambia algo. Ocho apartados y treinta y
  siete campos explicados: cada colección, las fotos y sus tres ediciones, la portada, los
  buscadores, el banner de cookies y **los datos legales**, incluido qué pasa si se
  equivoca en ellos.

## 0.11.0 — 4 de septiembre de 2026

- Primera versión de la guía, sin la parte legal.

## 0.10.0 — 4 de septiembre de 2026

- **Puerta nueva: que el título de la portada se lea sobre la foto.** Era el hueco que
  dejaba la de contraste, que compara pares de la paleta —y «texto sobre foto» depende de
  una imagen que alguien sube después—. Falla cuando se quita el oscurecimiento y el texto
  queda del mismo color que el fondo de la web, que es el fallo exacto que llegó a
  producción; avisa cuando no hay velo y el color es otro, porque ahí depende de la foto.

## 0.9.0 — 4 de septiembre de 2026

- **Dos ediciones más para las imágenes, desde el panel**: «Invertir colores» y «Quitar el
  fondo». Las dos son seguras porque la copia original ya se guardaba al subir, así que
  «Volver al original» deshace cualquiera.
- Quitar el fondo **sólo funciona si el fondo es plano**: mira las cuatro esquinas y, si no
  coinciden, se niega y lo dice. No es un recorte inteligente, y con una foto la respuesta
  correcta es no tocarla. El borde suavizado se desvanece en vez de recortarse, que es lo
  que evita el halo del color viejo.

## 0.8.2 — 3 de septiembre de 2026

- **El `--url` que se escribe a mano gana.** El guion `audit` de cada web trae ya su propio
  `--url`, y el CLI se quedaba con el primero: con el servidor local levantado,
  `npm run audit -- --url https://…` auditaba localhost creyendo auditar producción, y el
  informe no decía contra qué dirección hablaba.

## 0.8.1 — 3 de septiembre de 2026

- **Arreglada la puerta de páginas vacías**, que marcaba como huecas las páginas llenas de
  fichas sin foto: el marco gris de un retrato que falta lleva la clase
  `member-photo-empty`, y la comprobación aceptaba cualquier clase que *contuviera*
  «empty». Ahora tiene que ser exactamente esa.

## 0.8.0 — 3 de septiembre de 2026

- **La auditoría avisa de las páginas vacías que la web anuncia.** Una página que dice
  «todavía no hay nada publicado» no es contenido fino: es ninguno, y Google la descubre,
  la rastrea y decide no indexarla. Le pasó a la cuarta web hecha con esto.
- **`sitewright doctor`**: qué versión del núcleo tiene una web, cuántas se está perdiendo
  y qué hay en medio.

## 0.7.0 — 1 de septiembre de 2026

- **Una web puede existir antes que su dominio.** Sin `NEXT_PUBLIC_SITE_URL`, el sitio usa
  la dirección que le da Vercel, que es real desde el primer despliegue.

## 0.6.0 — 1 de septiembre de 2026

- La auditoría comprueba que **todo lo del sitemap se alcanza pinchando**: una página
  indexada a la que no lleva ningún enlace la encuentra Google y no la encuentra nadie.
- Comprueba también que la conexión a la base de datos sea **la agrupada**, que es la que
  aguanta en producción.

## 0.5.1 — 1 de septiembre de 2026

- Se restauró el `repository` del paquete, que se había quitado dando por hecho que el
  repositorio de GitHub no existía. Existía.

## 0.5.2 — 1 de septiembre de 2026

- La página del paquete en npm explica para qué sirve. Sin cambios de código.

## 0.5.0 — 1 de septiembre de 2026

- **El banner de cookies sale sólo si hace falta**, con un interruptor en el panel que
  avisa de lo que implica apagarlo.

## 0.4.0 — 1 de septiembre de 2026

- La puerta de imágenes deja de protestar por lo que **`next/image` ya optimiza**.
- El logotipo se sirve del tamaño en que se ve.

## 0.3.0 — 1 de septiembre de 2026

- **Los colores de los botones se derivan** de la paleta con contraste garantizado, en vez
  de elegirse a ojo.
- Módulo `about` y guía propia para cada web.

## 0.2.0 — 28 de agosto de 2026

- **Cada web tiene su icono**, generado a partir de su nombre y su paleta, y reemplazable
  desde el panel.

## 0.1.0 — 27 de agosto de 2026

- Primera versión: lógica pura, copia de seguridad de las imágenes originales, frenos de
  abuso en los formularios públicos, consentimiento de cookies real, páginas legales
  generadas y la auditoría con sus puertas.
