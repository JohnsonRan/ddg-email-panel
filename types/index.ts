export type AddressSource = 'generate' | 'import' | 'manual'

/** A private @duck.com alias, mirrored locally so it survives reloads. */
export interface StoredAddress {
  /** Local part only, without the `@duck.com` suffix. */
  value: string
  createdAt: number
  updatedAt?: number
  notes?: string
  tags?: string[]
  source?: AddressSource
}

/**
 * A "send address": the address you paste in the To: field to start a new
 * conversation from one of your Duck addresses.
 */
export interface ReverseAlias {
  recipient: string
  alias: string
  createdAt: number
  notes?: string
}

/** Shape of `GET /api/email/dashboard` (proxied through /api/dashboard). */
export interface DashboardResponse {
  user?: {
    username?: string
    email?: string
    cohort?: string
  }
  stats?: {
    addresses_generated?: number
  }
  invites?: string[]
}

export interface Account {
  access_token?: string
  /** Session token from the passphrase login; the only token `/email/dashboard` accepts. */
  session_token?: string
  cohort?: string
  remark?: string
  username?: string
  nextAlias?: string
  /** Forwarding address reported by the DuckDuckGo dashboard API. */
  email?: string
  /** `stats.addresses_generated` reported by the DuckDuckGo dashboard API. */
  addressesGenerated?: number
  createdAt?: number
  updatedAt?: number
  addresses?: StoredAddress[]
  reverseAliases?: ReverseAlias[]
}
