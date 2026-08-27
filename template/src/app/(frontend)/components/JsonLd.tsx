import React from 'react'

// Structured data (schema.org) as a <script type="application/ld+json">, which is the way
// Next recommends in the App Router.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // The content is JSON we generate, not unsanitised user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
