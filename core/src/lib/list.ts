/**
 * Joins items the way Spanish writes them: "viernes", "viernes y sábado",
 * "viernes, sábado y domingo".
 *
 * It lives on its own because several consumers say the same list — the booking email,
 * the page and /llms.txt. When each did it its own way, the email wrote "Viernes y Sábado
 * y Domingo" while the page said "viernes, sábado y domingo".
 */
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}
