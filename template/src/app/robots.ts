import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Rastreadores de buscadores con IA (GEO): se permiten explícitamente para poder
// aparecer citados en ChatGPT/SearchGPT, Perplexity, Google AI Overviews, etc.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-Web',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Todos los bots: web pública sí; panel y API no se indexan.
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      // Rastreadores de IA: bienvenidos a la web pública.
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow: ['/admin', '/api'] })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
