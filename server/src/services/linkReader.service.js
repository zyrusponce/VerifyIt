/*
  ⚡ LAYER: Service (link reader for the AI Investigation Assistant: page text the student reviews before analyzing)
  🔒 SECURITY: Reads public web pages only. A link is refused before any request when it carries a user name or
     password, uses a port other than 80/443, names a local or single-label host, or is an IP address that is not
     public. Host names are resolved first (DNS over HTTPS) and refused when any address is not public. Redirects
     are followed by hand, at most 3, and every hop is checked again. Only HTML and plain text are read, at most
     2 MB, within one 10-second budget for the whole read. Nothing is stored; failures are logged with the host
     name and the failure kind only, never the page or the full link.
  🚨 ERROR HANDLING: 422 LINK_NOT_ALLOWED / LINK_SOCIAL_MEDIA / LINK_UNSUPPORTED_TYPE / LINK_NO_TEXT;
     502 LINK_UNREACHABLE / LINK_FETCH_FAILED; 503 LINK_CHECK_UNAVAILABLE (the DNS check failed); 504 LINK_TIMEOUT.
*/
import { AppError } from '../utils/AppError.js'
import { AI_CONTENT_MAX_LENGTH } from './aiAnalysis.service.js'

export const LINK_TIMEOUT_MS = 10_000
export const LINK_MAX_BYTES = 2_000_000
const MAX_REDIRECTS = 3
const MIN_TEXT_LENGTH = 80
const DOH_URL = 'https://cloudflare-dns.com/dns-query'
const READABLE_TYPES = new Set(['text/html', 'application/xhtml+xml', 'text/plain', ''])

// These sites show posts only to signed-in visitors (or only as video), so a link to them has no readable text.
const SIGN_IN_SITES = [
  'facebook.com', 'fb.com', 'fb.watch', 'messenger.com', 'instagram.com', 'threads.net', 'threads.com', 'x.com',
  'twitter.com', 'tiktok.com', 'linkedin.com', 'snapchat.com', 'youtube.com', 'youtu.be',
]
// Top-level names that never belong to a public website.
const LOCAL_SUFFIXES = ['localhost', 'local', 'localdomain', 'internal', 'intranet', 'lan', 'home', 'corp', 'test', 'invalid', 'example', 'onion', 'arpa']

const linkError = (status, code, message, cause) => new AppError(status, code, message, cause ? { cause } : undefined)
const notAllowed = (reason) =>
  linkError(422, 'LINK_NOT_ALLOWED', 'This link cannot be opened. Use the full address of a public web page, starting with http:// or https://.', {
    context: 'link refused',
    reason,
  })
const timedOut = () => linkError(504, 'LINK_TIMEOUT', 'The website took too long to respond. Try again later, or copy the text from the page instead.')
const unreachable = (reason) =>
  linkError(502, 'LINK_UNREACHABLE', 'We could not reach that website. Check the link for typos and try again.', { context: 'website unreachable', reason })

/* ----------------------------------------------------------------------------------------------- Addresses */

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

function parseIPv4(text) {
  const parts = IPV4.exec(text)?.slice(1).map(Number)
  return parts && parts.every((part) => part <= 255) ? parts : null
}

function isPublicIPv4([a, b, c]) {
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false // "this network", private, loopback, multicast, reserved
  if (a === 100 && b >= 64 && b <= 127) return false // carrier-grade NAT
  if (a === 169 && b === 254) return false // link-local, including cloud metadata services
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) return false
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false // benchmarking, documentation
  if (a === 203 && b === 0 && c === 113) return false // documentation
  return true
}

/** The eight 16-bit groups of an IPv6 address (an embedded IPv4 tail is allowed), or null. */
function parseIPv6(text) {
  let value = text.toLowerCase()
  const tail = /:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
  if (tail) {
    const v4 = parseIPv4(tail[1])
    if (!v4) return null
    value = `${value.slice(0, tail.index + 1)}${((v4[0] << 8) | v4[1]).toString(16)}:${((v4[2] << 8) | v4[3]).toString(16)}`
  }
  const halves = value.split('::')
  if (halves.length > 2) return null
  const head = halves[0] ? halves[0].split(':') : []
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const missing = 8 - head.length - rest.length
  if (halves.length === 2 ? missing < 1 : missing !== 0) return null
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...rest]
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null
  return groups.map((group) => parseInt(group, 16))
}

