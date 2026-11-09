#!/usr/bin/env node
/**
 * El probador: la paleta y las letras de un blueprint, vistas en los cinco estilos y las
 * cuatro portadas, en una sola página.
 *
 * La entrevista preguntaba el aspecto con palabras —«¿sobrio o con fuerza?»— y la respuesta
 * llegaba al blueprint como cinco ejes que nadie había visto. Aquí se ven antes de elegir.
 *
 * No es una maqueta aparte: usa **la hoja de estilos que escribiría el generador**, con los
 * mismos escritores, y el marcado de las secciones copiado de los módulos. Lo que no tiene
 * es contenido de verdad, y por eso los textos dicen que son de ejemplo: un precio o una
 * fecha inventados acaban en una captura que alguien enseña como si fueran ciertos.
 *
 *   node generator/probador.js --blueprint <ruta> [--out probador.html]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { validateBlueprint } from './schema.js'
import { applyPalette, moduleStyles } from './lib/design.js'
import { HERO_LAYOUTS, PRESETS, applyStyle, resolveStyle } from './lib/style.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

const escape = (text) =>
  String(text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/** La hoja de un estilo, escrita como la escribiría el generador. */
export function sheetFor(bp, preset) {
  const css = readFileSync(join(ROOT, 'template/src/app/(frontend)/styles.css'), 'utf8')
  const design = { ...bp.design, style: { ...bp.design.style, preset } }
  // Los ejes sueltos del blueprint se descartan aquí: el probador enseña los estilos tal
  // como son, que es entre lo que se elige.
  for (const axis of ['shape', 'density', 'type', 'surface', 'motion']) delete design.style[axis]
  // Con las hojas de las secciones que enseña, aunque esta web no las tenga: si no, unas
  // tarifas sin su hoja se ven como una lista suelta y parecen un fallo del estilo.
  const shown = { catalog: {}, pricing: {}, ...bp.modules }
  return moduleStyles(applyStyle(applyPalette(css, design), design), join(ROOT, 'modules'), shown)
}

const family = (font) => (typeof font === 'string' ? font : font.family)
const weights = (font, fallback) => (typeof font === 'string' ? fallback : (font.weights ?? fallback))

function fontsLink(fonts) {
  const spec = (font, fallback) =>
    `family=${family(font).replaceAll(' ', '+')}:wght@${[...new Set(weights(font, fallback))].sort().join(';')}`
  return `https://fonts.googleapis.com/css2?${spec(fonts.display, ['400'])}&${spec(fonts.body, ['400', '500', '600'])}&display=swap`
}

