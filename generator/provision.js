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

3. Primer despliegue **antes** de fijar la dirección, porque hasta ahora no se sabe cuál es:

   vercel --prod --yes
   vercel alias ls | grep ${id}          # la buena es la que responde 200, no la del equipo
   printf 'https://<la-que-responda>' | vercel env add NEXT_PUBLIC_SITE_URL production
   vercel --prod --yes

4. Almacén de imágenes: en el panel de Vercel, Storage → Blob → conectar al proyecto. La
   CLI no lo crea, y sin él las subidas fallan en producción.

5. Comprobar antes de dar la web por buena:

   npm run audit -- --url https://<la-que-responda>
`)
