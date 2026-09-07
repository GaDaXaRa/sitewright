# Sitewright

Generador de sitios web profesionales: una conversación produce un *blueprint*, y el
blueprint produce una web Next.js + Payload desplegada. El núcleo es el paquete npm
`sitewright-core`; `template/` es el chasis; `modules/` son las secciones.

- **El código va en inglés**; lo que ve una persona, en español.
- Los comentarios explican **por qué**, no qué hace la línea. Densidad baja.

## Las once reglas

Cada una existe porque se incumplió al menos una vez y costó tiempo real. Llevan al lado
el comando que las comprueba: si no hay comando, no hay regla, hay buena intención.

1. **Publicar el núcleo es `npm run release`**, nunca `npm publish` a mano. El guion
   exige árbol limpio, comprueba contra el registro que la versión esté libre y pasa las
   puertas antes de subir nada.
2. **Antes de tocar una web ya hecha, `npm run doctor -- ../<sitio>`**: dice qué núcleo
   tiene, cuántas versiones se está perdiendo, qué hay en medio, **qué ficheros de la
   fábrica no son los suyos** y **en qué se diferencia de lo que el generador escribiría
   hoy** —esto último regenerándola desde el `sitewright.json` que lleva dentro—. Ninguna
   se actualiza sola y hasta ahora nadie llevaba esa cuenta.
3. **Poner una web al día son dos comandos, y hacen cosas distintas.**
   `npm run sync-core -- ../<sitio>` trae el núcleo, que va por npm: el guion borra la
   dependencia —npm no refresca una `file:` que conserva su versión— y compara el hash de
   todo `dist` con lo que acaba de construir. `npm run sync-site -- ../<sitio> --apply`
   trae lo que se copió el día que la web nació —el chasis y los módulos—, que no tiene
   número de versión y por eso se quedaba atrás sin que nadie lo supiera. Sin `--apply` no
   escribe: enseña qué cambiaría. Lo que el generador escribe por web no lo toca nunca
   (`generator/generated.js`, y una prueba lo vigila contra `generate.js`).
4. **Los tipos se comprueban aparte: `npm run typecheck`.** `next build` con caché
   ha dado por bueno un error de tipos que luego tumbó el despliegue.
5. **Desplegar es `git push`.** Los proyectos están conectados a GitHub; lanzar `vercel
   --prod` a mano despliega otra cosa distinta de lo que hay en el repositorio.
6. **Una web no está terminada hasta que su auditoría pasa contra la URL pública**
   (`AUDIT_URL=https://… npm run audit`). Ha encontrado algo real en todas las webs.
7. **No inventar datos de una persona o un negocio**: precios, fechas, NIF, direcciones,
   aforos. Si no los ha dicho el cliente, el hueco se queda vacío y se pregunta.
8. **Antes de suponer que algo no existe, mirarlo.** Un `repository` se borró suponiendo
   que el repo de GitHub no estaba creado; estaba. `git remote -v`, `gh repo view`, `ls`.
9. **No afirmar un hecho de infraestructura sin el comando delante** — ver la tabla de
   abajo. Media docena de herramientas devuelven respuestas engañosas por diseño.
10. **El esquema se comprueba sin base de datos: `npm run schema:check` en el sitio.**
   Compara lo que declara el código con el último snapshot de las migraciones —Payload lo
   hace sin conectarse a nada, igual que su `migrate:create`—: caza el campo añadido sin
   `migrate:create`, que no rompe el despliegue y revienta el panel más tarde. Lo corre la
   CI de cada web en cada push, que es cuando todavía se puede hacer algo.
   Hubo un segundo escalón que miraba la base de producción con un rol de sólo lectura, y
   se quitó: lo caro que cazaba ya lo caza esto antes de desplegar, y lo demás —migraciones
   sin aplicar— no puede pasar después de un despliegue con éxito, porque las aplica el
   propio build. No compensaba un rol de Postgres a medida, su contraseña y su rotación.
   Lo que sigue siendo verdad: migrar en producción después de haber usado el modo
   desarrollo requiere arreglar antes la marca `batch = -1` que deja el empuje automático
   de esquema; si no, `payload migrate` se planta. Se limpia con
   `scripts/fix-prod-migration.mjs`, y el aprovisionamiento ya lo dice en su paso 5.
