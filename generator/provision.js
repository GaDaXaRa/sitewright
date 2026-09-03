#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { validateBlueprint } from './schema.js'

/**
 * The infrastructure commands for a blueprint — **printed, not run**.
 *
 * Deploying is the one step that reaches outside this machine and costs money in somebody's
 * account, so it stays a decision a person makes with their own hands. It is also the step
 * with an order that cannot be guessed: the public address of a Vercel project is not
 * derivable (`<name>.vercel.app` may belong to someone else, and the team alias sits behind
 * SSO), so the site URL can only be set **after** the first deploy tells you what it is.
 */
const path = process.argv[2]
if (!path) {
  console.error('Uso: node provision.js <blueprint.json>')
  process.exit(2)
}

const bp = JSON.parse(readFileSync(path, 'utf8'))
const errors = validateBlueprint(bp)
if (errors.length) {
  console.error(`El blueprint no está listo:\n${errors.map((e) => `  · ${e}`).join('\n')}`)
  process.exit(1)
}

const { id, name } = bp.identity

console.log(`
Aprovisionar ${name}
${'─'.repeat(14 + name.length)}

1. Base de datos — dos ramas desde el principio. Compartir una sola es lo que dejó una
   marca de modo dev en producción y tumbó un despliegue:

   npx neonctl@latest projects create --name ${id} --region-id aws-eu-central-1
   npx neonctl@latest branches create --name dev --project-id <id>

   La cadena de \`dev\` va al .env local; la de \`main\`, a Vercel.

2. Proyecto en Vercel:

   vercel link --yes --project ${id}
   grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '\\n' | vercel env add DATABASE_URL production
   openssl rand -hex 32 | tr -d '\\n' | vercel env add PAYLOAD_SECRET production

3. Primer despliegue. Sin dominio propio no hay que fijar ninguna dirección: el sitio usa
   la que le da la plataforma, que es la que responde 200 y no la del equipo.

   vercel --prod --yes
   curl -sI https://${id}.vercel.app | head -1     # comprueba que responde

4. Almacén de imágenes:

   vercel blob create-store ${id}-media --access public --region fra1 --yes

   Público porque se sirven directas desde el CDN, y en Europa porque el valor por defecto
   es Washington. El comando lo enlaza al proyecto y pone BLOB_READ_WRITE_TOKEN en los tres
   entornos — y también en tu .env.local, así que las subidas locales pasan a ir al almacén
   de producción hasta que quites esa línea.

5. Sembrar producción — y limpiar lo que eso deja. Un `payload run` contra la base de
   producción empuja el esquema y deja una marca de modo dev que bloquea el siguiente
   `migrate` durante el build:

   DATABASE_URL=<la de main> SEED_EMAIL=<correo> SEED_PASSWORD=<contraseña> npm run seed
   DATABASE_URL=<la de main> node scripts/fix-prod-migration.mjs

6. Comprobar antes de dar la web por buena, con la base delante o no comprueba el esquema:

   npm run audit -- --url https://${id}.vercel.app --db '<la de main>'
`)
