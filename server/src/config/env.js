// Validates environment configuration once, at boot. The server refuses to start with a missing,
// malformed, or dangerous configuration instead of failing later at request time.
import { z } from 'zod'

export class ConfigError extends Error {
  constructor(problems) {
    super(`Invalid server configuration:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
    this.name = 'ConfigError'
    this.problems = problems
  }
}

const httpUrl = z.url({ protocol: /^https?$/, message: 'must be an http(s) URL' })

const originList = z
  .string()
  .min(1, 'is required')
  .transform((value, ctx) => {
    const origins = []
    for (const raw of value.split(',').map((item) => item.trim()).filter(Boolean)) {
      try {
        const url = new URL(raw)
        if (!/^https?:$/.test(url.protocol)) throw new Error('bad protocol')
        origins.push(url.origin)
      } catch {
        ctx.addIssue({ code: 'custom', message: `"${raw}" is not a valid http(s) origin` })
      }
    }
    if (origins.length === 0) ctx.addIssue({ code: 'custom', message: 'must list at least one origin' })
    return origins
  })

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: originList,
  PUBLIC_APP_URL: httpUrl,
  SUPABASE_URL: httpUrl,
  SUPABASE_ANON_KEY: z.string().trim().min(20, 'must be the project anon / publishable key'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  // Time zone used to print the issue date on certificates (IANA name, e.g. Asia/Manila).
  CERTIFICATE_TIMEZONE: z
    .string()
    .default('UTC')
    .refine((zone) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone })
        return true
      } catch {
        return false
      }
    }, 'must be a valid IANA time zone such as Asia/Manila'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
})

const isLocalHost = (url) => ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].includes(new URL(url).hostname)

/** Reads the role claim of a legacy Supabase JWT key without trusting it (misconfiguration check only). */
function legacyKeyRole(key) {
  const [, payload] = key.split('.')
  if (!payload) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))?.role ?? null
  } catch {
    return null
  }
}

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env)
  if (!parsed.success) {
    throw new ConfigError(parsed.error.issues.map((issue) => `${issue.path.join('.') || 'env'} ${issue.message}`))
  }
  const values = parsed.data
  const problems = []

  // Never run the API with a privileged key: it would bypass every RLS policy.
  if (values.SUPABASE_ANON_KEY.startsWith('sb_secret_') || legacyKeyRole(values.SUPABASE_ANON_KEY) === 'service_role') {
    problems.push('SUPABASE_ANON_KEY is a secret/service-role key. Use the anon (publishable) key instead.')
  }

  if (values.NODE_ENV === 'production') {
    if (isLocalHost(values.PUBLIC_APP_URL) || !values.PUBLIC_APP_URL.startsWith('https://')) {
      problems.push('PUBLIC_APP_URL must be the public https URL of the site in production (it is printed on certificates).')
    }
    if (values.FRONTEND_URL.some((origin) => isLocalHost(origin))) {
      problems.push('FRONTEND_URL must not allow localhost origins in production.')
    }
  }
  if (problems.length) throw new ConfigError(problems)

  return Object.freeze({
    env: values.NODE_ENV,
    isProduction: values.NODE_ENV === 'production',
    port: values.PORT,
    corsOrigins: Object.freeze(values.FRONTEND_URL),
    publicAppUrl: values.PUBLIC_APP_URL.replace(/\/+$/, ''),
    supabaseUrl: values.SUPABASE_URL.replace(/\/+$/, ''),
    supabaseAnonKey: values.SUPABASE_ANON_KEY,
    trustProxy: values.TRUST_PROXY,
    certificateTimeZone: values.CERTIFICATE_TIMEZONE,
    logLevel: values.LOG_LEVEL ?? (values.NODE_ENV === 'test' ? 'silent' : 'info'),
  })
}
