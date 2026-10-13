import type { ReverseAlias, StoredAddress } from '../types'
import * as store from './store'
import { normalizeAlias } from './sendAddress'

export interface VaultExport {
  type: 'ddg-email-panel-vault'
  version: 1
  exportedAt: string
  accounts: {
    username: string
    addresses: StoredAddress[]
    reverseAliases: ReverseAlias[]
  }[]
}

/** Everything the panel knows about, across all accounts. */
export function buildExport(): VaultExport {
  return {
    type: 'ddg-email-panel-vault',
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: store.getAccounts().map((account) => ({
      username: account.username ?? '',
      addresses: account.addresses ?? [],
      reverseAliases: account.reverseAliases ?? [],
    })),
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export interface ImportBlock {
  addresses: string[]
  reverseAliases: { recipient: string; alias: string }[]
}

export interface ParsedImport {
  /** Keyed by `@duck.com` username. Empty key means "unknown, use current account". */
  byAccount: Record<string, ImportBlock>
  invalid: number
}

function collectAddresses(value: unknown, block: ImportBlock, state: { invalid: number }) {
  if (typeof value === 'string') {
    const alias = normalizeAlias(value)
    if (alias) block.addresses.push(alias)
    else state.invalid++
    return
  }
  if (value && typeof value === 'object') {
    const record = value as { value?: unknown; address?: unknown; alias?: unknown }
    const raw = record.value ?? record.address ?? record.alias
    const alias = normalizeAlias(raw)
    if (alias) block.addresses.push(alias)
    else state.invalid++
  }
}

function collectReverse(value: unknown, block: ImportBlock) {
  if (!value || typeof value !== 'object') return
  const record = value as { recipient?: unknown; recipientEmail?: unknown; alias?: unknown }
  const recipient = String(record.recipient ?? record.recipientEmail ?? '')
  const alias = String(record.alias ?? '')
  if (recipient && alias) block.reverseAliases.push({ recipient, alias })
}

/**
 * Accepts a full panel backup, a Qwacky style backup, a bare array of aliases
 * or a plain text list (newlines / commas / semicolons).
 */
export function parseImport(text: string): ParsedImport {
  const result: ParsedImport = { byAccount: { '': { addresses: [], reverseAliases: [] } }, invalid: 0 }
  const state = { invalid: 0 }
  const trimmed = text.trim()
  if (!trimmed) return { byAccount: {}, invalid: 0 }

  const applyObject = (data: Record<string, unknown>) => {
    if (Array.isArray(data.accounts)) {
      for (const entry of data.accounts as Record<string, unknown>[]) {
        if (!entry || typeof entry !== 'object') continue
        const username = String(entry.username ?? entry.account ?? '').replace(/@duck\.com$/, '')
        const block = result.byAccount[username] ?? { addresses: [], reverseAliases: [] }
        if (Array.isArray(entry.addresses)) entry.addresses.forEach((item) => collectAddresses(item, block, state))
        if (Array.isArray(entry.reverseAliases)) entry.reverseAliases.forEach((item) => collectReverse(item, block))
        result.byAccount[username] = block
      }
      return
    }
    if (Array.isArray(data.addresses)) {
      data.addresses.forEach((item) => collectAddresses(item, result.byAccount[''], state))
    }
    if (Array.isArray(data.reverseAliases)) {
      data.reverseAliases.forEach((item) => collectReverse(item, result.byAccount['']))
    }
  }

  try {
    const data = JSON.parse(trimmed)
    if (Array.isArray(data)) {
      data.forEach((item) => collectAddresses(item, result.byAccount[''], state))
    } else if (data && typeof data === 'object') {
      applyObject(data as Record<string, unknown>)
    }
  } catch {
    for (const line of trimmed.split(/[\r\n,;]+/)) {
      const alias = normalizeAlias(line)
      if (alias) result.byAccount[''].addresses.push(alias)
      else if (line.trim()) state.invalid++
    }
  }

  result.invalid = state.invalid
  // Drop empty buckets.
  for (const key of Object.keys(result.byAccount)) {
    const block = result.byAccount[key]
    if (block.addresses.length === 0 && block.reverseAliases.length === 0) delete result.byAccount[key]
  }
  return result
}

/** Merge a parsed import into the stored accounts. Returns a short summary. */
export function applyImport(parsed: ParsedImport, currentIndex: number) {
  const accounts = store.getAccounts()
  let added = 0
  for (const [username, block] of Object.entries(parsed.byAccount)) {
    const index = username
      ? accounts.findIndex((account) => account.username === username)
      : currentIndex
    if (index === -1) continue
    added += store.importAddresses(index, block.addresses)
    for (const item of block.reverseAliases) store.addReverseAlias(index, item.recipient, item.alias)
  }
  return added
}
