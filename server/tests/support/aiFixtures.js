// Fake AI provider responses for the AI Investigation Assistant tests. Only the network is faked: the real
// gateway, prompt builder, and output validation run against these OpenAI-compatible responses.
import { createApp } from '../../src/app.js'
import { AI_PROVIDER_DEFAULTS, loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { TEST_ENV } from './testApp.js'

export const OPENROUTER_URL = AI_PROVIDER_DEFAULTS.openrouter.url
export const GROQ_URL = AI_PROVIDER_DEFAULTS.groq.url

// Placeholder keys: they only have to reach the mocked fetch.
export const AI_ENV = { OPENROUTER_API_KEY: 'test-openrouter-key', GROQ_API_KEY: 'test-groq-key', AI_TIMEOUT_MS: '1000' }

/**
 * A light app without the database, for AI and link-reader checks that need their own configuration, fetch, or
 * logger. Any bearer token signs in as "user-<token>".
 */
export function createAiApp({ env = AI_ENV, fetch, logger = createLogger({ level: 'silent' }) } = {}) {
  return createApp({
    config: loadConfig({ ...TEST_ENV, ...env }),
    auth: { verifyToken: async (token) => ({ id: `user-${token}`, email: null }) },
    repositories: { forUser: () => ({}), public: () => ({}) },
    logger,
    options: { rateLimit: { enabled: false }, fetch },
  })
}

// Data URLs whose bytes start with the real file signatures (the API checks them). The rest is filler.
const imageDataUrl = (type, signature) => `data:${type};base64,${Buffer.from([...signature, ...Array(24).fill(7)]).toString('base64')}`
export const PNG_DATA_URL = imageDataUrl('image/png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
export const JPEG_DATA_URL = imageDataUrl('image/jpeg', [0xff, 0xd8, 0xff, 0xe0])
export const WEBP_DATA_URL = imageDataUrl('image/webp', [...Buffer.from('RIFF'), 0x24, 0, 0, 0, ...Buffer.from('WEBP')])

export const ARTICLE = [
  'SHOCKING: Doctors HATE this miracle drink that cures every disease overnight!!!',
  'A new report claims that drinking three cups of ginger tea a day cured 10,000 people in Bulacan last month.',
  'Everyone must share this before it gets deleted. The government is hiding the truth from you.',
  'Read more at https://healthy-news.example/ginger-miracle',
].join('\n')

export function validAnalysis(overrides = {}) {
  return {
    summary: {
      overview: 'The post says a ginger tea drink cures every disease and asks readers to share it.',
      mainMessage: 'Drinking ginger tea cures illness and the government is hiding it.',
    },
    claims: [
      {
        claim: 'Ginger tea cured 10,000 people in Bulacan last month.',
        type: 'fact',
        verifiable: true,
        explanation: 'Provincial health office records could confirm or contradict this number.',
      },
      {
        claim: 'The government is hiding the truth.',
        type: 'opinion',
        verifiable: false,
        explanation: 'This is an accusation without any evidence given.',
      },
    ],
    warningSigns: [
      {
        indicator: 'sensationalized_headline',
        evidence: 'SHOCKING: Doctors HATE this miracle drink',
        explanation: 'All-caps hype tries to grab attention instead of informing.',
      },
      {
        indicator: 'emotional_language',
        evidence: 'Everyone must share this before it gets deleted.',
        explanation: 'Urgency pressures readers to share before checking.',
      },
      { indicator: 'missing_author', evidence: null, explanation: 'No author is named, so their credibility cannot be checked.' },
    ],
    checklist: [
      { step: 'Find the original source', details: 'Look for the report the post mentions.' },
      { step: "Check the author's credibility", details: 'See who wrote it and whether they have health expertise.' },
      { step: 'Search for independent reports', details: 'Check whether established news organizations reported the same numbers.' },
    ],
    searchQueries: ['ginger tea cured 10,000 people Bulacan', 'ginger tea cures every disease'],
    assessment: { category: 'POTENTIAL_WARNING_SIGNS_FOUND', explanation: 'The post uses hype and urgency and names no author.' },
    ...overrides,
  }
}

export const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** A chat/completions response whose assistant message is `content` (objects are sent as JSON text). */
export const completion = (content) =>
  jsonResponse(200, {
    id: 'gen-test',
    choices: [
      { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: typeof content === 'string' ? content : JSON.stringify(content) } },
    ],
  })

/** A provider that never answers: the promise settles only when the gateway aborts it at its timeout. */
export const hangUntilAborted = (_url, init) =>
  new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('This operation was aborted', 'AbortError')), { once: true })
  })

/**
 * A fetch mock that sends each provider URL to its handler. Handlers return a Response or throw.
 * `calls()` returns every request with its parsed JSON body.
 */
export function createProviderMock() {
  let handlers = {}
  const requests = []
  async function fetch(url, init) {
    requests.push({ url, headers: init.headers, body: JSON.parse(init.body) })
    const handler = url === OPENROUTER_URL ? handlers.openrouter : url === GROQ_URL ? handlers.groq : null
    if (!handler) throw new Error(`unexpected AI provider call to ${url}`)
    return handler(url, init)
  }
  return {
    fetch,
    use(next) {
      handlers = next
      requests.length = 0
    },
    calls: () => [...requests],
  }
}
