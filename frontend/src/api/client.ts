/**
 * Typed fetch wrapper. The backend emits one error envelope everywhere:
 *   { error, detail, fields }
 * so callers get a thrown ApiError carrying field-level messages for forms.
 */
import { config } from '../config'

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

async function request<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const response = await fetch(`${config.apiBase}${path}`, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })

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
