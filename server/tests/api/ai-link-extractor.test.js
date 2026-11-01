import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { AI_CONTENT_MAX_LENGTH } from '../../src/services/aiAnalysis.service.js'
import { loadConfig } from '../../src/config/env.js'
import { EXTRACT_URL, articleFromDump, createLinkReader } from '../../src/services/linkReader.service.js'
import { createLogger } from '../../src/utils/logger.js'
import { API } from '../support/fixtures.js'
import { TEST_ENV } from '../support/testApp.js'
import { AI_ENV, createAiApp, hangUntilAborted, jsonResponse } from '../support/aiFixtures.js'

const EXTRACT = `${API}/ai/extract-link`
const DOH = 'https://cloudflare-dns.com/dns-query'
const KEY = 'tvly-test-extract-key'
const LINK = 'https://www.blocksbots.example.net/news/rice-prices?token=secret123'

const ARTICLE = [
  'The Department of Agriculture said on Friday that rice import rules will change next month, according to a statement.',
  'Farmers’ groups said the change could lower prices, but traders were not sure how soon shoppers would notice it.',
  'A final decision is expected after a meeting of the council next week, officials told reporters on Saturday.',
].join('\n\n')

// What a text dump of a whole page looks like: menus, headline lists, a consent notice, then the article.
const PAGE_DUMP = [
  'Enable accessibility',
  'Menu',
  'World',
  'Undas 2026 in Manila: Grave finders, visiting hours, traffic advisories and what to bring this year',
  'Over 1,400 Albay folk still in evacuation centers after the Mayon eruption this week',
  'To provide you with a better experience, our site uses cookies and tracking technologies to collect information about your device.',
  'We may disclose this information to third parties to support advertising, as described in our Privacy Policy.',
  '',
  'Rice prices and the new import rules',
  ARTICLE,
  '',
  'MOST READ',
  'Lone player bags the Lotto jackpot on Saturday night',
  'Subscribe',
].join('\n')

/** Pages come from `page(url)`, the extraction service from `extractor(body, init)`; every call is recorded. */
function createMock() {
  let handlers = {}
  const calls = []
  async function fetch(url, init = {}) {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : null })
    if (url.startsWith(DOH)) {
      const v6 = new URL(url).searchParams.get('type') === 'AAAA'
      return jsonResponse(200, { Status: 0, Answer: v6 ? [] : [{ type: 1, data: '93.184.216.34' }] })
    }
    if (url === EXTRACT_URL) return handlers.extractor(JSON.parse(init.body), init)
    return handlers.page(url, init)
  }
  return {
    fetch,
    use(next) {
      handlers = { page: () => new Response('', { status: 403 }), extractor: () => jsonResponse(200, { results: [], failed_results: [] }), ...next }
      calls.length = 0
    },
    extractorCalls: () => calls.filter((call) => call.url === EXTRACT_URL),
    pageCalls: () => calls.filter((call) => call.url !== EXTRACT_URL && !call.url.startsWith(DOH)),
  }
}

const mock = createMock()
const withKey = createAiApp({ env: { ...AI_ENV, TAVILY_API_KEY: KEY }, fetch: mock.fetch })
const withoutKey = createAiApp({ env: AI_ENV, fetch: mock.fetch })
const read = (app, url = LINK) => request(app).post(EXTRACT).set('Authorization', 'Bearer student-1').send({ url })
const extracted = (rawContent, title = 'Rice prices and the new import rules | Blocksbots Daily') =>
  jsonResponse(200, { results: [{ url: LINK, title, raw_content: rawContent, images: [] }], failed_results: [] })

beforeEach(() => {
  mock.use({})
})

