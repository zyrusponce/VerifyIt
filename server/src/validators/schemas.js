// Request schemas for every endpoint. Objects are strict: unknown fields (for example a client-sent
// `score`, `isCorrect`, `eligible`, or `user_id`) are rejected instead of silently ignored.
import { z } from 'zod'
import { VERDICTS } from '../data/investigations.js'
import {
  AI_CONTENT_MAX_LENGTH,
  AI_CONTENT_MIN_LENGTH,
  AI_IMAGE_MAX_BYTES,
  AI_MAX_IMAGES,
  AI_SOURCE_URL_MAX_LENGTH,
} from '../services/aiAnalysis.service.js'
import { confidenceRating, limit, optionIndex, personName, slugId, uuid } from './common.js'

export const profileSchemas = {
  update: { body: z.strictObject({ displayName: personName }) },
}

export const lessonSchemas = {
  complete: {
    params: z.strictObject({ lessonId: slugId }),
    body: z.strictObject({ completed: z.literal(true, { message: 'must be true' }) }),
  },
}

const categoryParams = z.strictObject({ category: slugId })

export const quizSchemas = {
  questions: { params: categoryParams },
  check: {
    params: categoryParams,
    body: z.strictObject({ questionId: slugId, selectedAnswer: optionIndex }),
  },
  submit: {
    params: categoryParams,
    body: z.strictObject({
      clientAttemptId: uuid.optional(),
      answers: z
        .array(
          z.strictObject({
            questionId: slugId,
            selectedAnswer: optionIndex,
            confidenceRating: confidenceRating.nullable().optional(),
          }),
        )
        .min(1, 'must include at least one answer')
        .max(100, 'has too many answers'),
    }),
  },
  listAttempts: {
    query: z.strictObject({ category: slugId.optional(), limit: limit(20, 100) }),
  },
  getAttempt: { params: z.strictObject({ attemptId: uuid }) },
}

const verdict = z.enum(VERDICTS, { message: `must be one of: ${VERDICTS.join(', ')}` })
const caseParams = z.strictObject({ caseId: slugId })

export const investigationSchemas = {
  check: { params: caseParams, body: z.strictObject({ verdict }) },
  submit: {
    params: caseParams,
    body: z.strictObject({
      verdict,
      confidenceRating: confidenceRating.nullable().optional(),
      clientAttemptId: uuid.optional(),
    }),
  },
  listAttempts: {
    query: z.strictObject({ caseId: slugId.optional(), limit: limit(20, 100) }),
  },
}

export const toolkitSchemas = {
  save: {
    body: z.strictObject({
      items: z
        .array(z.strictObject({ itemId: slugId, checked: z.boolean() }))
        .min(1, 'must include at least one item')
        .max(50, 'has too many items'),
      // true when importing guest progress: existing account values are never overwritten.
      keepExisting: z.boolean().default(false),
    }),
  },
}

// Pasted articles keep their tabs and line breaks; any other control character is rejected.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/

// Optional here: the minimum length applies only when no image is attached (checked on the whole body below).
const analysisContent = z
  .string({ error: 'must be text' })
  .trim()
  .max(AI_CONTENT_MAX_LENGTH, `must be at most ${AI_CONTENT_MAX_LENGTH.toLocaleString('en-US')} characters`)
  .refine((value) => !CONTROL_CHARACTERS.test(value), 'contains control characters that are not allowed')
  .optional()
  .transform((value) => value ?? '')

const httpLink = z
  .url({ protocol: /^https?$/, message: 'must be an http(s) link' })
  .max(AI_SOURCE_URL_MAX_LENGTH, `must be at most ${AI_SOURCE_URL_MAX_LENGTH} characters`)

// Optional: an empty string or null means "no link". The analysis shows the link to the AI as text only; reading
// the page is a separate request (extractLink) whose text the student reviews before analyzing it.
const sourceUrl = z
  .union([z.string(), z.null()], { error: 'must be a link or null' })
  .optional()
  .transform((value) => value?.trim() || null)
  .pipe(httpLink.nullable())

