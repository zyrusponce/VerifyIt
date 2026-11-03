import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { loadConfig } from '../../src/config/env.js'
import { AI_CONTENT_MAX_LENGTH } from '../../src/services/aiAnalysis.service.js'
import { LINK_MAX_BYTES, createLinkReader } from '../../src/services/linkReader.service.js'
import { createLogger } from '../../src/utils/logger.js'
import { API } from '../support/fixtures.js'
import { TEST_ENV } from '../support/testApp.js'
import { AI_ENV, createAiApp, hangUntilAborted, jsonResponse } from '../support/aiFixtures.js'

const EXTRACT = `${API}/ai/extract-link`
const DOH = 'https://cloudflare-dns.com/dns-query'

/**
 * A fake internet: DNS-over-HTTPS answers come from `dns` (host → addresses, or a handler), pages from `pages`
 * (full URL → handler). Any other request fails the test.
 */
function createWebMock() {
  let dns = {}
  let pages = {}
  const calls = []
  async function fetch(url, init = {}) {
    calls.push({ url, init })
    if (url.startsWith(DOH)) {
      const params = new URL(url).searchParams
      const entry = dns[params.get('name')]
      if (typeof entry === 'function') return entry(params.get('type'))
      if (!entry) return jsonResponse(200, { Status: 3 })
      const v6 = params.get('type') === 'AAAA'
      const answers = entry.filter((ip) => ip.includes(':') === v6).map((data) => ({ type: v6 ? 28 : 1, data }))
      return jsonResponse(200, { Status: 0, Answer: [{ type: 5, data: 'edge.cdn.example.' }, ...answers] })
    }
    const handler = pages[url]
    if (!handler) throw new Error(`unexpected request to ${url}`)
    return handler(url, init)
  }
  return {
    fetch,
    use(next) {
      dns = next.dns ?? {}
      pages = next.pages ?? {}
      calls.length = 0
    },
    pageCalls: () => calls.filter((call) => !call.url.startsWith(DOH)),
    dnsCalls: () => calls.filter((call) => call.url.startsWith(DOH)).map((call) => new URL(call.url).searchParams.get('name')),
    allCalls: () => [...calls],
  }
}

const html = (body, headers = {}) => () => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', ...headers } })
const status = (code, headers = {}) => () => new Response('', { status: code, headers })

const ARTICLE_HTML = `<!doctype html>
<html><head>
  <title>Fallback title</title>
  <meta property="og:title" content="Rice prices &amp; the new import rules">
  <meta property="og:site_name" content="Bulacan Daily">
  <meta name="author" content="Maria Santos">
  <meta property="article:published_time" content="2026-03-14T08:00:00+08:00">
  <style>.secret-style { color: red }</style>
  <script>var trackingSecret = 'do not show';</script>
</head><body>
  <nav><a href="/">Home</a> <a href="/news">News menu item</a></nav>
  <article>
    <h1>Rice prices &amp; the new import rules</h1>
    <p>The Department of Agriculture said on Friday that rice import rules will change next month, according to a statement.</p>
    <p>Farmers&#8217; groups said the change could lower prices &mdash; but traders were not sure.</p>
    <!-- an HTML comment that should disappear -->
    <ul><li>First point</li><li>Second point</li></ul>
    <aside>Related: Ten other stories you may like</aside>
    <form><button>Subscribe</button></form>
  </article>
  <footer>Copyright 2026 Bulacan Daily</footer>
</body></html>`

const web = createWebMock()
const app = createAiApp({ fetch: web.fetch })
const extract = (body, token = 'student-1') => request(app).post(EXTRACT).set('Authorization', `Bearer ${token}`).send(body)

beforeEach(() => {
  web.use({})
})

