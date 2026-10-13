export function getTimestamp() {
  return Math.round(Number(new Date()))
}

export function timestamp2ISO8601(ts: number) {
  try {
    return new Date(ts).toISOString()
  } catch {
    return ''
  }
}

export function iso8601Date() {
  return new Date().toISOString()
}

export function iso8601ToTimestamp(t: string) {
  return Math.round(Number(new Date(t)))
}

/** Locale aware, short date + time for stored records. */
export function formatDateTime(ts?: number, locale?: string) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return new Date(ts).toLocaleString()
  }
}

/** Locale aware, date only. */
export function formatDate(ts?: number, locale?: string) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString(locale, { dateStyle: 'medium' })
  } catch {
    return new Date(ts).toLocaleDateString()
  }
}
