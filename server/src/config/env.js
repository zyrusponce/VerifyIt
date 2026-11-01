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

// The AI Investigation Assistant is optional: a blank value counts as unset, so an empty line in .env or
// an unset Worker secret only disables that provider instead of stopping the server.
const blankAsUnset = (inner) => z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), inner)
const NO_SPACES = /^[\x21-\x7e]+$/
const aiApiKey = blankAsUnset(z.string().trim().max(512).regex(NO_SPACES, 'must be the API key only, without spaces').optional())
const modelId = z.string().trim().max(200).regex(NO_SPACES, 'must be a model id such as vendor/model')
const aiModel = (fallback) => blankAsUnset(modelId.default(fallback))

export const AI_PROVIDER_DEFAULTS = Object.freeze({
  // visionModel reads attached images. Gemma reads text and images; Groq's gpt-oss reads text only, so Groq uses Qwen for images.
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemma-4-31b-it:free' },
  groq: { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'openai/gpt-oss-120b', visionModel: 'qwen/qwen3.8-27b' },
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
  // AI Investigation Assistant: OpenRouter is tried first, Groq once as the fallback.
  OPENROUTER_API_KEY: aiApiKey,
  OPENROUTER_MODEL: aiModel(AI_PROVIDER_DEFAULTS.openrouter.model),
  // Unset: OPENROUTER_MODEL also reads images.
  OPENROUTER_VISION_MODEL: blankAsUnset(modelId.optional()),
  GROQ_API_KEY: aiApiKey,
  GROQ_MODEL: aiModel(AI_PROVIDER_DEFAULTS.groq.model),
  GROQ_VISION_MODEL: aiModel(AI_PROVIDER_DEFAULTS.groq.visionModel),
  // Per provider attempt. Two attempts must fit inside the frontend's 70 s request timeout.
  AI_TIMEOUT_MS: blankAsUnset(z.coerce.number().int().min(1000).max(30_000).default(25_000)),
  // Optional: Google Fact Check Tools API key for the "What Other Sources Say" check. Unset turns that check off.
  GOOGLE_FACT_CHECK_API_KEY: aiApiKey,
  // Optional: Tavily API key for finding other news reports of the same story. Unset turns the news search off.
  TAVILY_API_KEY: aiApiKey,
})

/** Providers that have an API key, in the order they are tried. */
function aiProviders(values) {
  const providers = [
    {
      name: 'openrouter',
      ...AI_PROVIDER_DEFAULTS.openrouter,
      model: values.OPENROUTER_MODEL,
      visionModel: values.OPENROUTER_VISION_MODEL ?? values.OPENROUTER_MODEL,
      apiKey: values.OPENROUTER_API_KEY,
    },
    { name: 'groq', ...AI_PROVIDER_DEFAULTS.groq, model: values.GROQ_MODEL, visionModel: values.GROQ_VISION_MODEL, apiKey: values.GROQ_API_KEY },
  ]
  return Object.freeze(providers.filter((provider) => provider.apiKey).map((provider) => Object.freeze(provider)))
}

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
    // `apiKey` matches the logger's secret pattern, so a provider object is redacted if it is ever logged.
    ai: Object.freeze({ timeoutMs: values.AI_TIMEOUT_MS, providers: aiProviders(values) }),
    // `apiKey` matches the logger's secret pattern too.
    factCheck: Object.freeze({ apiKey: values.GOOGLE_FACT_CHECK_API_KEY ?? null }),
    newsSearch: Object.freeze({ apiKey: values.TAVILY_API_KEY ?? null }),
  })
}
