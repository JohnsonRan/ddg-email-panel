import type { Account, ReverseAlias, StoredAddress } from '../types'

const ACCOUNTS_KEY = 'user'
const LAST_USER_KEY = 'lastuser'

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage

/** Accounts are stored client-side only; the server never sees them. */
export function getAccounts(): Account[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setAccounts(accounts: Account[]) {
  if (!canUseStorage()) return
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function getAccount(index: number): Account | null {
  const accounts = getAccounts()
  const account = accounts[index]
  return account || null
}

export function getLastUserId(): number {
  if (!canUseStorage()) return 0
  return Number(localStorage.getItem(LAST_USER_KEY) ?? 0)
}

export function setLastUserId(index: number) {
  if (!canUseStorage()) return
  localStorage.setItem(LAST_USER_KEY, String(index))
}

export function addAccount(account: Account): number {
  const accounts = getAccounts()
  // Re-adding an account we already know about should refresh it, not duplicate it.
  const existing = accounts.findIndex((item) => item.username === account.username)
  if (existing !== -1) {
    accounts[existing] = { ...accounts[existing], ...account, updatedAt: Date.now() }
    setAccounts(accounts)
    return existing
  }
  accounts.push({ createdAt: Date.now(), updatedAt: Date.now(), ...account })
  setAccounts(accounts)
  return accounts.length - 1
}

export function editAccount(index: number, patch: Partial<Account>): Account | null {
  const accounts = getAccounts()
  if (!accounts[index]) return null
  accounts[index] = { ...accounts[index], ...patch, updatedAt: Date.now() }
  setAccounts(accounts)
  return accounts[index]
}

export function removeAccount(index: number): Account | null {
  const accounts = getAccounts()
  if (!accounts[index]) return null
  const [removed] = accounts.splice(index, 1)
  setAccounts(accounts)
  if (getLastUserId() === index) setLastUserId(0)
  return removed
}

export function clear() {
  if (!canUseStorage()) return
  localStorage.clear()
}

/* ------------------------------- address vault ------------------------------ */

export function addAddress(
  index: number,
  value: string,
  source: StoredAddress['source'] = 'generate'
): StoredAddress | null {
  const account = getAccount(index)
  if (!account) return null
  const addresses = account.addresses ? [...account.addresses] : []
  const existing = addresses.findIndex((item) => item.value === value)
  if (existing !== -1) {
    addresses[existing] = { ...addresses[existing], updatedAt: Date.now() }
    editAccount(index, { addresses, nextAlias: value })
    return addresses[existing]
  }
  const address: StoredAddress = { value, createdAt: Date.now(), source, tags: [] }
  addresses.unshift(address)
  editAccount(index, { addresses, nextAlias: value })
  return address
}

export function editAddress(index: number, value: string, patch: Partial<StoredAddress>) {
  const account = getAccount(index)
  if (!account?.addresses) return
  const addresses = account.addresses.map((item) =>
    item.value === value ? { ...item, ...patch, updatedAt: Date.now() } : item
  )
  editAccount(index, { addresses })
}

export function removeAddress(index: number, value: string) {
  const account = getAccount(index)
  if (!account?.addresses) return
  editAccount(index, { addresses: account.addresses.filter((item) => item.value !== value) })
}

/** Merge imported aliases, skipping ones we already have. Returns how many were added. */
export function importAddresses(index: number, values: string[]): number {
  const account = getAccount(index)
  if (!account) return 0
  const addresses = account.addresses ? [...account.addresses] : []
  let added = 0
  for (const value of values) {
    if (addresses.some((item) => item.value === value)) continue
    addresses.push({ value, createdAt: Date.now(), source: 'import', tags: [] })
    added++
  }
  editAccount(index, { addresses })
  return added
}

/* ------------------------------- send addresses ----------------------------- */

export function addReverseAlias(index: number, recipient: string, alias: string): ReverseAlias | null {
  const account = getAccount(index)
  if (!account) return null
  const aliases = (account.reverseAliases || []).filter((item) => item.recipient !== recipient)
  const record: ReverseAlias = { recipient, alias, createdAt: Date.now() }
  aliases.unshift(record)
  editAccount(index, { reverseAliases: aliases })
  return record
}

export function editReverseAlias(index: number, recipient: string, notes: string) {
  const account = getAccount(index)
  if (!account?.reverseAliases) return
  editAccount(index, {
    reverseAliases: account.reverseAliases.map((item) =>
      item.recipient === recipient ? { ...item, notes } : item
    ),
  })
}

export function removeReverseAlias(index: number, recipient: string) {
  const account = getAccount(index)
  if (!account?.reverseAliases) return
  editAccount(index, {
    reverseAliases: account.reverseAliases.filter((item) => item.recipient !== recipient),
  })
}
