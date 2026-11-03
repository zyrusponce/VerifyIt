import { describe, expect, it } from 'vitest'
import { LINK_MAX_BYTES, MAX_REGION_CHARS, decodeEntities, extractPageText, isPublicAddress } from '../../src/services/linkReader.service.js'

describe('isPublicAddress', () => {
  it.each([
    '93.184.216.34',
    '8.8.8.8',
    '1.1.1.1',
    '172.15.0.1',
    '172.32.0.1',
    '100.63.255.255',
    '2606:2800:220:1:248:1893:25c8:1946',
    '2001:4860:4860::8888',
    '[2001:4860:4860::8844]',
    '::ffff:8.8.8.8',
  ])('accepts the public address %s', (address) => {
    expect(isPublicAddress(address)).toBe(true)
  })

  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '127.255.255.254',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.8',
    '192.0.2.1',
    '192.168.0.1',
    '198.18.0.1',
    '198.51.100.7',
    '203.0.113.9',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '[::1]',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::127.0.0.1',
    '64:ff9b::7f00:1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'ff02::1',
    '2001:db8::1',
    '2001::1',
    '2002:7f00:1::1',
    '999.1.1.1',
    '1.2.3',
    '1:2:3:4:5:6:7:8:9',
    'not-an-address',
    '',
  ])('refuses %j', (address) => {
    expect(isPublicAddress(address)).toBe(false)
  })
})

describe('decodeEntities', () => {
  it('decodes named, decimal, and hex entities and leaves unknown ones', () => {
    expect(decodeEntities('Tom &amp; Jerry&#8217;s &#x2014; &ldquo;fun&rdquo; &notAnEntity; &#0; &#x110000;')).toBe('Tom & Jerry’s — “fun” &notAnEntity;   �')
  })
})

describe('extractPageText', () => {
  it('prefers the article, then main, then the whole page', () => {
    const words = 'Readable words that form a paragraph long enough to be taken as the article body. '.repeat(3)
    expect(extractPageText(`<body><p>Menu</p><article><p>${words}</p></article></body>`).body).toBe(words.trim())
    expect(extractPageText(`<body><p>Menu</p><main><p>${words}</p></main></body>`).body).toBe(words.trim())
    // A short <article> teaser is not the article: the whole page is used instead.
    expect(extractPageText(`<body><article>Teaser</article><p>${words}</p></body>`).body).toBe(`Teaser\n${words.trim()}`)
  })

  it('ignores an author meta tag that is only a profile link', () => {
    const { author } = extractPageText('<meta property="article:author" content="https://facebook.com/someone"><meta name="author" content="">')
    expect(author).toBe('')
  })

  it('converts only the start of a very long region and says so, without leaving half a tag', () => {
    const sentence = '<p>Readable words that form a sentence in a <a href="https://example.org/a-long-link">very long</a> article.</p>'
    const { body, cut } = extractPageText(`<article>${sentence.repeat(10_000)}</article>`)
    expect(cut).toBe(true)
    expect(body.length).toBeGreaterThan(6000)
    expect(body.length).toBeLessThan(MAX_REGION_CHARS)
    expect(body).not.toMatch(/[<>]/)
  })

  it('does not report a cut for a page that fits', () => {
    const words = 'Readable words that form a paragraph long enough to be taken as the article body. '.repeat(3)
    expect(extractPageText(`<article><p>${words}</p></article>`).cut).toBe(false)
  })

  it('stays within the CPU a Cloudflare Worker allows on a large page', () => {
    // Shaped like a long encyclopedia article: the story body is marked, and dense with links and references.
    const paragraph = `<p>${'Words with a <a href="/wiki/Some_Long_Page_Title" class="mw-redirect" title="Some Long Page Title">link</a> and a reference<sup class="reference"><a href="#cite_note-1">[1]</a></sup> in them. '.repeat(20)}</p>`
    const page = `<html><head><title>Long</title></head><body><main><div id="mw-content-text">${paragraph.repeat(250)}</div></main></body></html>`
    expect(page.length).toBeGreaterThan(LINK_MAX_BYTES * 0.8)
    // CPU time, as the Worker limit counts it. Elapsed time depends on what else this machine is running.
    const runs = 10
    const before = process.cpuUsage()
    for (let run = 0; run < runs; run += 1) extractPageText(page)
    const { user, system } = process.cpuUsage(before)
    expect((user + system) / 1000 / runs).toBeLessThan(40)
  })

  it('stays fast on hostile markup', () => {
    const hostile = [
      '<'.repeat(1_000_000),
      '<script'.repeat(200_000),
      '<!--'.repeat(300_000),
      '<p '.repeat(400_000),
      '<meta '.repeat(200_000),
      `<a href="${'"'.repeat(500_000)}`,
      '&#'.repeat(500_000),
      'application/ld+json>'.repeat(50_000),
      '<article'.repeat(150_000),
    ]
    for (const html of hostile) {
      const started = performance.now()
      extractPageText(html)
      expect(performance.now() - started).toBeLessThan(1500)
    }
  })
})
