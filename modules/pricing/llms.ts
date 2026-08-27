import type { LlmsSection } from '@/lib/llmsTxt'
import { priceLabel, type Price } from './Section'

/**
 * Prices are the question assistants get asked most, and the one where inventing is worst.
 * "A convenir" is written as such — never guessed at, never omitted into silence.
 */
export function pricingSection(prices: Price[], title: string): LlmsSection {
  return {
    title,
    lines: prices.map(
      (price) => `- ${[price.name, priceLabel(price), price.description].filter(Boolean).join(' · ')}`,
    ),
  }
}