describe('reading a link', () => {
  it('returns the article text with its title, site, author, and date', async () => {
    web.use({ dns: { 'news.example.org': ['93.184.216.34', '2606:2800:220:1::248'] }, pages: { 'https://news.example.org/rice': html(ARTICLE_HTML) } })
    const res = await extract({ url: 'https://news.example.org/rice' }).expect(200)

    expect(res.headers['cache-control']).toBe('no-store')
    const data = res.body.data
    expect(data).toMatchObject({
      url: 'https://news.example.org/rice',
      host: 'news.example.org',
      title: 'Rice prices & the new import rules',
      siteName: 'Bulacan Daily',
      author: 'Maria Santos',
      published: 'March 14, 2026',
      truncated: false,
    })
    expect(data.text).toBe(
      [
        'Title: Rice prices & the new import rules',
        'Website: Bulacan Daily',
        'Author: Maria Santos',
        'Published: March 14, 2026',
        '',
        'Rice prices & the new import rules',
        'The Department of Agriculture said on Friday that rice import rules will change next month, according to a statement.',
        'Farmers’ groups said the change could lower prices — but traders were not sure.',
        '• First point',
        '• Second point',
      ].join('\n'),
    )
    for (const hidden of ['trackingSecret', 'secret-style', 'News menu item', 'Related:', 'Subscribe', 'Copyright', 'HTML comment']) {
      expect(data.text).not.toContain(hidden)
    }

    expect(web.dnsCalls()).toEqual(['news.example.org', 'news.example.org'])
    const [page] = web.pageCalls()
    expect(page.init).toMatchObject({ method: 'GET', redirect: 'manual' })
    expect(page.init.headers['User-Agent']).toBe('Mozilla/5.0 (compatible; VerifyIT-LinkReader/1.0; +https://verifyit.test)')
  })

  it('reads the author and date from JSON-LD when the meta tags have none', async () => {
    const page = `<html><head><title>Plain title</title>
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"Site"},
      {"@type":"NewsArticle","headline":"JSON headline","author":[{"@type":"Person","name":"Juan Cruz"},{"name":"Ana Reyes"}],"datePublished":"2025-12-01"}]}</script>
      </head><body><main><p>${'A sentence about the news that is long enough to count as article text. '.repeat(4)}</p></main></body></html>`
    web.use({ dns: { 'blog.example.net': ['151.101.1.69'] }, pages: { 'https://blog.example.net/post': html(page) } })
    const { body } = await extract({ url: 'https://blog.example.net/post' }).expect(200)
    expect(body.data).toMatchObject({ title: 'JSON headline', author: 'Juan Cruz, Ana Reyes', published: 'December 1, 2025', siteName: null })
  })

  it('cuts long pages to the analysis limit at a word boundary', async () => {
    const paragraph = `<p>${'Lorem ipsum dolor sit amet consectetur. '.repeat(40)}</p>`
    web.use({ dns: { 'long.example.org': ['93.184.216.34'] }, pages: { 'http://long.example.org/': html(`<article>${paragraph.repeat(10)}</article>`) } })
    const { body } = await extract({ url: 'http://long.example.org/' }).expect(200)
    expect(body.data.truncated).toBe(true)
    expect(body.data.text.length).toBeLessThanOrEqual(AI_CONTENT_MAX_LENGTH)
    expect(body.data.text.length).toBeGreaterThan(AI_CONTENT_MAX_LENGTH * 0.8)
    expect(body.data.text).toMatch(/[a-z.]$/)
  })

  it('reads plain-text pages and decodes their declared charset', async () => {
    const latin1 = Uint8Array.from([...Buffer.from('Caf'), 0xe9, ...Buffer.from(' owners say prices of coffee beans rose by half this year, according to a local trade group.')])
    web.use({
      dns: { 'text.example.org': ['93.184.216.34'] },
      pages: { 'https://text.example.org/a.txt': () => new Response(latin1, { status: 200, headers: { 'Content-Type': 'text/plain; charset=windows-1252' } }) },
    })
    const { body } = await extract({ url: 'https://text.example.org/a.txt' }).expect(200)
    expect(body.data.text).toMatch(/^Café owners say/)
    expect(body.data.title).toBeNull()
  })

  it('follows redirects to public pages and checks every hop', async () => {
    web.use({
      dns: { 'short.example.net': ['93.184.216.34'], 'news.example.org': ['93.184.216.35'] },
      pages: {
        'https://short.example.net/x': status(301, { Location: 'https://news.example.org/rice' }),
        'https://news.example.org/rice': html(ARTICLE_HTML),
      },
    })
    const { body } = await extract({ url: 'https://short.example.net/x' }).expect(200)
    expect(body.data).toMatchObject({ url: 'https://news.example.org/rice', host: 'news.example.org' })
    expect(web.dnsCalls()).toEqual(['short.example.net', 'short.example.net', 'news.example.org', 'news.example.org'])
  })

  it('refuses a redirect to a private address without requesting it', async () => {
    web.use({ dns: { 'evil.example.net': ['93.184.216.34'] }, pages: { 'https://evil.example.net/': status(302, { Location: 'http://169.254.169.254/latest/meta-data/' }) } })
    const res = await extract({ url: 'https://evil.example.net/' }).expect(422)
    expect(res.body.error.code).toBe('LINK_NOT_ALLOWED')
    expect(web.pageCalls().map((call) => call.url)).toEqual(['https://evil.example.net/'])
  })

  it('stops after three redirects', async () => {
    const hop = (n) => status(302, { Location: `https://loop.example.net/${n + 1}` })
    web.use({ dns: { 'loop.example.net': ['93.184.216.34'] }, pages: Object.fromEntries([0, 1, 2, 3, 4].map((n) => [`https://loop.example.net/${n}`, hop(n)])) })
    const res = await extract({ url: 'https://loop.example.net/0' }).expect(502)
    expect(res.body.error.code).toBe('LINK_FETCH_FAILED')
    expect(web.pageCalls()).toHaveLength(4)
  })
})

