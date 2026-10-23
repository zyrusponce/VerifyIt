/**
 * An error with an explicit HTTP status and a stable, machine-readable code.
 * `message` is safe to show to users. Internal context goes in `cause`, which is logged but never sent.
 */
export class AppError extends Error {
  constructor(status, code, message, { details, cause } = {}) {
    super(message, cause ? { cause } : undefined)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (code, message, options) => new AppError(400, code, message, options)
export const unauthorized = (code, message, options) => new AppError(401, code, message, options)
export const forbidden = (code, message, options) => new AppError(403, code, message, options)
export const notFound = (code, message, options) => new AppError(404, code, message, options)
export const conflict = (code, message, options) => new AppError(409, code, message, options)
export const gone = (code, message, options) => new AppError(410, code, message, options)
export const unprocessable = (code, message, options) => new AppError(422, code, message, options)
export const serviceUnavailable = (code, message, options) => new AppError(503, code, message, options)
