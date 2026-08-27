import { joinWithAnd } from './list'

/** What any consumer needs from an event to place it in time. */
export type DatedEvent = {
  startsAt?: string | null
  endsAt?: string | null
}

/**
 * An event stops being upcoming when it **ends**, not when it starts.
 *
 * Getting this wrong is what makes a site look abandoned by lunchtime: the party that is
 * happening tonight disappears from "próximas fechas" the moment the clock passes the
 * door time. With no end time, the date itself is the boundary.
 */
export function isUpcoming(event: DatedEvent, now: number): boolean {
  const end = event.endsAt ?? event.startsAt
  if (!end) return false
  const time = Date.parse(end)
  return Number.isFinite(time) && time >= now
}

/**
 * Splits a list in two, each in the order its section reads best: what is coming, soonest
 * first; what happened, most recent first. Events with no date are dropped — an event
 * without a date cannot be placed anywhere honestly.
 */
export function splitEvents<T extends DatedEvent>(events: T[], now: number) {
  const dated = events.filter((e) => e.startsAt && Number.isFinite(Date.parse(e.startsAt)))
  const upcoming = dated
    .filter((e) => isUpcoming(e, now))
    .sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!))
  const past = dated
    .filter((e) => !isUpcoming(e, now))
    .sort((a, b) => Date.parse(b.startsAt!) - Date.parse(a.startsAt!))

  return { upcoming, past }
}

/** Groups past events by year, newest year first: the shape the archive is read in. */
export function groupByYear<T extends DatedEvent>(events: T[]): { year: number; events: T[] }[] {
  const years = new Map<number, T[]>()
  for (const event of events) {
    const year = new Date(event.startsAt!).getFullYear()
    years.set(year, [...(years.get(year) ?? []), event])
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => ({ year, events: list }))
}

const MADRID = 'Europe/Madrid'

/**
 * Dates are written in the site's timezone, not the visitor's.
 *
 * The doors open at the venue's local time; showing a Berlin visitor "01:00" for a party
 * that starts at midnight in Madrid would be technically right and practically useless.
 */
export function formatEventDate(
  startsAt: string,
  endsAt?: string | null,
  { showYear = false }: { showYear?: boolean } = {},
): string {
  const start = new Date(startsAt)
  const date = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    // The archive needs it: "2 de agosto" says nothing about which year the collective
    // played. Upcoming dates leave it out, where the year is obvious and only adds noise.
    ...(showYear ? { year: 'numeric' as const } : {}),
    timeZone: MADRID,
  }).format(start)

  const time = (value: Date) =>
    new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: MADRID }).format(
      value,
    )

  const hours = endsAt ? `${time(start)}–${time(new Date(endsAt))}` : time(start)
  return `${date}, ${hours}`
}

/** "Ana, Bruno y Carla" — the line-up as it reads under a date. */
export function formatLineup(names: string[]): string {
  return joinWithAnd(names.filter(Boolean))
}
