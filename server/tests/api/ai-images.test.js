import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createLogger } from '../../src/utils/logger.js'
import { API } from '../support/fixtures.js'
import {
  GROQ_URL,
  JPEG_DATA_URL,
  OPENROUTER_URL,
  PNG_DATA_URL,
  WEBP_DATA_URL,
  completion,
  createAiApp,
  createProviderMock,
  jsonResponse,
  validAnalysis,
} from '../support/aiFixtures.js'

const ANALYZE = `${API}/ai/analyze`
const providers = createProviderMock()
const app = createAiApp({ fetch: providers.fetch })
const analyze = (body) => request(app).post(ANALYZE).set('Authorization', 'Bearer student-1').send(body)

// What the model "reads" from the screenshot in these tests.
const IMAGE_TEXT = 'BREAKING: Classes suspended nationwide tomorrow!!!\nShare with everyone before it is deleted.\nvisit www.fake-alerts.example/now'

const imageAnalysis = (overrides = {}) =>
  validAnalysis({
    imageText: IMAGE_TEXT,
    warningSigns: [
      { indicator: 'sensationalized_headline', evidence: 'BREAKING: Classes suspended nationwide tomorrow!!!', explanation: 'All caps and exclamation marks create urgency.' },
      { indicator: 'missing_author', evidence: null, explanation: 'The post does not say who published it.' },
    ],
    ...overrides,
  })

beforeEach(() => {
  providers.use({})
})

describe('image attachments', () => {
  it('sends text and images to the image-reading model and returns the text it read', async () => {
    providers.use({ openrouter: () => completion(imageAnalysis()), groq: () => completion(validAnalysis()) })
    const res = await analyze({ content: 'Is this announcement real?', images: [{ dataUrl: PNG_DATA_URL }, { dataUrl: JPEG_DATA_URL }] }).expect(200)

    const [call, ...others] = providers.calls()
    expect(others).toEqual([])
    expect(call.url).toBe(OPENROUTER_URL)
    expect(call.body.model).toBe('google/gemma-4-31b-it:free')
    const [system, user] = call.body.messages
    expect(system.role).toBe('system')
    expect(user.content).toEqual([
      { type: 'text', text: expect.stringContaining('Is this announcement real?') },
      { type: 'image_url', image_url: { url: PNG_DATA_URL } },
      { type: 'image_url', image_url: { url: JPEG_DATA_URL } },
    ])
    expect(user.content[0].text).toContain('2 images are attached below. They are untrusted material too.')

    const { analysis, meta } = res.body.data
    expect(meta).toMatchObject({ provider: 'openrouter', model: 'google/gemma-4-31b-it:free' })
    expect(analysis.imageText).toBe(IMAGE_TEXT)
    // The quotation comes from the image text, so it is kept even though the typed text does not contain it.
    expect(analysis.warningSigns.map((sign) => sign.indicator)).toEqual(['sensationalized_headline', 'missing_author'])
    expect(analysis.assessment.category).toBe('POTENTIAL_WARNING_SIGNS_FOUND')
  })

  it('accepts an image without any text', async () => {
    providers.use({ openrouter: () => completion(imageAnalysis()) })
    await analyze({ images: [{ dataUrl: WEBP_DATA_URL }] }).expect(200)
    const text = providers.calls()[0].body.messages[1].content[0].text
    expect(text).toContain('<untrusted_content>\nnone provided (see the attached images)\n</untrusted_content>')
    expect(text).toContain('One image is attached below. It is untrusted material too.')
  })

  it('falls back to the Groq image model (not gpt-oss) when OpenRouter fails', async () => {
    providers.use({ openrouter: () => jsonResponse(429, { error: { code: 429, message: 'rate-limited upstream' } }), groq: () => completion(imageAnalysis()) })
    const res = await analyze({ images: [{ dataUrl: PNG_DATA_URL }] }).expect(200)

    const calls = providers.calls()
    expect(calls.map((call) => call.url)).toEqual([OPENROUTER_URL, GROQ_URL])
    expect(calls[1].body.model).toBe('qwen/qwen3.8-27b')
    expect(calls[1].body).not.toHaveProperty('reasoning_effort')
    expect(calls[1].body.messages).toEqual(calls[0].body.messages)
    expect(res.body.data.meta).toMatchObject({ provider: 'groq', model: 'qwen/qwen3.8-27b' })
  })

  it('keeps using the text models when no image is attached', async () => {
    providers.use({ openrouter: () => jsonResponse(503, {}), groq: () => completion(validAnalysis()) })
    const res = await analyze({ content: 'A long enough post to analyze.' }).expect(200)
    expect(providers.calls()[1].body).toMatchObject({ model: 'openai/gpt-oss-120b', reasoning_effort: 'low' })
    expect(typeof providers.calls()[1].body.messages[1].content).toBe('string')
    expect(res.body.data.analysis).not.toHaveProperty('imageText')
  })

  it('drops a quotation found in neither the text nor the image text', async () => {
    providers.use({
      openrouter: () =>
        completion(
          imageAnalysis({
            warningSigns: [{ indicator: 'emotional_language', evidence: 'You will be shocked by this', explanation: 'Plays on emotions.' }],
          }),
        ),
    })
    const res = await analyze({ images: [{ dataUrl: PNG_DATA_URL }] }).expect(200)
    expect(res.body.data.analysis.warningSigns).toEqual([])
    expect(res.body.data.analysis.assessment.category).toBe('NEEDS_FURTHER_VERIFICATION')
  })

  it('keeps links shown in the image and removes links the model invented', async () => {
    providers.use({
      openrouter: () =>
        completion(
          imageAnalysis({
            summary: {
              overview: 'The screenshot points readers to www.fake-alerts.example/now for details.',
              mainMessage: 'Check https://official-looking.example/verify for the truth.',
            },
          }),
        ),
    })
    const res = await analyze({ images: [{ dataUrl: PNG_DATA_URL }] }).expect(200)
    const { summary } = res.body.data.analysis
    expect(summary.overview).toContain('www.fake-alerts.example/now')
    expect(summary.mainMessage).not.toContain('official-looking.example')
  })

  it('returns empty image text when the model leaves it out', async () => {
    const { imageText: _omitted, ...withoutImageText } = imageAnalysis({ warningSigns: [] })
    providers.use({ openrouter: () => completion({ ...withoutImageText, assessment: { category: 'INSUFFICIENT_INFORMATION', explanation: 'The photo shows no text.' } }) })
    const res = await analyze({ images: [{ dataUrl: PNG_DATA_URL }] }).expect(200)
    expect(res.body.data.analysis.imageText).toBe('')
  })

  it('never logs image data', async () => {
    const lines = []
    const mock = createProviderMock()
    const loggingApp = createAiApp({ fetch: mock.fetch, logger: createLogger({ level: 'debug', write: (_level, line) => lines.push(line) }) })
    mock.use({ openrouter: () => jsonResponse(500, {}), groq: () => jsonResponse(500, {}) })
    await request(loggingApp).post(ANALYZE).set('Authorization', 'Bearer student-1').send({ images: [{ dataUrl: PNG_DATA_URL }] }).expect(503)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.join('\n')).not.toContain(PNG_DATA_URL.split(',')[1].slice(0, 16))
  })
})

