# {{name}}

{{tagline}}Web y gestor de contenidos. **Los textos, las fotos y las fechas se escriben en el panel**,
en `/admin`; aquí sólo está el código.

## Secciones

{{sections}}

Una sección sin contenido no aparece ni en el menú ni en el sitemap: se publica sola en
cuanto tiene algo dentro.

## Trabajar en local

```bash
cp .env.example .env     # y pon DATABASE_URL (la rama dev) y PAYLOAD_SECRET
npm install
npm run generate:types
npm run dev
```

## Antes de dar un cambio por bueno

```bash
npm run typecheck && npm run test:int
npm run audit -- --url http://localhost:3000
```

La auditoría comprueba lo que se rompe en silencio: canónicos, sitemap, datos
estructurados, páginas legales, consentimiento, contraste y peso.

## Desplegar

`git push`. La plataforma construye y publica sola, y al terminar vuelve a pasar la
auditoría contra la web en producción.

---

Generada con [Sitewright](https://www.npmjs.com/package/sitewright-core). Lo que no cambia
entre webs vive en ese paquete y **no se edita desde aquí**.
