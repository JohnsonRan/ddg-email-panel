import type { DashboardResponse } from '../types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** JSON fetch against our own API routes; throws ApiError with the server message. */
export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!response.ok) {
    let message = response.statusText || `HTTP ${response.status}`
    try {
      const body = (await response.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(response.status, message)
  }

  return (await response.json()) as T
}

export const requestLoginLink = (username: string) =>
  api<{ message: string }>('/api/auth/loginlink', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })

export const loginWithPassphrase = (username: string, otp: string) =>
  api<{
    user: { access_token: string; cohort: string; email: string; username: string }
  }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, otp }) })

export const generateAddress = (token: string) =>
  api<{ address: string }>('/api/generateaddresses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: '{}',
  })

export const fetchDashboard = (token: string) =>
  api<DashboardResponse>('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })

/** Human readable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.status === 401 ? 'Unauthorized' : `${error.status} - ${error.message}`
  }
  if (error instanceof Error) return error.message
  return 'Unknown error'
}
