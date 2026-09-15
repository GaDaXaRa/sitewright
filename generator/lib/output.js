import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  rmSync,
} from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

/** Never replace a working site. Force only accepts an existing empty directory. */
export function prepareOutput(out, root, force = false) {
  const destination = resolve(out)
  const parent = dirname(destination)
  const factory = realpathSync(root)
  let ancestor = parent
  while (!existsSync(ancestor)) ancestor = dirname(ancestor)
  const canonical = resolve(realpathSync(ancestor), relative(ancestor, destination))
  const inside = (a, b) => a === b || a.startsWith(b + sep)
  if (inside(canonical, factory) || inside(factory, canonical)) {
    throw new Error('El destino no puede ser la fábrica ni estar dentro de ella o contenerla.')
  }
  const check = () => {
    if (!existsSync(destination)) return
    if (lstatSync(destination).isSymbolicLink() || !lstatSync(destination).isDirectory()) {
      throw new Error('El destino debe ser un directorio, sin enlaces simbólicos.')
    }
    if (!force || readdirSync(destination).length) {
      throw new Error(
        'El destino ya existe. Usa un directorio nuevo; para actualizar una web, usa sync-site y sync-written. --force solo admite directorios vacíos.',
      )
    }
  }
  check()
  mkdirSync(parent, { recursive: true })
  const staging = mkdtempSync(join(parent, `.${basename(destination)}-generating-`))
  return {
    staging,
    cleanup: () => rmSync(staging, { recursive: true, force: true }),
    commit() {
      check()
      // rmdir refuses a directory populated since the check; no recursive deletion here.
      if (existsSync(destination)) rmdirSync(destination)
      renameSync(staging, destination)
    },
  }
}
