import { z } from 'zod'
import { ID_PATTERN } from '../data/catalogChecks.js'

/** Catalog ids (lessons, categories, questions, cases, toolkit items) are lowercase slugs. */
export const slugId = z.string().regex(ID_PATTERN, 'must be a valid id')

export const uuid = z.uuid({ message: 'must be a UUID' })

export const confidenceRating = z.int().min(1, 'must be 1-5').max(5, 'must be 1-5')

export const optionIndex = z.int().min(0, 'must be 0 or more').max(9, 'is out of range')

export const limit = (fallback, max) => z.coerce.number().int().min(1).max(max).default(fallback)

// Control and invisible formatting characters (for example right-to-left overrides) are rejected so a
// printed certificate always shows exactly what the person typed.
const HIDDEN_CHARACTERS = /[\p{Cc}\p{Cf}]/u

export function normalizeName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

/** A display or recipient name: trimmed, single-spaced, 2-80 visible characters. */
export const personName = z
  .string({ message: 'must be text' })
  .max(200, 'must be at most 80 characters')
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(2, 'must be at least 2 characters')
      .max(80, 'must be at most 80 characters')
      .refine((value) => !HIDDEN_CHARACTERS.test(value), 'contains characters that cannot be printed'),
  )