function isPublicIPv6(groups) {
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    // IPv4-mapped (::ffff:a.b.c.d): judged as the IPv4 address it carries.
    return isPublicIPv4([groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff])
  }
  const [first, second] = groups
  if ((first & 0xe000) !== 0x2000) return false // only global unicast (2000::/3); excludes ::1, fc00::/7, fe80::/10, ff00::/8
  if (first === 0x2001 && (second < 0x0200 || second === 0x0db8)) return false // protocol assignments (Teredo…), documentation
  if (first === 0x2002) return false // 6to4 carries an arbitrary IPv4 address
  return true
}

/** True only for an IP address that belongs to the public internet. */
export function isPublicAddress(address) {
  const text = String(address).replace(/^\[|\]$/g, '')
  const v4 = parseIPv4(text)
  if (v4) return isPublicIPv4(v4)
  const v6 = text.includes(':') ? parseIPv6(text) : null
  return v6 ? isPublicIPv6(v6) : false
}

/** Refuses links that could reach a private network. Returns the host name and whether it is an IP address. */
function checkLink(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw notAllowed('scheme')
  if (url.username || url.password) throw notAllowed('credentials')
  if (url.port && url.port !== '80' && url.port !== '443') throw notAllowed('port')
  const host = url.hostname.replace(/\.$/, '')
  if (host.startsWith('[') || parseIPv4(host)) {
    if (!isPublicAddress(host)) throw notAllowed('private address')
    return { host, isAddress: true }
  }
  const labels = host.split('.')
  if (labels.length < 2 || LOCAL_SUFFIXES.includes(labels.at(-1))) throw notAllowed('local host name')
  return { host, isAddress: false }
}

/** Resolves a host name with DNS over HTTPS and refuses it when it has no address or any address is not public. */
async function checkResolvedAddresses(host, { send, signal }) {
  const lookups = await Promise.all(
    ['A', 'AAAA'].map(async (type) => {
      let response
      try {
        response = await send(`${DOH_URL}?name=${encodeURIComponent(host)}&type=${type}`, {
          headers: { Accept: 'application/dns-json' },
          signal,
        })
      } catch (error) {
        if (signal.aborted) throw timedOut()
        throw linkError(503, 'LINK_CHECK_UNAVAILABLE', 'The link could not be checked right now. Please try again in a moment.', {
          context: 'DNS over HTTPS request failed',
          error: error?.name,
        })
      }
      const body = response.ok ? await response.json().catch(() => null) : null
      if (!body || typeof body.Status !== 'number') {
        throw linkError(503, 'LINK_CHECK_UNAVAILABLE', 'The link could not be checked right now. Please try again in a moment.', {
          context: 'DNS over HTTPS answer unusable',
          status: response.status,
        })
      }
      // Answers also list the CNAME chain; only address records (A = 1, AAAA = 28) matter.
      return (Array.isArray(body.Answer) ? body.Answer : []).filter((answer) => answer?.type === 1 || answer?.type === 28).map((answer) => answer.data)
    }),
  )
  const addresses = lookups.flat()
  if (addresses.length === 0) throw unreachable('no DNS address')
  if (!addresses.every(isPublicAddress)) throw notAllowed('resolves to a private address')
}

/* ------------------------------------------------------------------------------------------------- Reading */

const REDIRECTS = new Set([301, 302, 303, 307, 308])

function fetchFailed(status) {
  let message = `The website did not send the page (error ${status}). Copy the text from the page instead.`
  if (status === 401 || status === 403 || status === 451) {
    message = 'The website refused to share this page. It may need you to sign in, or it blocks automatic readers. Copy the text from the page instead.'
  } else if (status === 404 || status === 410) {
    message = 'The website says this page does not exist. Check the link and try again.'
  } else if (status === 429) {
    message = 'The website is limiting requests right now. Try again later, or copy the text from the page instead.'
  } else if (status >= 500) {
    message = 'The website had a problem showing this page. Try again later, or copy the text from the page instead.'
  }
  return linkError(502, 'LINK_FETCH_FAILED', message, { context: 'website error', status })
}

