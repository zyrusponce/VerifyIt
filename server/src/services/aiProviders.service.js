/*
  ⚡ LAYER: Service (AI provider gateway: OpenRouter first, Groq once as the fallback)
  🔒 SECURITY: API keys come only from server configuration and are sent only in the Authorization header
     to the configured provider URL; they never reach responses. Failures are logged with the provider,
     HTTP status, and failure kind only: never the prompt, the submitted content, the API key, or provider
     response bodies (an error body can echo the input).
  🚨 ERROR HANDLING: Each provider gets exactly one attempt with its own timeout (no retry loops). Rate
     limits, timeouts, network errors, 4xx/5xx responses, and unusable output all move on to the next
     provider. No provider configured → 503 AI_NOT_CONFIGURED; every provider failed → 503 AI_UNAVAILABLE.
*/
import { serviceUnavailable } from '../utils/AppError.js'

// Shared OpenAI-compatible generation settings. A low temperature keeps the analysis factual and the JSON stable.
const GENERATION = { temperature: 0.2, max_tokens: 2500, response_format: { type: 'json_object' } }
const MAX_RESPONSE_CHARS = 200_000

/**
 * One failed provider attempt. `kind`: rate_limited | timeout | network | server_error | http_error | invalid_response.
 * `reason` is a fixed internal description, never provider or user text.
 */
export class ProviderFailure extends Error {
  constructor(kind, { status = null, reason = kind } = {}) {
    super(reason)
    this.name = 'ProviderFailure'
    this.kind = kind
    this.status = status
  }
}

/** Thrown by an output parser when a completion is not a usable result, so the next provider is tried. */
export const invalidResponse = (reason) => new ProviderFailure('invalid_response', { reason })

function statusKind(status) {
  if (status === 429) return 'rate_limited'
  if (status === 408) return 'timeout'
  if (status >= 500) return 'server_error'
  return 'http_error'
}

/** Headers and body fields that only one provider (or model) understands. */
function providerExtras(provider, model, config) {
  if (provider.name === 'openrouter') {
    // Optional attribution headers recommended by OpenRouter.
    return { headers: { 'HTTP-Referer': config.publicAppUrl, 'X-Title': 'VerifyIT' }, body: {} }
  }
  if (provider.name === 'groq' && model.startsWith('openai/gpt-oss')) {
    // gpt-oss is a reasoning model: low effort answers faster and leaves the token budget for the JSON.
    return { headers: {}, body: { reasoning_effort: 'low' } }
  }
  return { headers: {}, body: {} }
}

/** Extracts the assistant text from an OpenAI-compatible chat/completions response body. */
function completionContent(text, status) {
  if (text.length > MAX_RESPONSE_CHARS) throw invalidResponse('response body too large')
  let body
  try {
    body = JSON.parse(text)
  } catch {
    throw invalidResponse('response body is not JSON')
  }
  if (body?.error && !Array.isArray(body?.choices)) {
    // OpenRouter can report an upstream failure inside a 200 response.
    const code = Number(body.error.code)
    const kind = Number.isInteger(code) && code >= 400 ? statusKind(code) : 'invalid_response'
    throw new ProviderFailure(kind, { status, reason: 'error object in response body' })
  }
  let content = body?.choices?.[0]?.message?.content
  if (Array.isArray(content)) {
    content = content.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('')
  }
  if (typeof content !== 'string' || !content.trim()) throw invalidResponse('completion has no content')
  return content
}

/**
 * @param {object} deps
 * @param {ReturnType<import('../config/env.js').loadConfig>} deps.config
 * @param {ReturnType<import('../utils/logger.js').createLogger>} deps.logger
 * @param {typeof fetch} [deps.fetch] injectable for tests; defaults to the runtime's fetch
 */
export function createAiGateway({ config, logger, fetch: fetchImpl }) {
  // Called through globalThis: Cloudflare Workers throws "Illegal invocation" for a detached fetch.
  const send = fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
  const { providers, timeoutMs } = config.ai

  async function attempt(provider, model, messages) {
    const extras = providerExtras(provider, model, config)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      let response
      try {
        response = await send(provider.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...extras.headers,
          },
          body: JSON.stringify({ model, messages, ...GENERATION, ...extras.body }),
          signal: controller.signal,
        })
      } catch (error) {
        throw new ProviderFailure(controller.signal.aborted ? 'timeout' : 'network', { reason: `request failed (${error?.name})` })
      }

      // The timer still runs while the body downloads, so a stalled stream also times out.
      let text
      try {
        text = await response.text()
      } catch (error) {
        throw new ProviderFailure(controller.signal.aborted ? 'timeout' : 'network', {
          status: response.status,
          reason: `response body unreadable (${error?.name})`,
        })
      }
      if (!response.ok) throw new ProviderFailure(statusKind(response.status), { status: response.status, reason: 'HTTP error status' })
      return { status: response.status, content: completionContent(text, response.status) }
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    /**
     * Sends the chat messages to each configured provider in order until one returns output that `parse`
     * accepts. `parse` receives the raw completion text and throws (ideally `invalidResponse`) to reject it.
     * `vision: true` (the messages carry images) uses each provider's image-reading model.
     */
    async complete({ messages, parse, requestId, vision = false }) {
      if (providers.length === 0) {
        throw serviceUnavailable('AI_NOT_CONFIGURED', 'The AI assistant is not set up yet. Please try again later.', {
          cause: { context: 'no AI provider has an API key (OPENROUTER_API_KEY / GROQ_API_KEY)' },
        })
      }

      const failures = []
      for (const [index, provider] of providers.entries()) {
        const model = vision ? (provider.visionModel ?? provider.model) : provider.model
        const started = Date.now()
        try {
          const { content } = await attempt(provider, model, messages)
          let result
          try {
            result = parse(content)
          } catch (error) {
            throw error instanceof ProviderFailure ? error : invalidResponse(`output rejected (${error?.name})`)
          }
          if (failures.length) {
            logger.info('AI fallback provider succeeded', { requestId, provider: provider.name, model, failedProviders: failures.length })
          }
          return { result, provider: provider.name, model }
        } catch (error) {
          const failure = error instanceof ProviderFailure ? error : invalidResponse(`unexpected error (${error?.name})`)
          failures.push({ provider: provider.name, kind: failure.kind, status: failure.status })
          logger.warn('AI provider attempt failed', {
            requestId,
            provider: provider.name,
            model,
            kind: failure.kind,
            status: failure.status,
            reason: failure.message,
            durationMs: Date.now() - started,
            willFallBack: index < providers.length - 1,
          })
        }
      }

      throw serviceUnavailable(
        'AI_UNAVAILABLE',
        'The AI assistant is busy or unavailable right now. Please try again in a few minutes.',
        { cause: { context: 'every AI provider failed', failures } },
      )
    },
  }
}
