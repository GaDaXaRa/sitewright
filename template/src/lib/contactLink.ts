/** Keep the query before the fragment so both selection and scrolling work. */
export function contactLink(href: string, id: string | number): string {
  const url = new URL(href, 'https://sitewright.invalid')
  url.searchParams.set('tarifa', String(id))
  return `${url.pathname}${url.search}${url.hash}`
}
