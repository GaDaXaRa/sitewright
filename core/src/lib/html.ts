/**
 * Escapes whatever is interpolated into the HTML of an email.
 *
 * Public forms end up in someone's inbox: unescaped, anyone could slip a link — or an
 * alarming notice dressed as a system message — into an email signed by the site itself.
 * A spam filter on the message field is not enough, because every field gets interpolated.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;') // first, or it would re-escape the ones below
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