describe('links that are never requested', () => {
  it.each([
    'http://localhost/',
    'http://localhost.:80/admin',
    'http://127.0.0.1/',
    'http://2130706433/',
    'http://0x7f000001/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[fd00::1]/',
    'http://[fe80::1]/',
    'http://10.1.2.3/',
    'http://172.16.0.1/',
    'http://192.168.1.1/admin',
    'http://100.64.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://0.0.0.0/',
    'http://intranet/',
    'http://printer.local/',
    'http://db.internal/',
    'http://reserved.example/',
    'https://example.com:8443/',
    'http://user:secret@example.com/',
  ])('refuses %s', async (url) => {
    const res = await extract({ url }).expect(422)
    expect(res.body.error.code).toBe('LINK_NOT_ALLOWED')
    expect(web.allCalls()).toEqual([])
  })

})

describe('social media posts', () => {
  const preview = (title, description, siteName = 'Facebook') =>
    html(`<!doctype html><html><head><title>Facebook</title>
      <meta property="og:title" content="${title}">
      <meta property="og:site_name" content="${siteName}">
      <meta property="og:description" content="${description}">
      </head><body><div id="login_form">Log in</div><script>var big = 1</script></body></html>`)

  it('reads the post text from the link preview, keeping its line breaks', async () => {
    web.use({
      dns: { 'www.facebook.com': ['157.240.1.35'] },
      pages: {
        'https://www.facebook.com/gmanews/posts/123': preview(
          'GMA News',
          'Here are the biggest headlines for October 24, 2026.&#10;&#10;Typhoon Rosal exits PAR &#x2014; PAGASA&#10;Philippines...',
        ),
      },
    })
    const res = await extract({ url: 'https://www.facebook.com/gmanews/posts/123' }).expect(200)
    expect(res.body.data).toEqual({
      url: 'https://www.facebook.com/gmanews/posts/123',
      host: 'www.facebook.com',
      title: 'GMA News',
      siteName: 'Facebook',
      author: null,
      published: null,
      text: 'Title: GMA News\nWebsite: Facebook\n\nHere are the biggest headlines for October 24, 2026.\nTyphoon Rosal exits PAR — PAGASA\nPhilippines...',
      truncated: false,
      via: 'preview',
    })
    // The link is checked like any other: the host is resolved first.
    expect(web.dnsCalls()).toContain('www.facebook.com')
  })

  it('reads X, Instagram, YouTube and Threads posts the same way', async () => {
    for (const [url, host, site] of [
      ['https://x.com/jack/status/20', 'x.com', 'X (formerly Twitter)'],
      ['https://www.instagram.com/reel/abc', 'www.instagram.com', 'Instagram'],
      ['https://www.youtube.com/watch?v=abc', 'www.youtube.com', 'YouTube'],
      ['https://www.threads.net/@a/post/b', 'www.threads.net', 'Threads'],
    ]) {
      web.use({ dns: { [host]: ['93.184.216.34'] }, pages: { [url]: preview('A post', 'just setting up my twttr', site) } })
      const res = await extract({ url }).expect(200)
      expect(res.body.data).toMatchObject({ via: 'preview', siteName: site, text: expect.stringContaining('just setting up my twttr') })
    }
  })

  it.each([
    ['a sign-in wall', preview('Facebook', 'Log into Facebook to start sharing and connecting with your friends, family, and people you know.')],
    ["Instagram's sign-in wall", preview('Instagram', "Create an account or log in to Instagram - Share what you're into with the people who get you.", 'Instagram')],
    ['a page without a preview (TikTok)', html('<html><head><title>TikTok</title></head><body><script>window.__DATA__ = {}</script></body></html>')],
    ['a missing post', status(404)],
    ['a refused request', status(403)],
    ['a page that is not HTML', () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })],
  ])('explains that %s cannot be read, with the screenshot advice', async (_name, page) => {
    web.use({ dns: { 'www.facebook.com': ['157.240.1.35'] }, pages: { 'https://www.facebook.com/someone/posts/1': page } })
    const res = await extract({ url: 'https://www.facebook.com/someone/posts/1' }).expect(422)
    expect(res.body.error.code).toBe('LINK_SOCIAL_MEDIA')
    expect(res.body.error.message).toMatch(/private or deleted.*take a screenshot and attach it/)
  })

  it('cuts a very long preview', async () => {
    web.use({ dns: { 'x.com': ['93.184.216.34'] }, pages: { 'https://x.com/a/status/1': preview('Long', 'word '.repeat(2000), 'X') } })
    const res = await extract({ url: 'https://x.com/a/status/1' }).expect(200)
    expect(res.body.data.text.length).toBeLessThan(3100)
    expect(res.body.data.text.endsWith('…')).toBe(true)
  })

  it('still refuses a social site address that resolves to a private network', async () => {
    web.use({ dns: { 'www.facebook.com': ['10.0.0.5'] } })
    const res = await extract({ url: 'https://www.facebook.com/someone/posts/1' }).expect(422)
    expect(res.body.error.code).toBe('LINK_NOT_ALLOWED')
    expect(web.pageCalls()).toEqual([])
  })

  it('refuses a host name that resolves to a private address', async () => {
    web.use({ dns: { 'rebind.example.net': ['93.184.216.34', '127.0.0.1'] } })
    const res = await extract({ url: 'https://rebind.example.net/' }).expect(422)
    expect(res.body.error.code).toBe('LINK_NOT_ALLOWED')
    expect(web.dnsCalls()).toContain('rebind.example.net')
    expect(web.pageCalls()).toEqual([])
  })

  it('refuses a host name whose IPv6 address is private', async () => {
    web.use({ dns: { 'v6.example.net': ['93.184.216.34', '::1'] } })
    expect((await extract({ url: 'https://v6.example.net/' }).expect(422)).body.error.code).toBe('LINK_NOT_ALLOWED')
    expect(web.dnsCalls()).toContain('v6.example.net')
    expect(web.pageCalls()).toEqual([])
  })
})

