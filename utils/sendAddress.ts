export const DUCK_DOMAIN = 'duck.com'

/** Full `local@duck.com` address for a stored alias local part. */
export function fullAddress(local?: string | null) {
  if (!local) return ''
  return local.includes('@') ? local : `${local}@${DUCK_DOMAIN}`
}

const RECIPIENT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidRecipient(email: string) {
  return RECIPIENT_REGEX.test(email.trim())
}

const ALIAS_REGEX = /^[a-z0-9][a-z0-9._-]{0,63}$/

/** Accepts `spider`, `spider@duck.com` and returns the local part, or null. */
export function normalizeAlias(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  let local = raw.trim().toLowerCase()
  if (!local) return null
  if (local.includes('@')) {
    const parts = local.split('@')
    if (parts.length !== 2 || parts[1] !== DUCK_DOMAIN) return null
    local = parts[0]
  }
  return ALIAS_REGEX.test(local) ? local : null
}

/**
 * DuckDuckGo turns a recipient into a "send address" so you can start a new
 * conversation from one of your Duck addresses. The conversion is purely local:
 * `someone@example.com` + alias `spider` -> `someone_at_example.com_spider@duck.com`.
 */
export function toSendAddress(recipient: string, senderLocal: string) {
  return `${recipient.trim().replace('@', '_at_')}_${senderLocal}@${DUCK_DOMAIN}`
}