function unsupportedType(type) {
  let message = 'This link does not open a web page that VerifyIT can read. Copy the text you want to check instead.'
  if (type.startsWith('image/')) message = 'This link opens an image, not a web page. Save the image and attach it instead.'
  else if (type === 'application/pdf') message = 'This link opens a PDF file, not a web page. Open it and copy the text you want to check.'
  else if (type.startsWith('video/') || type.startsWith('audio/')) message = 'This link opens a video or audio file, which VerifyIT cannot read.'
  return linkError(422, 'LINK_UNSUPPORTED_TYPE', message, { context: 'unsupported content type', type })
}

const cancelBody = (response) => response.body?.cancel?.().catch(() => {})

/** GETs the page, following up to MAX_REDIRECTS redirects by hand so every hop is checked like the first. */
async function fetchPage(start, { send, signal, userAgent }) {
  let url = start
  for (let hop = 0; ; hop += 1) {
    const { host, isAddress } = checkLink(url)
    if (SIGN_IN_SITES.some((site) => host === site || host.endsWith(`.${site}`))) {
      throw linkError(
        422,
        'LINK_SOCIAL_MEDIA',
        'Posts on social media and video sites (like Facebook, Instagram, X, TikTok, and YouTube) cannot be read from a link, because those sites need you to sign in. Copy the post text into the box, or take a screenshot and attach it.',
      )
    }
    if (!isAddress) await checkResolvedAddresses(host, { send, signal })

    let response
    try {
      response = await send(url.href, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': userAgent, Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9', 'Accept-Language': 'en' },
        signal,
      })
    } catch (error) {
      if (signal.aborted) throw timedOut()
      throw unreachable(`request failed (${error?.name})`)
    }
    if (!REDIRECTS.has(response.status)) return { response, url, host }

    await cancelBody(response)
    const location = response.headers.get('location')
    if (!location || hop >= MAX_REDIRECTS) throw linkError(502, 'LINK_FETCH_FAILED', 'The website kept redirecting to other pages. Copy the text from the page instead.')
    try {
      url = new URL(location, url)
    } catch {
      throw linkError(502, 'LINK_FETCH_FAILED', 'The website redirected to an address that is not valid. Copy the text from the page instead.')
    }
  }
}

/** Reads at most maxBytes of the body; `cut` says whether the page was longer. */
async function readLimited(response, maxBytes) {
  const reader = response.body?.getReader?.()
  if (!reader) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    return { bytes: bytes.subarray(0, maxBytes), cut: bytes.length > maxBytes }
  }
  const chunks = []
  let size = 0
  let cut = false
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (size + value.length > maxBytes) {
      chunks.push(value.subarray(0, maxBytes - size))
      size = maxBytes
      cut = true
      await reader.cancel().catch(() => {})
      break
    }
    chunks.push(value)
    size += value.length
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.length
  }
  return { bytes, cut }
}

/** Decodes with the charset from the Content-Type header or a <meta charset>, falling back to UTF-8. */
function decodeText(bytes, contentType) {
  const declared = /charset=["']?([\w-]+)/i.exec(contentType)?.[1]
  const head = declared ? '' : String.fromCharCode(...bytes.subarray(0, 4096))
  const sniffed = declared ? null : /<meta[^<>]{0,200}charset=["']?([\w-]+)/i.exec(head)?.[1]
  for (const label of [declared, sniffed, 'utf-8']) {
    if (!label) continue
    try {
      return new TextDecoder(label).decode(bytes)
    } catch {
      // Unknown or unsupported label: try the next one.
    }
  }
  return new TextDecoder().decode(bytes)
}

/* ---------------------------------------------------------------------------------------------- Extraction */
// Plain string scanning and regular expressions whose repeats stop at the next "<" or ">", so the work stays
// linear in the page size even for hostile markup.

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ', thinsp: ' ', ndash: '–', mdash: '—',
  lsquo: '‘', rsquo: '’', sbquo: '‚', ldquo: '“', rdquo: '”', bdquo: '„', laquo: '«', raquo: '»', hellip: '…', middot: '·',
  bull: '•', copy: '©', reg: '®', trade: '™', deg: '°', times: '×', divide: '÷', euro: '€', pound: '£', yen: '¥', cent: '¢',
  sect: '§', para: '¶', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', agrave: 'à', egrave: 'è',
  ntilde: 'ñ', Ntilde: 'Ñ', auml: 'ä', ouml: 'ö', uuml: 'ü', ccedil: 'ç', Aacute: 'Á', Eacute: 'É', Iacute: 'Í',
  Oacute: 'Ó', Uacute: 'Ú', shy: '', zwnj: '', zwj: '', lrm: '', rlm: '',
}

function fromCodePoint(code) {
  if (!Number.isFinite(code) || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '�'
  if (code < 0x20 && code !== 0x09 && code !== 0x0a) return ' '
  return String.fromCodePoint(code)
}

export function decodeEntities(text) {
  return text.replace(/&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z][a-zA-Z0-9]{1,31}));/g, (entity, decimal, hex, name) => {
    if (decimal) return fromCodePoint(Number(decimal))
    if (hex) return fromCodePoint(parseInt(hex, 16))
    return NAMED_ENTITIES[name] ?? entity
  })
}

