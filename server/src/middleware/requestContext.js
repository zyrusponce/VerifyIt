// Gives every request an id (echoed in X-Request-Id and in error bodies) and logs one structured
// line when it finishes. Only the path is logged: query strings and headers can carry secrets.
import { randomUUID } from 'node:crypto'

const SAFE_REQUEST_ID = /^[A-Za-z0-9-]{8,64}$/

export function requestContext(logger) {
  return function attachRequestContext(req, res, next) {
    const incoming = req.get('x-request-id')
    req.id = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID()
    res.set('X-Request-Id', req.id)
    const started = process.hrtime.bigint()
    res.on('finish', () => {
      logger.info('request completed', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n),
        userId: req.auth?.userId ?? null,
      })
    })
    next()
  }
}
