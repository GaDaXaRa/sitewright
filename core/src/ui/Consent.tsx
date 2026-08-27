'use client'

import React, { createContext, useContext, useSyncExternalStore } from 'react'

/**
 * Cookie consent, and what depends on it.
 *
 * Two things on this site cannot run before the visitor accepts: the audience measurement
 * and the third-party players (SoundCloud, Mixcloud, YouTube), which set their own
 * cookies. Both ask this context instead of deciding on their own, so there is a single
 * place where "has this person accepted?" is answered.
 *
 * The answer lives in localStorage, read through `useSyncExternalStore`: no server, no
 * identifier, nothing stored about who visited. Reading it can throw in a browser with
 * site data blocked, so every access is guarded and falls back to memory — that visitor
 * gets asked again next time, which is the safe way to fail.
 */

type Status = 'unknown' | 'accepted' | 'declined'

/**
 * The storage key carries the site's name so two Sitewright sites open in the same browser
 * do not answer for each other.
 */
let KEY = 'sitewright:consent'



// Answer for this page load when the browser refuses to store anything.
let inMemory: Status | null = null

const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  // Another tab answering the banner counts as answering it here too.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function getSnapshot(): Status {
  if (inMemory) return inMemory
  try {
    const stored = window.localStorage.getItem(KEY)
    if (stored === 'accepted' || stored === 'declined') return stored
  } catch {
    // Storage blocked: treated as unanswered.
  }
  return 'unknown'
}

// The server cannot know the answer, so it always renders the unanswered state; the real
// one arrives on hydration.
const getServerSnapshot = (): Status => 'unknown'

function remember(value: Status) {
  inMemory = value
  try {
    window.localStorage.setItem(KEY, value)
  } catch {
    // The choice still applies to this visit.
  }
  for (const listener of listeners) listener()
}

const ConsentContext = createContext<{
  status: Status
  accept: () => void
  decline: () => void
}>({ status: 'unknown', accept: () => {}, decline: () => {} })

export function useConsent() {
  return useContext(ConsentContext)
}

export function ConsentProvider({
  storageKey,
  cookiesHref = '/cookies',
  children,
}: {
  /** Something stable and site-specific, e.g. "subsuelo". */
  storageKey: string
  /** Where the cookie policy lives on this site. */
  cookiesHref?: string
  children: React.ReactNode
}) {
  KEY = `sitewright:${storageKey}:consent`

  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <ConsentContext.Provider
      value={{
        status,
        accept: () => remember('accepted'),
        decline: () => remember('declined'),
      }}
    >
      {children}
      {status === 'unknown' ? <ConsentBanner cookiesHref={cookiesHref} /> : null}
    </ConsentContext.Provider>
  )
}

function ConsentBanner({ cookiesHref }: { cookiesHref: string }) {
  const { accept, decline } = useConsent()

  return (
    <div className="consent" role="dialog" aria-label="Cookies" aria-live="polite">
      <p>
        Usamos cookies para medir las visitas y para los reproductores de SoundCloud, Mixcloud y
        YouTube. Sin aceptar, la web funciona igual: los reproductores se sustituyen por un
        enlace. <a href={cookiesHref}>Más detalles</a>.
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-ghost" onClick={decline}>
          Solo lo imprescindible
        </button>
        <button type="button" className="btn btn-primary" onClick={accept}>
          Aceptar
        </button>
      </div>
    </div>
  )
}