/** Removes every <name>…</name> element (and HTML comments) by scanning; an unclosed element runs to the end. */
function removeElements(html, names) {
  const lower = html.toLowerCase()
  const opening = new RegExp(`<!--|<(${names.join('|')})(?=[\\s/>])`, 'g')
  let result = ''
  let position = 0
  for (;;) {
    opening.lastIndex = position
    const match = opening.exec(lower)
    if (!match) break
    result += html.slice(position, match.index)
    const closing = match[0] === '<!--' ? '-->' : `</${match[1]}`
    const end = lower.indexOf(closing, match.index + match[0].length)
    if (end === -1) return result
    const close = match[0] === '<!--' ? end + 3 : lower.indexOf('>', end)
    if (close === -1) return result
    position = close + (match[0] === '<!--' ? 0 : 1)
    result += ' '
  }
  return result + html.slice(position)
}

const ATTRIBUTE = /([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g

function attributesOf(tag) {
  const attributes = {}
  for (const [, name, double, single, bare] of tag.matchAll(ATTRIBUTE)) {
    const key = name.toLowerCase()
    if (!(key in attributes)) attributes[key] = double ?? single ?? bare ?? ''
  }
  return attributes
}

const tidyLine = (value, max = 200) => {
  const text = decodeEntities(String(value ?? ''))
    .replace(/<[^<>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
const looksLikeLink = (value) => /^(?:https?:)?\/\//i.test(value) || /^www\./i.test(value)

const ARTICLE_TYPES = /article|posting|report/i

/** Headline, author, and date from schema.org JSON-LD (the first article-like object). */
function readJsonLd(html) {
  const found = {}
  const lower = html.toLowerCase()
  let from = 0
  for (let blocks = 0; blocks < 5; blocks += 1) {
    const start = lower.indexOf('application/ld+json', from)
    if (start === -1) break
    const open = lower.indexOf('>', start)
    const close = open === -1 ? -1 : lower.indexOf('</script', open)
    if (close === -1) break
    from = close
    if (close - open > 300_000) continue
    let data
    try {
      data = JSON.parse(html.slice(open + 1, close))
    } catch {
      continue
    }
    const queue = [data]
    for (let seen = 0; queue.length && seen < 300; seen += 1) {
      const node = queue.shift()
      if (Array.isArray(node)) queue.push(...node)
      else if (node && typeof node === 'object') {
        const type = [node['@type']].flat().join(' ')
        if (ARTICLE_TYPES.test(type)) {
          const authors = [node.author].flat().map((author) => (typeof author === 'string' ? author : author?.name)).filter((name) => typeof name === 'string')
          found.title ??= typeof node.headline === 'string' ? node.headline : undefined
          found.author ??= authors.length ? authors.join(', ') : undefined
          found.published ??= typeof node.datePublished === 'string' ? node.datePublished : undefined
        }
        if (node['@graph']) queue.push(node['@graph'])
      }
    }
    if (found.title && found.author && found.published) break
  }
  return found
}

/** "2025-03-14T08:00:00+08:00" → "March 14, 2025". Anything else is kept as written. */
function formatPublished(value) {
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!day) return tidyLine(value, 60)
  const date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])))
  return Number.isNaN(date.getTime()) ? tidyLine(value, 60) : date.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' })
}

