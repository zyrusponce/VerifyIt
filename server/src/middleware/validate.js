// Validates params, query, and body with Zod before a handler runs. Parsed values go to req.valid
// (Express 5 makes req.query read-only), so handlers only ever see validated, normalized input.
import { badRequest } from '../utils/AppError.js'

const PARTS = ['params', 'query', 'body']

export function validate(schemas) {
  return function validateRequest(req, _res, next) {
    req.valid ??= {}
    for (const part of PARTS) {
      const schema = schemas[part]
      if (!schema) continue
      const result = schema.safeParse(req[part] ?? (part === 'body' ? undefined : {}))
      if (!result.success) {
        throw badRequest('VALIDATION_FAILED', 'Some of the information sent is invalid.', {
          details: result.error.issues.map((issue) => ({
            location: part,
            field: issue.path.join('.') || null,
            message: issue.message,
          })),
        })
      }
      req.valid[part] = result.data
    }
    next()
  }
}