describe('when a page cannot be read', () => {
  it('reports a host name that does not exist', async () => {
    const res = await extract({ url: 'https://no-such-site.example.org/' }).expect(502)
    expect(res.body.error.code).toBe('LINK_UNREACHABLE')
  })

  it('fails closed when the DNS check is unavailable', async () => {
    web.use({ dns: { 'news.example.org': () => Promise.reject(new TypeError('fetch failed')) } })
    const res = await extract({ url: 'https://news.example.org/rice' }).expect(503)
    expect(res.body.error.code).toBe('LINK_CHECK_UNAVAILABLE')
    expect(web.pageCalls()).toEqual([])
  })

  it.each([
    [403, /refused to share this page/],
    [404, /does not exist/],
    [429, /limiting requests/],
    [500, /had a problem/],
  ])('explains a %i from the website', async (code, message) => {
    web.use({ dns: { 'news.example.org': ['93.184.216.34'] }, pages: { 'https://news.example.org/rice': status(code) } })
    const res = await extract({ url: 'https://news.example.org/rice' }).expect(502)
    expect(res.body.error).toMatchObject({ code: 'LINK_FETCH_FAILED', message: expect.stringMatching(message) })
  })

  it.each([
    ['application/pdf', /PDF file/],
    ['image/png', /attach it instead/],
    ['video/mp4', /video or audio/],
    ['application/json', /does not open a web page/],
  ])('refuses %s content', async (type, message) => {
    web.use({ dns: { 'files.example.org': ['93.184.216.34'] }, pages: { 'https://files.example.org/f': html('{}', { 'Content-Type': type }) } })
    const res = await extract({ url: 'https://files.example.org/f' }).expect(422)
    expect(res.body.error).toMatchObject({ code: 'LINK_UNSUPPORTED_TYPE', message: expect.stringMatching(message) })
  })

  it('explains a page whose text is loaded by JavaScript', async () => {
    web.use({
      dns: { 'app.example.org': ['93.184.216.34'] },
      pages: { 'https://app.example.org/': html('<html><head><title>App</title></head><body><div id="root"></div><script>render()</script></body></html>') },
    })
    const res = await extract({ url: 'https://app.example.org/' }).expect(422)
    expect(res.body.error.code).toBe('LINK_NO_TEXT')
  })

  it('marks the text as cut when a page has more markup than is converted, even when the text is short', async () => {
    // Mostly tags: the part that is converted holds far less than the analysis limit.
    const spans = '<span class="word highlighted-word-style">a</span>'.repeat(10_000)
    const words = 'Plenty of readable words in an article with heavy markup around them. '.repeat(5)
    web.use({ dns: { 'dense.example.org': ['93.184.216.34'] }, pages: { 'https://dense.example.org/': html(`<article><p>${words}</p>${spans}</article>`) } })
    const { body } = await extract({ url: 'https://dense.example.org/' }).expect(200)
    expect(body.data.text.length).toBeLessThan(AI_CONTENT_MAX_LENGTH)
    expect(body.data.truncated).toBe(true)
  })

  it('reads only the first 1 MB of a huge page', async () => {
    expect(LINK_MAX_BYTES).toBe(1_000_000)
    const huge = `<article><p>${'Plenty of readable words in a very long article. '.repeat(Math.ceil((LINK_MAX_BYTES * 1.5) / 50))}</p></article>`
    web.use({ dns: { 'huge.example.org': ['93.184.216.34'] }, pages: { 'https://huge.example.org/': html(huge) } })
    const { body } = await extract({ url: 'https://huge.example.org/' }).expect(200)
    expect(body.data.truncated).toBe(true)
    expect(body.data.text.length).toBeLessThanOrEqual(AI_CONTENT_MAX_LENGTH)
  })

  it('gives up when the website does not answer in time', async () => {
    const mock = createWebMock()
    mock.use({ dns: { 'slow.example.org': ['93.184.216.34'] }, pages: { 'https://slow.example.org/': hangUntilAborted } })
    const reader = createLinkReader({ config: loadConfig({ ...TEST_ENV, ...AI_ENV }), logger: createLogger({ level: 'silent' }), fetch: mock.fetch, timeoutMs: 50 })
    await expect(reader.read('https://slow.example.org/')).rejects.toMatchObject({ status: 504, code: 'LINK_TIMEOUT' })
  })

  it('logs failures with the host name only', async () => {
    const lines = []
    const mock = createWebMock()
    const loggingApp = createAiApp({ fetch: mock.fetch, logger: createLogger({ level: 'debug', write: (_level, line) => lines.push(line) }) })
    mock.use({ dns: { 'news.example.org': ['93.184.216.34'] }, pages: { 'https://news.example.org/private-path?token=abc123': status(403) } })
    await request(loggingApp).post(EXTRACT).set('Authorization', 'Bearer student-1').send({ url: 'https://news.example.org/private-path?token=abc123' }).expect(502)
    const failure = lines.map((line) => JSON.parse(line)).find((entry) => entry.msg === 'link read failed')
    expect(failure).toMatchObject({ host: 'news.example.org', code: 'LINK_FETCH_FAILED', status: 403 })
    expect(lines.join('\n')).not.toMatch(/private-path|abc123/)
  })
})

describe('link request validation', () => {
  it('requires a signed-in user', async () => {
    const res = await request(app).post(EXTRACT).send({ url: 'https://news.example.org/' }).expect(401)
    expect(res.body.error.code).toBe('AUTH_REQUIRED')
    expect(web.allCalls()).toEqual([])
  })

  it.each([
    [{}, 'is required'],
    [{ url: '' }, 'must be an http(s) link'],
    [{ url: 'ftp://files.example.org/a' }, 'must be an http(s) link'],
    [{ url: 'javascript:alert(1)' }, 'must be an http(s) link'],
    [{ url: 42 }, 'must be a link'],
  ])('rejects %j', async (body, message) => {
    const res = await extract(body).expect(400)
    expect(res.body.error.details).toEqual([{ location: 'body', field: 'url', message }])
    expect(web.allCalls()).toEqual([])
  })

  it('rejects unknown fields', async () => {
    const res = await extract({ url: 'https://news.example.org/', follow: true }).expect(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
  })
})
