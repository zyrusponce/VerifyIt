/*
  ⚡ LAYER: Controller (application assembly)
  🔒 SECURITY: Helmet headers; CORS limited to FRONTEND_URL origins; 32 KB JSON body limit; per-IP
     rate limits; every user route authenticated through Supabase Auth; consistent JSON responses.
  🚨 ERROR HANDLING: Unknown routes → 404 ROUTE_NOT_FOUND; all thrown/rejected errors reach the global
     error handler, which maps them to explicit status codes and logs them with the request id.
*/
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { requestContext } from './middleware/requestContext.js'
import { createAuthenticate } from './middleware/authenticate.js'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createRateLimiters } from './middleware/rateLimits.js'
import { createHealthRouter } from './routes/health.routes.js'
import { createProfileRouter } from './routes/profile.routes.js'
import { createLessonsRouter } from './routes/lessons.routes.js'
import { createQuizzesRouter } from './routes/quizzes.routes.js'
import { createInvestigationsRouter } from './routes/investigations.routes.js'
import { createToolkitRouter } from './routes/toolkit.routes.js'
import { createDashboardRouter } from './routes/dashboard.routes.js'
import { createCertificatesRouter } from './routes/certificates.routes.js'

export const API_PREFIX = '/api/v1'

/**
 * @param {object} deps
 * @param {ReturnType<import('./config/env.js').loadConfig>} deps.config
 * @param {{ verifyToken(token: string): Promise<{ id: string, email: string | null }> }} deps.auth
 * @param {{ forUser(token: string, userId: string): object, public(): object }} deps.repositories
 * @param {ReturnType<import('./utils/logger.js').createLogger>} deps.logger
 * @param {{ rateLimit?: { enabled?: boolean } }} [deps.options]
 */
export function createApp({ config, auth, repositories, logger, options = {} }) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)

  app.use(requestContext(logger))
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // Requests without an Origin header (curl, health checks, same-origin) are not cross-site.
        callback(null, !origin || config.corsOrigins.includes(origin))
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
      exposedHeaders: ['Content-Disposition', 'X-Request-Id', 'RateLimit', 'RateLimit-Policy', 'Retry-After'],
      maxAge: 600,
    }),
  )
  app.use(express.json({ limit: '32kb', strict: true }))

  const limiters = createRateLimiters(options.rateLimit)
  const deps = {
    config,
    logger,
    limiters,
    repositories,
    authenticate: createAuthenticate({ auth, repositories }),
  }

  const api = express.Router()
  api.use(limiters.api)
  api.use(createHealthRouter())
  api.use(createProfileRouter(deps))
  api.use(createLessonsRouter(deps))
  api.use(createQuizzesRouter(deps))
  api.use(createInvestigationsRouter(deps))
  api.use(createToolkitRouter(deps))
  api.use(createDashboardRouter(deps))
  api.use(createCertificatesRouter(deps))
  app.use(API_PREFIX, api)

  app.use(notFoundHandler)
  app.use(createErrorHandler({ logger }))
  return app
}