function readMetadata(html) {
  const meta = {}
  for (const [tag] of html.matchAll(/<meta\b[^<>]*>/gi)) {
    const attributes = attributesOf(tag)
    const key = (attributes.property ?? attributes.name ?? attributes.itemprop)?.toLowerCase()
    if (key && attributes.content && !(key in meta)) meta[key] = attributes.content
  }
  const jsonLd = readJsonLd(html)
  const firstOf = (...values) => values.map((value) => tidyLine(value)).find(Boolean) ?? ''
  const titleTag = /<title\b[^<>]*>([^<]*)/i.exec(html)?.[1]
  const timeTag = /<time\b[^<>]*\bdatetime\s*=\s*["']([^"'<>]+)["']/i.exec(html)?.[1]
  const metaAuthor = [meta.author, meta['article:author'], meta['parsely-author'], meta['sailthru.author'], meta['dc.creator']].find(
    (value) => value && !looksLikeLink(value.trim()),
  )
  const published = firstOf(
    meta['article:published_time'],
    meta['og:article:published_time'],
    meta.datepublished,
    meta['parsely-pub-date'],
    meta.pubdate,
    meta['publish-date'],
    meta.date,
    meta['dc.date.issued'],
    meta['dc.date'],
    jsonLd.published,
    timeTag,
  )
  return {
    title: firstOf(meta['og:title'], meta['twitter:title'], jsonLd.title, titleTag),
    siteName: firstOf(meta['og:site_name'], meta['application-name']),
    author: firstOf(metaAuthor, jsonLd.author),
    published: published ? formatPublished(published) : '',
  }
}

const BLOCK_TAG = /<\/?(?:p|div|h[1-6]|ul|ol|tr|table|thead|tbody|section|article|header|main|blockquote|pre|figure|figcaption|dl|dd|dt|hr|address|details|summary)\b[^<>]*>/gi
// The API rejects control characters other than tabs and line breaks, so the extracted text never contains them.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g

/** One trimmed, single-spaced line per paragraph, without empty lines or control characters. */
function tidyText(text) {
  return text
    .replace(CONTROL_CHARACTERS, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line && line !== '•')
    .join('\n')
}

function htmlToText(fragment) {
  return tidyText(
    decodeEntities(
      fragment
        .replace(/<br\b[^<>]*>/gi, '\n')
        .replace(/<li\b[^<>]*>/gi, '\n• ')
        .replace(BLOCK_TAG, '\n')
        .replace(/<\/t[dh]\s*>/gi, ' ')
        .replace(/<[^<>]*>/g, ''),
    ),
  )
}

/** The text between the first <tag …> and the last </tag>, or null. */
function region(html, lower, tag) {
  const start = lower.search(new RegExp(`<${tag}[\\s>]`))
  const end = lower.lastIndexOf(`</${tag}`)
  return start !== -1 && end > start ? html.slice(start, end) : null
}

// Class or id names that many news sites and blogs give the element holding just the story text.
const BODY_CONTAINER_NAMES = new Set([
  'article-body', 'article__body', 'articlebody', 'article-content', 'article__content', 'story-body', 'story-content',
  'entry-content', 'post-content', 'post-body', 'mw-content-text',
])

/**
 * The first element marked as the story body (itemprop="articleBody" or a known class/id), up to its matching
 * closing tag (nested tags of the same name are counted), or null. One pass over the page.
 */
function bodyContainer(html, lower) {
  for (const match of lower.matchAll(/<([a-z][a-z0-9]*)\b([^<>]*)>/g)) {
    const attributes = attributesOf(match[2])
    const names = `${attributes.class ?? ''} ${attributes.id ?? ''}`.split(/\s+/)
    if (attributes.itemprop !== 'articlebody' && !names.some((name) => BODY_CONTAINER_NAMES.has(name))) continue
    const tag = match[1]
    const tags = new RegExp(`<(/?)${tag}(?=[\\s/>])`, 'g')
    tags.lastIndex = match.index + match[0].length
    let depth = 1
    for (let next = tags.exec(lower); next; next = tags.exec(lower)) {
      depth += next[1] ? -1 : 1
      if (depth === 0) return html.slice(match.index, next.index)
    }
    return html.slice(match.index)
  }
  return null
}

// Share buttons and other page furniture that end up as lines of their own.
const FURNITURE_LINE =
  /^(?:share|share this(?: article| story| post)?|copy link|link copied|copied|facebook|twitter|x \(twitter\)|x|email|e-mail|print|whatsapp|viber|messenger|telegram|linkedin|reddit|pinterest|advertisement|sponsored|read more|see more|load more|show more|subscribe|sign in|log in|login|sign up|register|menu|search|skip to (?:main )?content|close|back to top|follow us|newsletter)[.:]?$/i
