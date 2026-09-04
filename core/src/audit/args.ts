/**
 * Leer un argumento de la línea de órdenes.
 *
 * Vive aparte del CLI porque el CLI se ejecuta al importarlo: dejarlo dentro significaba
 * que la única pieza con lógica de todo el binario no se podía probar sin lanzar una
 * auditoría entera. Y sí tenía lógica, porque el último gana.
 */
export function arg(argv: string[], name: string): string | undefined {
  const index = argv.lastIndexOf(`--${name}`)
  if (index < 0) return undefined

  const value = argv[index + 1]
  // Un valor que empieza por `--` es la siguiente bandera, no el valor de esta.
  return value === undefined || value.startsWith('--') ? undefined : value
}
