import type { DashboardResponse } from '../types'
import { DUCKDUCKGO_API_ENDPOINT, DUCKDUCKGO_API_USERAGENT } from './constants'

const endpoint = DUCKDUCKGO_API_ENDPOINT
const baseHeaders = { 'User-Agent': DUCKDUCKGO_API_USERAGENT }

export type { DashboardResponse }

export async function loginRequest(username: string) {
  return fetch(`${endpoint}/auth/loginlink?user=${encodeURIComponent(username)}`, {
    headers: baseHeaders,
  })
}

export async function login(username: string, otp: string) {
  // DuckDuckGo expects the passphrase's spaces as `+` in the query string.
  const passphrase = otp.trim().replace(/\s/g, '+')
  return fetch(`${endpoint}/auth/login?otp=${passphrase}&user=${encodeURIComponent(username)}`, {
    headers: baseHeaders,
  })
}

export async function getDashboard(token: string) {
  return fetch(`${endpoint}/email/dashboard`, {
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
  })
}

/** Kept for the token login flow: the dashboard is the access-token check. */
export const getAccessToken = getDashboard

export async function generateAddresses(token: string) {
  return fetch(`${endpoint}/email/addresses`, {
    method: 'POST',
    headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
  })
}