const SHORT_LIST_ITEM = /^• .{0,30}$/
const MENU_RUN = 8

/** Drops furniture lines and long runs of very short list items (menus, language lists, tag clouds). */
function withoutPageFurniture(text) {
  const lines = text.split('\n').filter((line) => !FURNITURE_LINE.test(line))
  const kept = []
  for (let index = 0; index < lines.length; ) {
    let end = index
    while (end < lines.length && SHORT_LIST_ITEM.test(lines[end])) end += 1
    if (end - index >= MENU_RUN) index = end
    else {
      kept.push(...lines.slice(index, Math.max(end, index + 1)))
      index = Math.max(end, index + 1)
    }
  }
  return kept.join('\n')
}

const DROPPED_ELEMENTS = [
  'head', 'script', 'style', 'noscript', 'template', 'svg', 'math', 'iframe', 'object', 'embed', 'canvas', 'nav', 'footer',
  'aside', 'form', 'button', 'select', 'dialog',
]

/** Title, site, author, date, and readable body text of an HTML page. */
export function extractPageText(html) {
  const metadata = readMetadata(html)
  const cleaned = removeElements(html, DROPPED_ELEMENTS)
  const lower = cleaned.toLowerCase()
  // Prefer the marked story body, then the article, then <main>, then the whole page, when a region has too little text.
  const candidates = [bodyContainer(cleaned, lower), region(cleaned, lower, 'article'), region(cleaned, lower, 'main'), cleaned]
    .filter(Boolean)
    .map((fragment) => withoutPageFurniture(htmlToText(fragment)))
  const body = candidates.find((text) => text.length >= 200) ?? candidates.reduce((longest, text) => (text.length > longest.length ? text : longest), '')
  return { ...metadata, body }
}

/** The text placed in the student's text box: page details first, then the body, cut to the analysis limit. */
function composeText({ title, siteName, author, published, body }) {
  const details = [title && `Title: ${title}`, siteName && `Website: ${siteName}`, author && `Author: ${author}`, published && `Published: ${published}`]
  const full = [details.filter(Boolean).join('\n'), body].filter(Boolean).join('\n\n')
  if (full.length <= AI_CONTENT_MAX_LENGTH) return { text: full, cut: false }
  // End at a line break or a space when one is near the limit, so no word is cut in half.
  const slice = full.slice(0, AI_CONTENT_MAX_LENGTH)
  const boundary = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '))
  return { text: (boundary > AI_CONTENT_MAX_LENGTH * 0.8 ? slice.slice(0, boundary) : slice).trimEnd(), cut: true }
}

/* ------------------------------------------------------------------------------------- Extraction service */

export const EXTRACT_URL = 'https://api.tavily.com/extract'
export const EXTRACT_TIMEOUT_MS = 8000
const PARAGRAPH_MIN = 60
const MAX_GAP = 3
// Lines of consent notices and site boilerplate, which can be long enough to look like article text.
const NOTICE_LINE = /\b(?:cookies?|tracking technologies|privacy policy|terms of (?:use|service)|all rights reserved|copyright|opt[- ]out|do not sell)\b/i

/**
 * The article inside a whole-page text dump: the longest run of sentence-like lines (long, ending in punctuation),
 * allowing a few short lines (sub-headings) inside it. Menus, headline lists and consent notices are not sentences.
 */
