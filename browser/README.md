# Recorridos en navegador

Desde la raíz, con las dependencias de `template` y `core` instaladas:

```sh
npm run build --prefix core
node template/node_modules/@playwright/test/cli.js install chromium
npm run test:browser
```

Para usar Chrome ya instalado: `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`.

La página de prueba monta los componentes reales de tarifas, formulario, navegación y
consentimiento. Usa datos ficticios, intercepta el envío de solicitudes y sustituye el
reproductor remoto por una respuesta local. No necesita base de datos ni envía correos.
Comprueba escritorio y móvil; los fallos conservan trazas en `test-results/browser`.

Estas pruebas cubren las interacciones de los componentes, no un despliegue completo de
Next.js ni las migraciones de Payload. La matriz de sitios generados comprueba los tipos
y las pruebas de integración; la auditoría de cada sitio sigue siendo necesaria.
