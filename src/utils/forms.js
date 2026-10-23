// Client-side checks for instant feedback only. The server and Supabase validate everything again.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return 'Enter your email address.'
  if (!EMAIL.test(email)) return 'Enter a valid email address, like name@example.com.'
  return null
}

export function validateNewPassword(value) {
  if (value.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use both letters and numbers.'
  return null
}

export function normalizeName(value) {
  return value.replace(/\s+/g, ' ').trim()
}

export function validateDisplayName(value, { required = false } = {}) {
  const name = normalizeName(value)
  if (!name) return required ? 'Enter your name.' : null
  if (name.length < 2) return 'Use at least 2 characters.'
  if (name.length > 80) return 'Use at most 80 characters.'
  if (/[\p{Cc}\p{Cf}]/u.test(name)) return 'Remove hidden or control characters.'
  return null
}

/** Only allows redirects to pages on this site (prevents open redirects through ?next=). */
export function safeNextPath(value, fallback = '/account') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
