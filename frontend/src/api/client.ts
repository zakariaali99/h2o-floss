/**
 * Typed fetch wrapper. The backend emits one error envelope everywhere:
 *   { error, detail, fields }
 * so callers get a thrown ApiError carrying field-level messages for forms.
 */
import { config } from '../config'
import { tokenStore } from './token'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** Flatten to a single line for toasts. */
  get summary(): string {
    return this.message || 'حدث خطأ غير متوقع، حاول مرة أخرى.'
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown }

/** Callback the app can register to react to an unrecoverable auth loss (redirect to login). */
let onAuthLost: (() => void) | null = null
export function setOnAuthLost(fn: (() => void) | null) {
  onAuthLost = fn
}

/** Exchange the refresh token for a fresh access token. Returns it, or null on failure. */
async function tryRefresh(): Promise<string | null> {
  const refresh = tokenStore.getRefresh()
  if (!refresh) return null
  try {
    const res = await fetch(`${config.apiBase}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access?: string; refresh?: string }
    if (!data.access) return null
    tokenStore.set(data.access, data.refresh)
    return data.access
  } catch {
    return null
  }
}

async function doFetch(path: string, options: Options, accessToken: string | null): Promise<Response> {
  const { body, headers, ...rest } = options
  return fetch(`${config.apiBase}${path}`, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })
}

async function request<T>(path: string, options: Options = {}): Promise<T> {
  let access = tokenStore.getAccess()
  let response = await doFetch(path, options, access)

  // On 401 with a token present, try one silent refresh + retry before giving up.
  if (response.status === 401 && access) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      access = refreshed
      response = await doFetch(path, options, access)
    }
    if (response.status === 401) {
      tokenStore.clear()
      onAuthLost?.()
    }
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const data = (payload ?? {}) as { error?: string; detail?: string; fields?: Record<string, string[]> }
    throw new ApiError(
      response.status,
      data.error ?? 'error',
      data.detail ?? `فشل الطلب (${response.status})`,
      data.fields ?? {},
    )
  }
  return payload as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
