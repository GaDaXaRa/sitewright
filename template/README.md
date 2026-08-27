# Plantilla de un sitio Sitewright

El chasis: **compila, despliega y responde estando vacío**. Sin módulos trae portada, las
tres páginas legales, `/llms.txt`, `sitemap`, `robots`, el panel y la API.

Lo que el núcleo no puede saber vive en un solo fichero: [`src/site.config.ts`](src/site.config.ts)
—identidad, rutas y etiquetas—. El generador lo escribe desde el blueprint y añade, por
cada módulo, su colección en `payload.config.ts`, su sección en la portada, sus rutas y su
aporte al JSON-LD y a `llms.txt`.

```bash
npm run core:sync   # compila el núcleo e instala su copia
npm run seed        # usuario del panel y ajustes
npm run dev
npm run lint && npm run typecheck && npm run test:int && npm run build
```

De lo demás se encarga [`@sitewright/core`](../core): imágenes, revalidación,
consentimiento, frenos del formulario, páginas legales y lógica pura.
