/** One thing that was checked, and how it went. */
export type Finding = {
  /** The gate it belongs to, e.g. "identidad". */
  gate: string
  /** What was checked, written so a person can act on it. */
  what: string
  status: 'ok' | 'fail' | 'warn' | 'skip'
  /** Only when it is not ok: what was found, and where. */
  detail?: string
}

export const ok = (gate: string, what: string, detail?: string): Finding => ({
  gate,
  what,
  status: 'ok',
  ...(detail ? { detail } : {}),
})

export const fail = (gate: string, what: string, detail: string): Finding => ({
  gate,
  what,
  status: 'fail',
  detail,
})

export const warn = (gate: string, what: string, detail: string): Finding => ({
  gate,
  what,
  status: 'warn',
  detail,
})

export const skip = (gate: string, what: string, detail: string): Finding => ({
  gate,
  what,
  status: 'skip',
  detail,
})

/** A page as it was fetched, which is all most checks need. */
export type Fetched = {
  url: string
  status: number
  /** Where it ended up, when it redirected. */
  finalUrl: string
  headers: Record<string, string>
  body: string
}
