/*
  ⚡ LAYER: Controller → aiAnalysis.service → aiProviders.service (OpenRouter, then Groq; no database)
                       → linkReader.service (reads a public web page's text for the student to review)
                       → sourceCheck.service (published fact-checks for an analysis's claims)
  🔒 SECURITY: Bearer token required. Rate-limited per IP before sign-in is checked and per user after.
     Analysis: strict body with content (10-6,000 characters, optional when an image is attached), an optional
     http(s) source link, and up to 3 JPG/PNG/WebP images. Its larger body (images) is read only after sign-in
     is checked; every other route keeps the 32 KB limit. Link reading refuses private networks (see the
     service). Nothing submitted is stored or logged, responses are marked no-store, and provider API keys stay
     on the server.
  🚨 ERROR HANDLING: 400 invalid content/link/images or unknown fields; 401 auth; 413 body too large; 429 rate
     limit; 503 AI_NOT_CONFIGURED (no provider key) or AI_UNAVAILABLE (every provider failed); link reading
     422/502/503/504 with LINK_* codes and a message safe to show; source checking 503 FACT_CHECK_NOT_CONFIGURED
     or FACT_CHECK_UNAVAILABLE.
*/
import express, { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { aiSchemas } from '../validators/schemas.js'
import { analyzeContent } from '../services/aiAnalysis.service.js'
import { checkSources } from '../services/sourceCheck.service.js'

export const AI_ANALYZE_PATH = '/ai/analyze'
// Three images of at most 1.5 MB, base64-encoded, plus the text.
const AI_ANALYZE_BODY_LIMIT = '7mb'

export function createAiRouter({ authenticate, limiters, ai, linkReader, factChecker, newsSearcher }) {
  const router = Router()

  router.post(
    AI_ANALYZE_PATH,
    limiters.aiAnalysis,
    authenticate,
    limiters.aiAnalysisUser,
    express.json({ limit: AI_ANALYZE_BODY_LIMIT, strict: true }),
    validate(aiSchemas.analyze),
    async (req, res) => {
      res.set('Cache-Control', 'no-store')
      res.status(200).json({ data: await analyzeContent(ai, req.valid.body, { requestId: req.id }) })
    },
  )

  router.post(
    '/ai/extract-link',
    limiters.linkReader,
    authenticate,
    limiters.linkReaderUser,
    validate(aiSchemas.extractLink),
    async (req, res) => {
      res.set('Cache-Control', 'no-store')
      res.status(200).json({ data: await linkReader.read(req.valid.body.url, { requestId: req.id }) })
    },
  )

  router.post(
    '/ai/check-sources',
    limiters.sourceCheck,
    authenticate,
    limiters.sourceCheckUser,
    validate(aiSchemas.checkSources),
    async (req, res) => {
      res.set('Cache-Control', 'no-store')
      res.status(200).json({ data: await checkSources({ ai, factChecker, newsSearcher }, req.valid.body, { requestId: req.id }) })
    },
  )

  return router
}
