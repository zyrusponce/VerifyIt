// Per-IP rate limits. Tighter limits protect the public answer-check, verification, and issuance endpoints.
// Limits are sized for a classroom: many students often share one campus IP address (NAT). Behind a
// reverse proxy, set TRUST_PROXY so each client's real IP is used.
import { rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/AppError.js'

const MINUTE = 60 * 1000

const POLICIES = {
  api: { windowMs: 15 * MINUTE, limit: 6000 },
  answerCheck: { windowMs: MINUTE, limit: 600 },
  submissions: { windowMs: 15 * MINUTE, limit: 1500 },
  certificateIssue: { windowMs: 60 * MINUTE, limit: 100 },
  certificatePdf: { windowMs: 15 * MINUTE, limit: 300 },
  verification: { windowMs: MINUTE, limit: 60 },
}

const passThrough = (_req, _res, next) => next()

/**
 * Who a request counts against. Cloudflare Workers does not expose the client address as `req.ip`, so the
 * limiter would crash on every request there; Cloudflare always sets `CF-Connecting-IP` itself (a client cannot
 * forge it), so prefer that, then `req.ip` (local server, other hosts), then one shared bucket.
 */
export function clientKey(req) {
  const cloudflareIp = req.headers?.['cf-connecting-ip']
  return (typeof cloudflareIp === 'string' && cloudflareIp.trim()) || req.ip || 'unknown-client'
}

/** `enabled: false` (tests only) disables limiting. */
export function createRateLimiters({ enabled = true } = {}) {
  return Object.fromEntries(
    Object.entries(POLICIES).map(([name, policy]) => [
      name,
      enabled
        ? rateLimit({
            ...policy,
            standardHeaders: 'draft-8',
            legacyHeaders: false,
            keyGenerator: clientKey,
            // The key above already handles proxies, so the library's req.ip / X-Forwarded-For checks do not apply.
            validate: { ip: false, trustProxy: false, xForwardedForHeader: false, forwardedHeader: false },
            handler: (_req, _res, next) => {
              next(new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait a moment and try again.'))
            },
          })
        : passThrough,
    ]),
  )
}
