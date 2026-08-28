import type { LlmsSection } from '@/lib/llmsTxt'
import { formatEventDate, splitEvents } from 'sitewright-core'
import type { ScheduleItem } from './Row'

const IN_ARCHIVE = 8

function line(item: ScheduleItem, past: boolean): string {
  const when = formatEventDate(item.startsAt, item.endsAt, { showYear: past })
  const where = [item.venue, item.city].filter(Boolean).join(', ')
  // Only what the client actually filled in: an empty price is not "free".
  const price = item.free ? 'entrada libre' : item.price != null ? `${item.price} €` : ''
  return `- ${[item.title, when, where, price].filter(Boolean).join(' · ')}`
}

/** What is coming and what happened, in two sections: an assistant asked about either. */
export function scheduleSections(
  items: ScheduleItem[],
  now: number,
  titles: { upcoming: string; past: string },
): LlmsSection[] {
  const { upcoming, past } = splitEvents(items, now)
  return [
    { title: titles.upcoming, lines: upcoming.map((item) => line(item, false)) },
    { title: titles.past, lines: past.slice(0, IN_ARCHIVE).map((item) => line(item, true)) },
  ]
}