export function articleFromDump(raw) {
  const lines = String(raw ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
  const isParagraph = (line) => line.length >= PARAGRAPH_MIN && /[.!?…]["'”’)]*$/.test(line) && !NOTICE_LINE.test(line)
  let best = null
  let current = null
  let gap = 0
  lines.forEach((line, index) => {
    if (isParagraph(line)) {
      current ??= { start: index, end: index, chars: 0 }
      current.end = index
      current.chars += line.length
      gap = 0
      if (!best || current.chars > best.chars) best = current
    } else if (current && line) {
      gap += 1
      if (gap > MAX_GAP) current = null
    }
  })
  if (!best) return ''
  return tidyText(lines.slice(best.start, best.end + 1).filter(Boolean).join('\n\n'))
}

/** Failures that look like the site turning the reader away (not a missing page, a social site, or a bad link). */
function looksBlocked(failure) {
  if (failure.code === 'LINK_TIMEOUT' || failure.code === 'LINK_NO_TEXT') return true
  const status = failure.cause?.status
  return failure.code === 'LINK_FETCH_FAILED' && (status === 401 || status === 403 || status === 429 || status === 451 || status >= 500)
}

/**
 * @param {object} deps
 * @param {ReturnType<import('../config/env.js').loadConfig>} deps.config
 * @param {ReturnType<import('../utils/logger.js').createLogger>} deps.logger
 * @param {typeof fetch} [deps.fetch] injectable for tests; defaults to the runtime's fetch
 */
export function createLinkReader({ config, logger, fetch: fetchImpl, timeoutMs = LINK_TIMEOUT_MS }) {
  // Called through globalThis: Cloudflare Workers throws "Illegal invocation" for a detached fetch.
  const send = fetchImpl ?? ((input, init) => globalThis.fetch(input, init))
  const userAgent = `Mozilla/5.0 (compatible; VerifyIT-LinkReader/1.0; +${config.publicAppUrl})`
  const extractorKey = config.newsSearch?.apiKey ?? null

  /**
   * Second attempt for a page that turned the reader away: Tavily's extraction service fetches it from its own network.
   * The link was already checked by the first attempt and nothing of ours is reachable from there. Resolves with the
   * page in the usual shape, or null when it cannot help (the original failure is then reported).
   */
  async function readViaExtractor(link, requestId) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS)
    try {
      const response = await send(EXTRACT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${extractorKey}` },
        body: JSON.stringify({ urls: [link], extract_depth: 'basic', format: 'text' }),
        signal: controller.signal,
      })
      const body = await response.json().catch(() => null)
      const page = response.ok && Array.isArray(body?.results) ? body.results[0] : null
      const article = page ? articleFromDump(page.raw_content) : ''
      if (article.length < MIN_TEXT_LENGTH) return null
      const title = tidyLine(page.title, 300)
      const { text, cut } = composeText({ title, siteName: '', author: '', published: '', body: article })
      return { url: link, host: new URL(link).hostname, title: title || null, siteName: null, author: null, published: null, text, truncated: cut, via: 'extractor' }
    } catch (error) {
      logger.warn('link extraction failed', { requestId, kind: controller.signal.aborted ? 'timeout' : 'network' })
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    /** Reads the readable text of a public web page. Throws AppError with a message safe to show. */
    async read(link, { requestId } = {}) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      let host = null
      try {
        host = new URL(link).hostname
        const page = await fetchPage(new URL(link), { send, signal: controller.signal, userAgent })
        host = page.host
        const { response } = page
        if (!response.ok) {
          await cancelBody(response)
          throw fetchFailed(response.status)
        }
        const contentType = response.headers.get('content-type') ?? ''
        const type = contentType.split(';')[0].trim().toLowerCase()
        if (!READABLE_TYPES.has(type)) {
          await cancelBody(response)
          throw unsupportedType(type)
        }

        let body
        try {
          body = await readLimited(response, LINK_MAX_BYTES)
        } catch (error) {
          if (controller.signal.aborted) throw timedOut()
          throw unreachable(`body unreadable (${error?.name})`)
        }
        const source = decodeText(body.bytes, contentType)
        const extracted =
          type === 'text/plain' ? { title: '', siteName: '', author: '', published: '', body: tidyText(source) } : extractPageText(source)
        if (extracted.body.length < MIN_TEXT_LENGTH) {
          throw linkError(
            422,
            'LINK_NO_TEXT',
            'We could not find readable article text on this page. It may need you to sign in, or load its text in a way VerifyIT cannot read. Copy the text into the box, or take a screenshot and attach it.',
          )
        }
        const { text, cut } = composeText(extracted)
        return {
          url: page.url.href,
          host,
          title: extracted.title || null,
          siteName: extracted.siteName || null,
          author: extracted.author || null,
          published: extracted.published || null,
          text,
          truncated: cut || body.cut,
          via: 'direct',
        }
      } catch (error) {
        const failure =
          error instanceof AppError ? error : controller.signal.aborted ? timedOut() : unreachable(`unexpected error (${error?.name})`)
        logger.warn('link read failed', { requestId, host, code: failure.code, status: failure.cause?.status ?? null, reason: failure.cause?.reason ?? null })
        if (extractorKey && looksBlocked(failure)) {
          const page = await readViaExtractor(link, requestId)
          if (page) return page
        }
        throw failure
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
