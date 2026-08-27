import { loadSiteContent } from '@/lib/data'
import { buildLlmsTxt } from '@/lib/llmsTxt'

/**
 * /llms.txt — a plain-text summary for AI assistants.
 *
 * Models answering questions ("¿quién pincha el sábado en Madrid?") cite better what they
 * can read without interpreting HTML. It is generated from the CMS, so it cannot fall out
 * of date: change a date in the panel and it changes here.
 *
 * This route only reads; the writing lives in `lib/llmsTxt.ts`, which is pure and tested.
 */
export const revalidate = 3600

export async function GET() {
  const { settings } = await loadSiteContent()

  // Each module contributes its own section through `sections`.
  const text = buildLlmsTxt({ settings })

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
