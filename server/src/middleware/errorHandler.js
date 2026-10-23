/*
  ⚡ LAYER: Controller middleware (global error handler)
  🔒 SECURITY: Responses never include stack traces, SQL, tokens, or internal causes. Unexpected
     errors return a generic message; details are logged with the request id for correlation.
  🚨 ERROR HANDLING: AppError → its explicit status; body-parser errors → 400/413/415;
     anything unexpected → 500 INTERNAL_ERROR (logged with full context).
*/
import { AppError } from '../utils/AppError.js'

function normalize(error) {
  if (error instanceof AppError) return error
  switch (error?.type) {
    case 'entity.too.large':
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.')
    case 'entity.parse.failed':
      return new AppError(400, 'INVALID_JSON', 'The request body is not valid JSON.')
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new AppError(415, 'UNSUPPORTED_ENCODING', 'The request body encoding is not supported.')
    default:
      if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 && error.expose) {
        return new AppError(400, 'BAD_REQUEST', 'The request could not be processed.')
      }
      return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.')
  }
}

export function createErrorHandler({ logger }) {
  // Express recognizes error handlers by their four parameters.
  // eslint-disable-next-line no-unused-vars
  return function errorHandler(error, req, res, next) {
    const appError = normalize(error)
    const context = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl?.split('?')[0],
      status: appError.status,
      code: appError.code,
      userId: req.auth?.userId ?? null,
    }

    if (appError.status >= 500) logger.error('request failed', { ...context, error })
    else logger.warn('request rejected', { ...context, reason: appError.message, cause: appError.cause })

    if (res.headersSent) {
      // The response already started (for example a stream); end it rather than sending a second body.
      res.end()
      return
    }

    const body = { error: { code: appError.code, message: appError.message, requestId: req.id } }
    if (appError.details !== undefined && appError.status < 500) body.error.details = appError.details
    res.status(appError.status).json(body)
  }
}

export function notFoundHandler(req) {
  throw new AppError(404, 'ROUTE_NOT_FOUND', `No API route matches ${req.method} ${req.path}.`)
}