describe('reading a page that turns the reader away', () => {
  it('falls back to the extraction service and finds the article in the page dump', async () => {
    mock.use({ extractor: () => extracted(PAGE_DUMP) })
    const res = await read(withKey).expect(200)

    const [call] = mock.extractorCalls()
    expect(call.init.headers.Authorization).toBe(`Bearer ${KEY}`)
    expect(call.body).toEqual({ urls: [LINK], extract_depth: 'basic', format: 'text' })
    expect(mock.pageCalls()).toHaveLength(1)

    const { data } = res.body
    expect(data).toMatchObject({
      url: LINK,
      host: 'www.blocksbots.example.net',
      title: 'Rice prices and the new import rules | Blocksbots Daily',
      siteName: null,
      author: null,
      published: null,
      truncated: false,
      via: 'extractor',
    })
    expect(data.text).toBe(`Title: Rice prices and the new import rules | Blocksbots Daily\n\n${ARTICLE.replace(/\n\n/g, '\n')}`)
    expect(data.text).not.toMatch(/cookies|Undas|MOST READ|Subscribe|Menu/)
  })

  it.each([
    [401, 'LINK_FETCH_FAILED'],
    [403, 'LINK_FETCH_FAILED'],
    [429, 'LINK_FETCH_FAILED'],
    [451, 'LINK_FETCH_FAILED'],
    [503, 'LINK_FETCH_FAILED'],
  ])('tries the extraction service after a %i', async (code) => {
    mock.use({ page: () => new Response('', { status: code }), extractor: () => extracted(PAGE_DUMP) })
    const res = await read(withKey).expect(200)
    expect(res.body.data.via).toBe('extractor')
  })

  it('tries it when the page has no readable text', async () => {
    mock.use({ page: () => new Response('<html><body><p>Please enable JavaScript.</p></body></html>', { status: 200, headers: { 'Content-Type': 'text/html' } }), extractor: () => extracted(PAGE_DUMP) })
    expect((await read(withKey).expect(200)).body.data.via).toBe('extractor')
  })

  it('tries it when the page takes too long, and still reports the timeout if the service cannot help', async () => {
    const reader = createLinkReader({ config: loadConfig({ ...TEST_ENV, ...AI_ENV, TAVILY_API_KEY: KEY }), logger: createLogger({ level: 'silent' }), fetch: mock.fetch, timeoutMs: 50 })
    mock.use({ page: hangUntilAborted, extractor: () => extracted(PAGE_DUMP) })
    await expect(reader.read(LINK)).resolves.toMatchObject({ via: 'extractor' })
    mock.use({ page: hangUntilAborted, extractor: () => jsonResponse(500, {}) })
    await expect(reader.read(LINK)).rejects.toMatchObject({ code: 'LINK_TIMEOUT' })
  })

  it('does not use it when the page is read normally', async () => {
    mock.use({ page: () => new Response(`<html><body><article><p>${ARTICLE.replace(/\n\n/g, '</p><p>')}</p></article></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } }) })
    const res = await read(withKey).expect(200)
    expect(res.body.data.via).toBe('direct')
    expect(mock.extractorCalls()).toEqual([])
  })

  it.each([
    ['a missing page', () => new Response('', { status: 404 })],
    ['a removed page', () => new Response('', { status: 410 })],
    ['a PDF', () => new Response('%PDF', { status: 200, headers: { 'Content-Type': 'application/pdf' } })],
  ])('does not use it for %s', async (_name, page) => {
    mock.use({ page, extractor: () => extracted(PAGE_DUMP) })
    await read(withKey).expect((res) => expect(res.status).toBeGreaterThanOrEqual(422))
    expect(mock.extractorCalls()).toEqual([])
  })

  it('does not use it for social media links, links that are not allowed, or without a key', async () => {
    mock.use({ extractor: () => extracted(PAGE_DUMP) })
    await read(withKey, 'https://www.facebook.com/GMANews/posts/1').expect(422)
    await read(withKey, 'http://localhost:8080/admin').expect(422)
    await read(withKey, 'https://10.0.0.5/secret').expect(422)
    await read(withoutKey).expect(502)
    expect(mock.extractorCalls()).toEqual([])
  })

  it('keeps the original refusal when the service cannot help', async () => {
    for (const extractor of [
      () => jsonResponse(500, {}),
      () => jsonResponse(401, { detail: 'Unauthorized' }),
      () => jsonResponse(200, { results: [], failed_results: [{ url: LINK, error: 'blocked' }] }),
      () => extracted('Menu\nWorld\nSports\nShort line'),
      () => Promise.reject(new TypeError('fetch failed')),
    ]) {
      mock.use({ extractor })
      const res = await read(withKey).expect(502)
      expect(res.body.error).toMatchObject({ code: 'LINK_FETCH_FAILED', message: expect.stringMatching(/refused to share this page/) })
    }
  })

  it('cuts a long article to the input limit and says so', async () => {
    const long = Array.from({ length: 80 }, (_, i) => `Paragraph ${i + 1} of a long report that goes on and on about the very same subject in plain words.`).join('\n\n')
    mock.use({ extractor: () => extracted(long) })
    const { data } = (await read(withKey).expect(200)).body
    expect(data.text.length).toBeLessThanOrEqual(AI_CONTENT_MAX_LENGTH)
    expect(data.truncated).toBe(true)
  })

  it('never logs the key, the path or the query of the link', async () => {
    const lines = []
    const logged = createAiApp({ env: { ...AI_ENV, TAVILY_API_KEY: KEY }, fetch: mock.fetch, logger: createLogger({ level: 'debug', write: (_level, line) => lines.push(line) }) })
    mock.use({ extractor: () => Promise.reject(new TypeError(`fetch failed for ${LINK} with ${KEY}`)) })
    await read(logged).expect(502)
    const text = lines.join('\n')
    expect(text).toContain('link extraction failed')
    expect(text).not.toContain(KEY)
    expect(text).not.toContain('secret123')
    expect(text).not.toContain('rice-prices')
  })
})

describe('finding the article in a page dump', () => {
  it('returns nothing for a page without sentences', () => {
    expect(articleFromDump('Menu\nWorld\nSports\nUndas 2026 in Manila: Grave finders, visiting hours, traffic advisories and what to bring')).toBe('')
    expect(articleFromDump('')).toBe('')
    expect(articleFromDump(undefined)).toBe('')
  })

  it('ignores consent notices even when they are long', () => {
    const notice = 'This site uses cookies and tracking technologies to collect information that may relate to your device and preferences.'
    expect(articleFromDump(`${notice}\n${notice}\n${notice}\n\n${ARTICLE}`)).toBe(ARTICLE.replace(/\n\n/g, '\n'))
  })

  it('keeps short sub-headings inside the article but stops at a long gap', () => {
    const dump = [ARTICLE.split('\n\n')[0], 'What changes', ARTICLE.split('\n\n')[1], '', 'a', 'b', 'c', 'd', 'e', 'Another long sentence far below that does not belong to the main article text at all.'].join('\n')
    const text = articleFromDump(dump)
    expect(text).toContain('What changes')
    expect(text).not.toContain('Another long sentence')
  })

  it('picks the longest run when there are several', () => {
    const small = 'A short block of text that is still a sentence and ends properly.'
    expect(articleFromDump(`${small}\n\nMenu\nA\nB\nC\nD\nE\n\n${ARTICLE}`)).toContain('Department of Agriculture')
  })
})
