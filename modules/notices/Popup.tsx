'use client'

import React, { useSyncExternalStore } from 'react'
import Image from 'next/image'
import { mediaAlt, mediaUrl } from 'sitewright-core'

export type Notice = {
  id: number | string
  updatedAt: string
  title: string
  text?: string | null
  image?: unknown
  buttonLabel?: string | null
  buttonUrl?: string | null
}

/**
 * The notice the collective wants seen on arrival.
 *
 * Dismissing it is remembered per notice, not globally: publishing a new one has to reach
 * someone who closed the previous one. The key carries the notice's own timestamp, so
 * editing it brings it back as well.
 */

const dismissed = new Set<string>()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function isDismissed(key: string): boolean {
  if (dismissed.has(key)) return true
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function dismiss(key: string) {
  dismissed.add(key)
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Not remembering only means it shows again later; nothing breaks.
  }
  for (const listener of listeners) listener()
}

export default function NoticePopup({
  notice,
  siteId,
}: {
  notice: Notice | null
  /** Keeps two Sitewright sites in one browser from silencing each other's notices. */
  siteId: string
}) {
  const key = notice ? `sitewright:${siteId}:notice:${notice.id}:${notice.updatedAt}` : ''

  const open = useSyncExternalStore(
    subscribe,
    () => Boolean(key) && !isDismissed(key),
    // On the server nothing is known about this visitor, so the notice starts closed and
    // opens on hydration. Rendering it open would flash it at whoever already closed it.
    () => false,
  )

  if (!notice || !open) return null
  const image = mediaUrl(notice.image)

  return (
    <div className="notice-backdrop" role="dialog" aria-modal="true" aria-label={notice.title}>
      <div className="notice">
        <button
          type="button"
          className="notice-close"
          onClick={() => dismiss(key)}
          aria-label="Cerrar aviso"
        >
          ×
        </button>
        {image ? (
          <Image src={image} alt={mediaAlt(notice.image) || ''} width={900} height={600} />
        ) : null}
        <div className="notice-body">
          <h2>{notice.title}</h2>
          {notice.text ? <p>{notice.text}</p> : null}
          {notice.buttonUrl ? (
            <a className="btn btn-primary" href={notice.buttonUrl} onClick={() => dismiss(key)}>
              {notice.buttonLabel || 'Ver más'}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