11. **Al terminar cualquier cambio en el núcleo**: pruebas y mutación. El listón está en
    95% y ha derivado dos veces sin que nadie se diera cuenta. Lo aplica `prepublishOnly`.

## Herramientas que mienten

No es descuido: estas devuelven algo que parece una respuesta y no lo es.

| Herramienta | Lo que parece | Lo que hay que hacer |
|---|---|---|
| `vercel env pull` | Trae los valores | Los sensibles vienen **censurados** (11 caracteres). Un secreto guardado no se puede leer: si necesitas saberlo, vuelve a escribirlo desde su fuente. |
| `npm view` | Pregunta al registro | Responde desde caché. Siempre `--prefer-online`. |
| `npm install` (dep `file:`) | Instala | Si la versión no cambia, deja lo que había. `npm run sync-core`. |
| `.npmrc` en un subdirectorio | No está | Tapa el token de la sesión y provoca 404 inexplicables. `ls core/.npmrc`. |
| `~/.npmrc` con un token viejo | Estás autenticado | Un token revocado ahí tapa al bueno del perfil, y npm contesta **404** —«no existe el paquete»— cuando lo que pasa es que no te conoce. `npm whoami`. |
| `~/.zshrc` con la variable repetida | Vale la primera | Vale **la última**. `zsh -lc 'echo $NPM_TOKEN' \| head -c 8`. |
| `next build` | Compila de cero | Reutiliza caché y puede ocultar errores de tipos. `npm run typecheck`. |
| Stryker | Marca supervivientes | Los mutantes estáticos salen como supervivientes sin serlo (`ignoreStatic`). |
| Un guion que termina con éxito | Ha hecho su trabajo | `core:sync` borraba `node_modules/@sitewright`, nombre muerto desde el renombrado: terminaba bien sin hacer nada. Y `sync-core` decía «verificado» comparando sólo `dist/index.js`, que tres versiones seguidas dejaron idéntico. Comprueba el efecto, y que lo comprobado sea lo que cambió. |

## La CI

`.github/workflows/ci.yml` corre en cada push: tipos, pruebas, listón de mutación y build
del núcleo, las pruebas del generador y las de la plantilla. Los tipos de Payload no están
versionados, así que la plantilla los genera antes de comprobarlos.

Los sitios llevan `.github/workflows/audit.yml`: cuando Vercel termina un despliegue de
producción, audita la dirección que acaba de quedar viva. La URL sale de la variable
`AUDIT_URL` del repositorio (`gh variable set AUDIT_URL --repo …`), y si no está, de la
que informe el despliegue.

Ojo con auditar producción desde el portátil: la puerta de la conexión agrupada lee el
`DATABASE_URL` del entorno que lanza el comando, que en local es el de desarrollo. El
fallo que da ahí no es un fallo de la web.

## Dónde está lo demás

- **`notes/h1-differences.md`** — los 73 hallazgos con su contexto. Es el archivo
  histórico, no la chuleta: si algo de ahí hay que recordarlo en caliente, su sitio es
  este fichero o, mejor, un guion.
- **`docs/plan-v1.md`** — el plan y lo aplazado a versiones siguientes.
- **La documentación navegable** — https://claude.ai/code/artifact/9a5f1f1d-6e5b-4b03-93f1-7548ba17f3af
  Qué es cada pieza y por qué está donde está. Si cambias la arquitectura, actualízala:
  las cifras que lleva salen de ejecutar las pruebas y la auditoría, no de recordarlas.
