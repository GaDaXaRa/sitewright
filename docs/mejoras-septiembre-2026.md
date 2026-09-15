# Mejoras de generación y solicitudes

## Cambios

- Los enlaces de tarifas y horarios conservan el ancla de contacto y llevan la selección
  como parámetro. El formulario muestra la opción y guarda su relación en la solicitud.
- Fecha, ciudad y enlace de privacidad respetan la configuración. Los errores recuperables
  se explican y conservan el mensaje; los estados se anuncian a lectores de pantalla.
- Los textos del blueprint se serializan antes de escribir código. Se admiten comillas,
  apóstrofos y saltos de línea sin romper el sitio generado.
- El blueprint generado lleva `schemaVersion: 1`. Los anteriores sin versión siguen
  funcionando. Se rechazan versiones desconocidas, rutas reservadas o de varios segmentos
  y booleanos escritos como texto.
- El generador solo entrega el directorio al terminar. `--force` admite únicamente destinos
  vacíos; nunca sustituye una web existente. Los fallos limpian la copia temporal.
- Los errores del CMS se propagan: no se genera una página vacía con apariencia de éxito.
  La primera generación necesita un CMS disponible; una revalidación fallida puede conservar
  la página anterior mediante ISR. No se ha simulado aquí una caída en un despliegue real.
- Las solicitudes tienen estados Nueva, En curso y Resuelta, y notas privadas. La casilla
  anterior Contestada sigue siendo compatible. Un correo fallido no impide intentar el otro.

## Llevarlo a una web existente

Esta revisión cambia la fábrica, no actualiza webs de clientes. Desde la raíz:

```sh
npm run doctor -- ../sitio
npm run sync-site -- ../sitio
npm run sync-written -- ../sitio
```

Revisa los cambios propuestos y aplica ambos comandos con `--apply`. Las personalizaciones
se respetan: integra manualmente los archivos afectados que los comandos hayan conservado.
En el sitio, instala las dependencias de pruebas si se van a ejecutar allí:

```sh
npm install --save-dev @testing-library/dom
npm run generate:types
npm run migrate:create -- request-workflow
npm run schema:check
npm run typecheck
npm run test:int
```

La migración es necesaria para `requests.status` y `requests.internalNotes`. Revisa el SQL
antes de aplicarlo; los registros antiguos mantienen `processed` y muestran su estado
correspondiente cuando `status` está vacío. El build de despliegue aplica las migraciones
con el procedimiento habitual del sitio. Después, audita su URL pública.

El nuevo ayudante `src/lib/contactLink.ts` llega con `sync-site`: debe viajar junto con los
módulos que lo importan. No hay cambios de runtime en el núcleo ni una nueva publicación npm.

## Verificación

- Pruebas del núcleo y comprobación de tipos.
- Pruebas del generador y de sincronización, con casos de protección de archivos y textos
  que antes producían código inválido.
- Generación, tipos e integración para las cuatro combinaciones de ejemplo.
- Ocho recorridos en Chrome, escritorio y móvil, con componentes reales y servicios
  simulados. La CI ejecuta estos recorridos; instrucciones en `browser/README.md`.

## Evolución posterior

La vista previa visual del blueprint, la pantalla de preparación para publicar, el registro
persistente de entregas de correo con reintentos y el límite global atómico son mejoras
separadas. Esta entrega no incluye esos sistemas ni pruebas contra una base de producción.
