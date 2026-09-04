import type { LlmsContext, LlmsSection } from '@/lib/llmsTxt'
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
export function scheduleSections(items: ScheduleItem[], ctx: LlmsContext): LlmsSection[] {
  const { upcoming, past } = splitEvents(items, ctx.now)
  return [
    { title: ctx.title, lines: upcoming.map((item) => line(item, false)) },
    { title: String(ctx.options?.past ?? 'Anteriores'), lines: past.slice(0, IN_ARCHIVE).map((item) => line(item, true)) },
  ]
}