/** Una foto de mentira, hecha con la propia paleta: sin foto no se ven tres de las cuatro portadas. */
function placeholderPhoto(palette) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.accent}"/><stop offset="1" stop-color="${palette.ink}"/></linearGradient>
<radialGradient id="b" cx=".7" cy=".3" r=".6"><stop offset="0" stop-color="${palette.accentSoft ?? palette.accent}" stop-opacity=".9"/><stop offset="1" stop-color="${palette.ground}" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="1000" fill="url(#a)"/><rect width="1600" height="1000" fill="url(#b)"/>
<circle cx="1180" cy="420" r="210" fill="${palette.ground}" opacity=".25"/><rect x="180" y="560" width="620" height="440" fill="${palette.ground}" opacity=".18"/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** Una portada y unas secciones con el marcado de los módulos, sin datos de nadie. */
export function pageFor(bp, sheet, hero = 'foto') {
  const name = escape(bp.identity.name)
  const tagline = escape(bp.identity.tagline ?? 'Aquí va la frase que explica a qué os dedicáis.')
  const photo = placeholderPhoto(bp.design.palette)
  const cards = [1, 2, 3]
    .map(
      (n) => `<article class="card"><div class="card-link"><div class="card-image"><div class="card-image-empty"></div></div>
<h3>Título de ejemplo ${n}</h3><p>Dos líneas de resumen para ver cómo respira el texto debajo de una imagen.</p>
<ul class="tags"><li>Etiqueta</li><li>Otra</li></ul></div></article>`,
    )
    .join('')
  const prices = ['Básica', 'La más pedida', 'Completa']
    .map(
      (label, i) => `<article class="price ${i === 1 ? 'price-highlighted' : ''}"><h3>${label}</h3>
<p class="price-amount">Precio</p><p class="price-text">Lo que incluye, en una frase.</p>
<ul class="price-includes"><li>Un punto</li><li>Otro punto</li></ul><a class="btn btn-ghost" href="#">Me interesa</a></article>`,
    )
    .join('')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${fontsLink(bp.design.fonts)}">
<style>:root{--font-display-google:'${family(bp.design.fonts.display)}';--font-body-google:'${family(bp.design.fonts.body)}'}</style>
<style>${sheet}</style></head><body>
<nav class="nav"><div class="container nav-inner"><a class="brand" href="#">${name}</a>
<div class="nav-links"><a href="#">Quiénes somos</a><a href="#">Catálogo</a><a href="#">Tarifas</a><a class="nav-cta" href="#">Contacto</a></div></div></nav>
<header class="hero layout-${hero} text-left height-bottom shade-full ink-light${hero === 'tipografica' ? '' : `${hero === 'partida' ? '' : ' hero-has-image'} hero-with-media`}" id="inicio" style="--title-chars:${Math.max(4, ...bp.identity.name.split(/\s+/).map((w) => w.length))}">
<div class="hero-media"${hero === 'tipografica' ? ' hidden' : ''}><img class="hero-img" alt="" src="${photo}" style="position:absolute;inset:0;width:100%;height:100%;object-position:50% 50%"></div>
<div class="hero-bg"${hero === 'tipografica' ? '' : ' hidden'}></div><div class="hero-overlay"></div>
<div class="container"><div class="hero-content"><span class="kicker">${name}</span><h1>${name}</h1>
<p class="hero-text">${tagline}</p><div class="hero-actions"><a class="btn btn-primary" href="#">Escríbenos</a><a class="btn btn-ghost" href="#">Ver más</a></div></div></div></header>
<section class="section tone-light"><div class="container"><div class="section-head"><h2>Catálogo</h2><a class="section-more" href="#">Ver todo</a>
<p>Una entradilla de ejemplo para la sección, de las que explican qué hay debajo.</p></div><div class="cards">${cards}</div></div></section>
<section class="section tone-mid"><div class="container"><div class="section-head"><h2>Tarifas</h2></div><div class="prices">${prices}</div></div></section>
<section class="section tone-light"><div class="container"><div class="section-head"><h2>Opiniones</h2></div><ul class="quotes">
<li><figure><blockquote>Una opinión de ejemplo, del largo de las que la gente deja de verdad.</blockquote><figcaption>Nombre <span class="quote-source">Dónde</span></figcaption></figure></li>
<li><figure><blockquote>Otra, más corta.</blockquote><figcaption>Otro nombre</figcaption></figure></li></ul></div></section>
<section class="section tone-mid"><div class="container container-narrow"><div class="section-head"><h2>Preguntas frecuentes</h2></div><div class="faqs">
<details open><summary>¿Una pregunta de ejemplo?</summary><p>Y su respuesta, para ver el cuerpo de texto.</p></details>
<details><summary>¿Otra pregunta?</summary><p>Otra respuesta.</p></details></div></div></section>
<footer class="foot"><div class="container"><p class="foot-brand">${name}</p></div></footer>
<script>
const photo=${JSON.stringify(photo)};
window.addEventListener('message',(e)=>{const h=document.querySelector('.hero');const l=e.data&&e.data.hero;if(!l)return;
const img=l!=='tipografica';h.className='hero layout-'+l+' text-left height-bottom shade-full ink-light'+(img&&l!=='partida'?' hero-has-image':'')+(img?' hero-with-media':'');
h.querySelector('.hero-media').hidden=!img;h.querySelector('.hero-bg').hidden=img;});
</script></body></html>`
}

export function probador(bp) {
  const presets = Object.keys(PRESETS)
  const chosen = resolveStyle(bp.design.style)
  const pages = Object.fromEntries(presets.map((p) => [p, pageFor(bp, sheetFor(bp, p))]))
  const describe = (p) => Object.values(PRESETS[p]).join(' · ')
  const name = escape(bp.identity.name)
  const start = bp.design.style?.preset ?? 'nocturno'
  const hero = bp.design.style?.hero ?? 'foto'

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Probador de ${name}</title>
<style>
:root{--bg:#f5f4f1;--fg:#1b1b1d;--soft:#5d5b57;--line:#dcd9d2;--on:#1b1b1d;--on-fg:#fff;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#141416;--fg:#ecebe8;--soft:#a3a09a;--line:#2c2c30;--on:#ecebe8;--on-fg:#141416;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
header{padding:16px;display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;border-bottom:1px solid var(--line)}
h1{font-size:17px;margin:0 auto 0 0}.group{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.group span{color:var(--soft);font-size:13px;margin-right:4px}
button{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:transparent;color:var(--fg);cursor:pointer}
button[aria-pressed=true]{background:var(--on);color:var(--on-fg);border-color:var(--on)}
p.note{margin:0;padding:10px 16px;color:var(--soft);font-size:13px;border-bottom:1px solid var(--line)}
main{display:flex;justify-content:center;padding:16px}iframe{border:1px solid var(--line);border-radius:8px;width:100%;max-width:1280px;height:78vh;background:#fff;transition:max-width .2s}
main.mobile iframe{max-width:390px}
</style></head><body>
<header><h1>Probador · ${name}</h1>
<div class="group" role="group" aria-label="Estilo"><span>Estilo</span>${presets.map((p) => `<button data-preset="${p}" title="${escape(describe(p))}">${p}</button>`).join('')}</div>
<div class="group" role="group" aria-label="Portada"><span>Portada</span>${HERO_LAYOUTS.map((h) => `<button data-hero="${h}">${h}</button>`).join('')}</div>
<div class="group" role="group" aria-label="Ancho"><span>Ancho</span><button data-width="desktop">escritorio</button><button data-width="mobile">móvil</button></div>
</header>
<p class="note" id="axes"></p>
<main id="stage"><iframe id="frame" title="Vista previa"></iframe></main>
<script>
const pages=${JSON.stringify(pages).replaceAll('<', '\\u003c')};
const presets=${JSON.stringify(PRESETS)};
const blueprint=${JSON.stringify(chosen)};
let state={preset:${JSON.stringify(start)},hero:${JSON.stringify(hero)},width:'desktop'};
const frame=document.getElementById('frame');
function press(){document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.preset===state.preset));
document.querySelectorAll('[data-hero]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.hero===state.hero));
document.querySelectorAll('[data-width]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.width===state.width));
document.getElementById('stage').className=state.width;
const a=presets[state.preset];document.getElementById('axes').textContent='forma '+a.shape+' · densidad '+a.density+' · letra '+a.type+' · superficie '+a.surface+' · movimiento '+a.motion+'   —   en el blueprint: "style": { "preset": "'+state.preset+'"'+(state.hero!=='foto'?', "hero": "'+state.hero+'"':'')+' }';}
function load(){frame.onload=()=>frame.contentWindow.postMessage({hero:state.hero},'*');frame.srcdoc=pages[state.preset];press();}
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{state.preset=b.dataset.preset;load()});
document.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>{state.hero=b.dataset.hero;frame.contentWindow.postMessage({hero:state.hero},'*');press()});
document.querySelectorAll('[data-width]').forEach(b=>b.onclick=()=>{state.width=b.dataset.width;press()});
load();
</script></body></html>`
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = arg('blueprint')
  if (!path) {
    console.error('Uso: node generator/probador.js --blueprint <ruta> [--out probador.html]')
    process.exit(2)
  }
  const bp = JSON.parse(readFileSync(path, 'utf8'))
  const errors = validateBlueprint(bp)
  if (errors.length) {
    console.error(`El blueprint no está listo:\n${errors.map((e) => `  · ${e}`).join('\n')}`)
    process.exit(1)
  }
  const out = arg('out') ?? 'probador.html'
  writeFileSync(out, probador(bp))
  console.log(`Probador escrito en ${out}`)
}
