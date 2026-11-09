/**
 * The styles and cover compositions a site's owner can choose from her panel.
 *
 * The ids have to match what the generator writes into the stylesheet
 * (`generator/lib/style.js`); a test there reads this file and fails if they drift. The
 * words are the owner's: she picks by what a style feels like, not by its axes.
 */
export const STYLES = [
  {
    id: 'nocturno',
    label: 'Nocturno',
    description: 'Titulares en mayúsculas, apretados, como el cartel de una sala. Quieto.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Caja baja y mucho aire, como una revista. Esquinas rectas y filetes finos.',
  },
  {
    id: 'cartel',
    label: 'Cartel',
    description: 'Letra enorme y pesada, con grano. El título entra con movimiento.',
  },
  {
    id: 'sereno',
    label: 'Sereno',
    description: 'Esquinas redondas, tarjetas que flotan y titulares discretos.',
  },
  {
    id: 'cercano',
    label: 'Cercano',
    description: 'Redondo y cálido, con tarjetas que flotan y titulares en caja baja.',
  },
] as const

export type StyleId = (typeof STYLES)[number]['id']

export const HERO_LAYOUTS = [
  { id: 'foto', label: 'Foto de fondo, con el texto encima' },
  { id: 'partida', label: 'Texto a un lado y foto al otro' },
  { id: 'enmarcada', label: 'Foto enmarcada, con aire alrededor' },
  { id: 'tipografica', label: 'Sólo el título, sin foto' },
] as const

export type HeroLayoutId = (typeof HERO_LAYOUTS)[number]['id']

export const isStyle = (value: unknown): value is StyleId =>
  STYLES.some((style) => style.id === value)

export const isHeroLayout = (value: unknown): value is HeroLayoutId =>
  HERO_LAYOUTS.some((layout) => layout.id === value)
