import { supabase } from './supabase'

const BASE_URL = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '')
const DEFAULT_TIMEOUT_MS = 20000

/** Error from the VerifyIT API (or from failing to reach it). `message` is safe to show to users. */
export class ApiError extends Error {
  constructor({ status, code, message, details, requestId, cause }) {
    super(message, cause ? { cause } : undefined)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }

  /** Network failures, timeouts, rate limits, and server errors can succeed on retry. */
  get isRetryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500
  }

  get isNetworkError() {
    return this.status === 0
  }
}

const sessionExpiredListeners = new Set()

/** Called when the API rejects the current session, so the app can sign out locally. */
export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

const FALLBACK_MESSAGES = {
  400: 'Some of the information sent is invalid.',
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'This conflicts with something already saved.',
  413: 'That request is too large.',
  422: 'This request could not be completed.',
  429: 'Too many requests. Please wait a moment and try again.',
}

async function accessToken() {
  if (!supabase) return null
  // getSession() refreshes an expired access token using the stored refresh token.
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session?.access_token ?? null
}

function filenameFrom(response, fallback) {
  const header = response.headers.get('Content-Disposition') ?? ''
  return /filename="([^"]+)"/.exec(header)?.[1] ?? fallback
}

/**
 * Calls the VerifyIT API. Resolves with the `data` field of the JSON response
 * (or { blob, filename } when responseType is 'blob'). Rejects with ApiError.
 */
export async function apiRequest(path, { method = 'GET', body, auth = false, responseType = 'json', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const headers = { Accept: responseType === 'json' ? 'application/json' : 'application/pdf' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = await accessToken()
    if (!token) throw new ApiError({ status: 401, code: 'AUTH_REQUIRED', message: 'Please sign in to continue.' })
    headers.Authorization = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    throw new ApiError({
      status: 0,
      code: error?.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: offline
        ? 'You appear to be offline. Check your connection and try again.'
        : error?.name === 'AbortError'
          ? 'The VerifyIT server took too long to respond. Please try again.'
          : 'Could not reach the VerifyIT server. Please try again.',
      cause: error,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    } catch {
      payload = null // Not JSON (for example a proxy error page); fall back to a generic message.
    }
    // A gateway error without a VerifyIT error body means the API itself did not answer
    // (in development: the API server is not running behind the Vite proxy).
    const apiUnreachable = !payload?.error && [502, 503, 504].includes(response.status)
    const error = new ApiError({
      status: response.status,
      code: payload?.error?.code ?? (apiUnreachable ? 'API_UNREACHABLE' : `HTTP_${response.status}`),
      message:
        payload?.error?.message ??
        (apiUnreachable
          ? `The VerifyIT server is not responding. Please try again in a moment.${
              import.meta.env.DEV ? ' (Development: start the API with "npm run server:dev".)' : ''
            }`
          : null) ??
        FALLBACK_MESSAGES[response.status] ??
        'Something went wrong on the VerifyIT server. Please try again.',
      details: payload?.error?.details,
      requestId: payload?.error?.requestId ?? response.headers.get('X-Request-Id'),
    })
    if (auth && response.status === 401) sessionExpiredListeners.forEach((listener) => listener(error))
    throw error
  }

  if (responseType === 'blob') return { blob: await response.blob(), filename: filenameFrom(response, 'download.pdf') }
  try {
    return (await response.json()).data
  } catch (error) {
    throw new ApiError({ status: 502, code: 'INVALID_RESPONSE', message: 'The server sent an unexpected response. Please try again.', cause: error })
  }
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
}

/** A random id for idempotent submissions (lets retries and syncing never create duplicates). */
export function newClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // RFC 4122 v4 from getRandomValues for older browsers.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
