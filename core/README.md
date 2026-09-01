# sitewright-core

The shared runtime behind Sitewright websites: the parts every content-driven site needs,
that are tedious to write once and worse to write again.

It is built for **Next.js (App Router) + Payload CMS** sites, and it exists because the same
handful of things kept going wrong on real, deployed sites: a favicon that changed address on
every deploy, a public form used to mail strangers, a cookie banner that was pure theatre, a
cropped image with no way back, and a grey that failed contrast in the footer of every page.

> **The strings people read are in Spanish.** Field labels, the consent banner, the generated
> legal pages and form errors are written for Spanish-speaking clients. The API, the types
> and the docs are in English.

```bash
npm install sitewright-core
```

Peer dependencies: `next` ≥ 16, `payload` ≥ 3.88, `react` ≥ 19, plus `@payloadcms/ui` and
`@vercel/blob` if you use the panel components or the image backup.

## What you get

### `sitewright-core` — logic, no dependencies on your CMS

```ts
import { splitEvents, formatEventDate, parseEmbed, buttonColors } from 'sitewright-core'

// Something stops being upcoming when it *ends*, not when it starts — which is why a
// party happening tonight does not vanish from the page at lunchtime.
const { upcoming, past } = splitEvents(dates, Date.now())
formatEventDate(upcoming[0].startsAt, upcoming[0].endsAt) // "viernes, 5 de marzo, 23:30–05:00"

// Whatever the client pasted becomes a player, or nothing at all: SoundCloud, Mixcloud,
// YouTube and Bandcamp, normalised, with the platform link as a fallback.
parseEmbed('https://youtu.be/abc123')?.embedUrl

// Which ink reads on your accent is measurable, so it is measured.
buttonColors({ accent: '#99423b', accentSoft: '#a67800', ink: '#1e2a1a', ground: '#f3f2e1' })
// → { text: '#f3f2e1', hover: 'color-mix(in srgb, #99423b 85%, black)' }
```

Also here: `resolveSiteUrl` (one place decides your canonical domain), `mediaUrl` /
`mediaAlt` / `mediaSize` for reading upload fields, `slugify`, `alternateTones` for
alternating section backgrounds over the sections that actually render, `escapeHtml`, and the
rate-limit primitives for public forms (`requestIp`, `recordSubmission`, `exceedsGlobalCeiling`).

### `sitewright-core/payload` — collections and hooks

```ts
import { mediaCollection, usersCollection, createRevalidation } from 'sitewright-core/payload'

const { revalidator, globalRevalidator } = createRevalidation(['/', '/llms.txt'])

export default buildConfig({
  collections: [
    usersCollection(),
    mediaCollection({
      altExample: 'El equipo trabajando en el taller',
      revalidation: revalidator(),
    }),
  ],
})
```

`mediaCollection` brings the whole image story: every URL carries its modification date, so
an edit is visible immediately instead of behind a year of cache; an untouched copy is stored
on first upload; and a "back to the original" button undoes any crop through its own
endpoint, because doing it in a save hook deadlocks the panel.

### `sitewright-core/ui` — client components

```tsx
import { ConsentProvider, ConsentedAnalytics } from 'sitewright-core/ui'
import { needsCookieBanner } from 'sitewright-core'

<ConsentProvider
  storageKey="my-site"
  showBanner={needsCookieBanner({ analyticsRequiresConsent: true })}
>
  {children}
  <ConsentedAnalytics requireConsent />
</ConsentProvider>
```

No third-party iframe is rendered before consent; each player shows a placeholder that asks
in place, with a link to the platform for whoever says no. The components ship **no styles**:
they render known class names (`consent`, `embed`, `embed-blocked`, …) so the look belongs to
your stylesheet.

### Legal pages, generated

```ts
import { legalNotice, privacyPolicy, cookiePolicy } from 'sitewright-core'

legalNotice(settings, siteUrl) // → [{ heading, paragraphs }, …]
```

Spanish notice, privacy and cookie policies written from the data the client filled in — and
leaving out what they did not, because a privacy policy naming the wrong data controller is
worse than one naming none. They are a solid draft, not legal advice.

## The audit

The package ships a CLI that checks a running site and **exits non-zero when something
fails**, so it can gate a deploy:

```bash
npx sitewright-audit --url https://example.com --css src/app/styles.css --migrations src/migrations
```

Ten gates: canonical, sitemap and robots naming the same host **and that host answering 200
instead of redirecting**; the four security headers; JSON-LD that parses and whose `@id`
references resolve; `/llms.txt`; the legal pages existing *and being linked*; no third-party
iframe served before consent; images with alternative text and responsive sizes; WCAG AA
contrast measured over your CSS tokens; page weight; and a database with no dev-mode marks
and no pending migrations.

Every one of them is there because it went wrong on a live site.

## License

MIT
