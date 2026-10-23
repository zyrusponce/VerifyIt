// Request schemas for every endpoint. Objects are strict: unknown fields (for example a client-sent
// `score`, `isCorrect`, `eligible`, or `user_id`) are rejected instead of silently ignored.
import { z } from 'zod'
import { VERDICTS } from '../data/investigations.js'
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
