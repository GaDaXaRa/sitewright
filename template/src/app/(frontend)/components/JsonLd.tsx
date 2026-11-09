import React from 'react'

/**
 * JSON that is safe to place inside a `<script>` element.
 *
 * `JSON.stringify` is not enough: the graph carries what the client typed in the panel —
 * FAQ answers, names, descriptions — and a `</script>` in any of them closes the element
 * early, so whatever follows runs as HTML. Escaping every `<` as a \u escape keeps the JSON
 * identical for whoever parses it and leaves the HTML parser nothing to close. The other
 * two are the line separators that old JavaScript parsers refuse inside a string.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

// Structured data (schema.org) as a <script type="application/ld+json">, which is the way
// Next recommends in the App Router.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  )
}
