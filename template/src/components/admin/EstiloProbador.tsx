'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { HERO_LAYOUTS, STYLES, type HeroLayoutId, type StyleId } from '@/lib/estilos'

type Props = {
  initialStyle: StyleId
  initialHero: HeroLayoutId
  hasHeroImage: boolean
  apiRoute: string
}

const LAYOUT_CLASSES = HERO_LAYOUTS.map(({ id }) => `layout-${id}`)

/**
 * Prueba un estilo y una portada sobre la web real y los guarda.
 *
 * La web va en un marco del mismo origen, así que se le puede cambiar el `data-estilo` de
 * `<html>` y las clases de la portada sin recargar: es exactamente lo que hará la web al
 * guardar, porque el estilo es un bloque de variables y la portada, unas clases.
 *
 * Lo único que no se puede enseñar así es una foto que no está en la página: si la portada
 * guardada es la tipográfica, la foto no se descargó, y se avisa en vez de fingirla.
 */
export default function EstiloProbador({ initialStyle, initialHero, hasHeroImage, apiRoute }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [saved, setSaved] = useState({ style: initialStyle, hero: initialHero })
  const [style, setStyle] = useState<StyleId>(initialStyle)
  const [hero, setHero] = useState<HeroLayoutId>(initialHero)
  const [phone, setPhone] = useState(false)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error' | 'busy'; text: string } | null>(null)

  const photoInPage = hasHeroImage && saved.hero !== 'tipografica'
  const missingPhoto = hasHeroImage && !photoInPage && hero !== 'tipografica'

  const apply = useCallback(() => {
    const doc = frame.current?.contentDocument
    if (!doc?.documentElement) return
    doc.documentElement.dataset.estilo = style

    const cover = doc.querySelector<HTMLElement>('header.hero')
    if (cover) {
      const media = cover.querySelector<HTMLElement>('.hero-media')
      const image = Boolean(media) && hero !== 'tipografica'
      cover.classList.remove(...LAYOUT_CLASSES, 'hero-has-image', 'hero-with-media')
      cover.classList.add(`layout-${hero}`)
      if (image) cover.classList.add('hero-with-media')
      if (image && hero !== 'partida') cover.classList.add('hero-has-image')
      if (media) media.hidden = !image
    }

    // The title's entrance runs once, at load. Restarting it is the only way to show what
    // a style with movement does without asking her to reload.
    const title = doc.querySelector<HTMLElement>('.hero h1')
    if (title) {
      title.style.animation = 'none'
      void title.offsetWidth
      title.style.animation = ''
    }
  }, [style, hero])

  useEffect(apply, [apply])

  const dirty = style !== saved.style || hero !== saved.hero

  async function save() {
    setStatus({ kind: 'busy', text: 'Guardando…' })
    try {
      const res = await fetch(`${apiRoute}/globals/site-settings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylePreset: style, heroLayout: hero }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSaved({ style, hero })
      setStatus({ kind: 'ok', text: 'Guardado. La web ya se ve así.' })
      // The saved page is regenerated on demand; reloading shows the real thing, including
      // a cover photo the preview could not show.
      setTimeout(() => frame.current?.contentWindow?.location.reload(), 800)
    } catch {
      setStatus({ kind: 'error', text: 'No se ha podido guardar. Inténtalo de nuevo.' })
    }
  }

  return (
    <div className="sw-estilo">
      <style>{STYLE}</style>
      <h1>Estilo de la web</h1>
      <p className="sw-lede">
        Prueba cada estilo sobre tu web, con tus textos y tus fotos. Nada cambia para quien
        la visita hasta que pulses «Guardar».
      </p>

      <fieldset>
        <legend>Estilo</legend>
        <div className="sw-options">
          {STYLES.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={style === option.id}
              onClick={() => setStyle(option.id)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Portada</legend>
        <div className="sw-chips">
          {HERO_LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={hero === option.id}
              onClick={() => setHero(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {missingPhoto ? (
          <p className="sw-hint">La foto de portada se verá al guardar.</p>
        ) : null}
      </fieldset>

      <div className="sw-bar">
        <div className="sw-chips" role="group" aria-label="Ancho de la vista previa">
          <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)}>
            Ordenador
          </button>
          <button type="button" aria-pressed={phone} onClick={() => setPhone(true)}>
            Móvil
          </button>
        </div>
        <div className="sw-save">
          {status ? (
            <span className={`sw-status sw-${status.kind}`} role="status">
              {status.text}
            </span>
          ) : null}
          <button
            type="button"
            className="sw-primary"
            disabled={!dirty || status?.kind === 'busy'}
            onClick={save}
          >
            Guardar
          </button>
        </div>
      </div>

      <div className={`sw-stage ${phone ? 'sw-phone' : ''}`}>
        <iframe ref={frame} src="/" title="Vista previa de la web" onLoad={apply} />
      </div>
    </div>
  )
}

const STYLE = `
.sw-estilo {
  padding: calc(var(--base) * 1.75) var(--gutter-h) var(--spacing-view-bottom);
  display: flex;
  flex-direction: column;
  gap: calc(var(--base) * 1.1);
}
.sw-estilo h1 { margin: 0; font-size: 2rem; letter-spacing: -.02em; }
.sw-estilo .sw-lede { margin: 0; max-width: 40rem; color: var(--theme-elevation-600); font-size: 1.1rem; }
.sw-estilo fieldset { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .6rem; }
.sw-estilo legend { font-weight: 600; margin-bottom: .5rem; padding: 0; }
.sw-estilo button {
  font: inherit; cursor: pointer; color: var(--theme-text);
  background: var(--theme-elevation-0); border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-m, 6px);
}
.sw-estilo button:hover { border-color: var(--theme-elevation-400); }
.sw-estilo button[aria-pressed='true'] { border-color: var(--theme-text); box-shadow: inset 0 0 0 1px var(--theme-text); }
.sw-estilo button:focus-visible { outline: 2px solid var(--theme-success-500, currentColor); outline-offset: 2px; }
.sw-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: .6rem; }
.sw-options button { text-align: left; padding: .75rem .9rem; display: flex; flex-direction: column; gap: .25rem; }
.sw-options span { color: var(--theme-elevation-600); font-size: .9rem; line-height: 1.4; }
.sw-chips { display: flex; flex-wrap: wrap; gap: .5rem; }
.sw-chips button { padding: .45rem .8rem; font-size: .95rem; }
.sw-hint { margin: 0; color: var(--theme-elevation-600); font-size: .95rem; }
.sw-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
.sw-save { display: flex; align-items: center; gap: .75rem; }
.sw-estilo .sw-primary {
  padding: .6rem 1.4rem; font-weight: 600;
  background: var(--theme-text); color: var(--theme-bg); border-color: var(--theme-text);
}
.sw-estilo .sw-primary:disabled { opacity: .45; cursor: default; }
.sw-status { font-size: .95rem; }
.sw-error { color: var(--theme-error-500, #b02318); }
.sw-stage {
  border: 1px solid var(--theme-elevation-150); border-radius: var(--style-radius-m, 6px);
  overflow: hidden; background: var(--theme-elevation-50);
}
.sw-stage iframe { display: block; width: 100%; height: 72vh; border: 0; background: #fff; }
.sw-stage.sw-phone { display: flex; justify-content: center; padding: 1rem 0; }
.sw-stage.sw-phone iframe { width: 390px; max-width: 100%; border: 1px solid var(--theme-elevation-150); }
`
