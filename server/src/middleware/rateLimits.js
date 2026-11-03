// Per-IP rate limits. Tighter limits protect the public answer-check, verification, and issuance endpoints.
// Limits are sized for a classroom: many students often share one campus IP address (NAT). Behind a
// reverse proxy, set TRUST_PROXY so each client's real IP is used. AI analysis is also limited per signed-in
// user, because every request spends the shared AI provider quota.
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import { AppError } from '../utils/AppError.js'

const MINUTE = 60 * 1000

const POLICIES = {
  api: { windowMs: 15 * MINUTE, limit: 6000 },
  answerCheck: { windowMs: MINUTE, limit: 600 },
  submissions: { windowMs: 15 * MINUTE, limit: 1500 },
  certificateIssue: { windowMs: 60 * MINUTE, limit: 100 },
  certificatePdf: { windowMs: 15 * MINUTE, limit: 300 },
  verification: { windowMs: MINUTE, limit: 60 },
  aiAnalysis: { windowMs: 15 * MINUTE, limit: 100 },
  // Mounted after authenticate, so each student has their own budget even behind a shared campus IP.
  aiAnalysisUser: { windowMs: 15 * MINUTE, limit: 15, keyGenerator: userKey },
  // Reading a link costs no AI quota but makes outgoing requests, so it has its own (looser) budget.
  linkReader: { windowMs: 15 * MINUTE, limit: 100 },
  linkReaderUser: { windowMs: 15 * MINUTE, limit: 30, keyGenerator: userKey },
  // Checking other sources runs one fact-check search and, when something is found, one AI request.
  sourceCheck: { windowMs: 15 * MINUTE, limit: 100 },
  sourceCheckUser: { windowMs: 15 * MINUTE, limit: 15, keyGenerator: userKey },
}

const passThrough = (_req, _res, next) => next()

/**
 * Who a request counts against. Cloudflare Workers does not expose the client address as `req.ip`, so the
 * limiter would crash on every request there; Cloudflare always sets `CF-Connecting-IP` itself (a client cannot
 * forge it), so prefer that, then `req.ip` (local server, other hosts), then one shared bucket. An IPv6 client
 * controls a whole network of addresses, so ipKeyGenerator counts the network, not the address.
 */
export function clientKey(req) {
  const cloudflareIp = req.headers?.['cf-connecting-ip']
  const address = (typeof cloudflareIp === 'string' && cloudflareIp.trim()) || req.ip
  return address ? ipKeyGenerator(address) : 'unknown-client'
}

/** The verified user id set by authenticate; the client address if the limiter ever runs before it. */
export function userKey(req) {
  const userId = req.auth?.userId
  return typeof userId === 'string' && userId ? `user:${userId}` : clientKey(req)
}

/** `enabled: false` (tests only) disables limiting. A policy may set its own keyGenerator (default: clientKey). */
export function createRateLimiters({ enabled = true } = {}) {
  return Object.fromEntries(
    Object.entries(POLICIES).map(([name, { keyGenerator = clientKey, ...policy }]) => [
      name,
      enabled
        ? rateLimit({
            ...policy,
            standardHeaders: 'draft-8',
            legacyHeaders: false,
            keyGenerator,
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