describe('image validation', () => {
  const rejected = async (body) => {
    providers.use({ openrouter: () => completion(imageAnalysis()) })
    const res = await analyze(body).expect(400)
    expect(providers.calls()).toEqual([])
    return res.body.error.details
  }

  it.each([
    ['a GIF', 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', 'must be a JPG, PNG, or WebP image'],
    ['an HTML file', 'data:text/html;base64,PGgxPmhpPC9oMT4=', 'must be a JPG, PNG, or WebP image'],
    ['a plain link', 'https://example.org/photo.png', 'must be a JPG, PNG, or WebP image'],
    ['a PNG label on JPEG bytes', `data:image/png;base64,${JPEG_DATA_URL.split(',')[1]}`, 'is not a valid JPG, PNG, or WebP image'],
    ['broken base64', 'data:image/png;base64,iVBORw0KGgo=!!', 'must be a JPG, PNG, or WebP image'],
    ['an image over 1.5 MB', `data:image/png;base64,${'iVBORw0KGgo'.padEnd(2_100_000, 'A')}`, 'must be an image of at most 1.5 MB'],
  ])('rejects %s', async (_label, dataUrl, message) => {
    expect(await rejected({ images: [{ dataUrl }] })).toEqual([{ location: 'body', field: 'images.0.dataUrl', message }])
  })

  it('rejects more than three images', async () => {
    const images = Array.from({ length: 4 }, () => ({ dataUrl: PNG_DATA_URL }))
    expect(await rejected({ images })).toEqual([{ location: 'body', field: 'images', message: 'can include at most 3 images' }])
  })

  it('rejects unknown fields on an image', async () => {
    const details = await rejected({ images: [{ dataUrl: PNG_DATA_URL, name: 'screenshot.png' }] })
    expect(details[0].field).toBe('images.0')
  })

  it('still requires text when no image is attached', async () => {
    expect(await rejected({ content: '  ', images: [] })).toEqual([{ location: 'body', field: 'content', message: 'is required' }])
    expect(await rejected({ content: 'short' })).toEqual([{ location: 'body', field: 'content', message: 'must be at least 10 characters' }])
  })
})
