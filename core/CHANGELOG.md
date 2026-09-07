# Cambios de sitewright-core

Qué gana una web al actualizar. Escrito para quien tiene que decidir si le compensa, no
para quien escribió el código.

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