// Attached images arrive as base64 data URLs. The declared type must match the file's own header bytes, so
// nothing other than a real JPG, PNG, or WebP image is passed on to the AI provider.
const IMAGE_DATA_URL = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/
const IMAGE_SIGNATURES = {
  'image/jpeg': (head) => head.startsWith('\xFF\xD8\xFF'),
  'image/png': (head) => head.startsWith('\x89PNG\r\n\x1A\n'),
  'image/webp': (head) => head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP',
}
const IMAGE_DATA_URL_MAX_LENGTH = Math.ceil(AI_IMAGE_MAX_BYTES / 3) * 4 + 32
const IMAGE_MAX_SIZE_TEXT = `${(AI_IMAGE_MAX_BYTES / 1_000_000).toLocaleString('en-US')} MB`

const imageDataUrl = z
  .string({ error: 'must be an image data URL' })
  .max(IMAGE_DATA_URL_MAX_LENGTH, { message: `must be an image of at most ${IMAGE_MAX_SIZE_TEXT}`, abort: true })
  .superRefine((value, ctx) => {
    const [, type, data] = IMAGE_DATA_URL.exec(value) ?? []
    if (!type || !IMAGE_SIGNATURES[type] || data.length % 4 !== 0) {
      ctx.addIssue({ code: 'custom', message: 'must be a JPG, PNG, or WebP image' })
      return
    }
    const bytes = (data.length / 4) * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0)
    if (bytes > AI_IMAGE_MAX_BYTES) ctx.addIssue({ code: 'custom', message: `must be an image of at most ${IMAGE_MAX_SIZE_TEXT}` })
    else if (!IMAGE_SIGNATURES[type](atob(data.slice(0, 16)))) ctx.addIssue({ code: 'custom', message: 'is not a valid JPG, PNG, or WebP image' })
  })

const analyzeBody = z
  .strictObject({
    content: analysisContent,
    sourceUrl,
    images: z
      .array(z.strictObject({ dataUrl: imageDataUrl }), { error: 'must be a list of images' })
      .max(AI_MAX_IMAGES, `can include at most ${AI_MAX_IMAGES} images`)
      .optional()
      .transform((value) => value ?? []),
  })
  .superRefine((body, ctx) => {
    // With an image attached the text is optional (the image is the content); without one it must say something.
    if (body.images.length > 0) return
    if (!body.content) ctx.addIssue({ code: 'custom', path: ['content'], message: 'is required' })
    else if (body.content.length < AI_CONTENT_MIN_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['content'], message: `must be at least ${AI_CONTENT_MIN_LENGTH} characters` })
    }
  })

// Claims and search phrases taken from an analysis, for "What Other Sources Say".
const claimText = z
  .string({ error: 'must be text' })
  .trim()
  .min(3, 'must be at least 3 characters')
  .max(500, 'must be at most 500 characters')
  .refine((value) => !CONTROL_CHARACTERS.test(value), 'contains control characters that are not allowed')

export const aiSchemas = {
  analyze: { body: analyzeBody },
  checkSources: {
    body: z.strictObject({
      claims: z.array(claimText, { error: 'must be a list of claims' }).min(1, 'must include at least one claim').max(5, 'can include at most 5 claims'),
      queries: z
        .array(claimText.pipe(z.string().max(120, 'must be at most 120 characters')), { error: 'must be a list of search phrases' })
        .max(3, 'can include at most 3 search phrases')
        .optional()
        .transform((value) => value ?? []),
      // The page the student is checking: results from the same website are not independent, so they are left out.
      sourceUrl,
    }),
  },
  extractLink: {
    body: z.strictObject({
      url: z.string({ error: (issue) => (issue.input === undefined ? 'is required' : 'must be a link') }).trim().pipe(httpLink),
    }),
  },
}

export const certificateSchemas = {
  issue: { body: z.strictObject({ recipientName: personName.optional() }) },
  pdf: { params: z.strictObject({ id: uuid }) },
  verify: {
    params: z.strictObject({
      certificateNumber: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/, 'is not a valid certificate number'),
    }),
  },
}
