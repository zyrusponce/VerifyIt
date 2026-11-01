import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.js'
import { loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { TEST_ENV } from '../support/testApp.js'
import { AI_ENV, ARTICLE, completion, createProviderMock, validAnalysis } from '../support/aiFixtures.js'

/** The real app with real limits; each bearer token is accepted as its own user. */
function createAiApp() {
  const providers = createProviderMock()
  providers.use({ openrouter: () => completion(validAnalysis()) })
  const app = createApp({
    config: loadConfig({ ...TEST_ENV, ...AI_ENV }),
    auth: { verifyToken: async (token) => ({ id: `user-${token}`, email: null }) },
    repositories: { forUser: () => ({}), public: () => ({}) },
    logger: createLogger({ level: 'silent' }),
    options: { fetch: providers.fetch },
  })
  return { app, providers }
}

describe('rate limiting', () => {
  it('answers with 429 RATE_LIMITED once the public verification limit is exceeded', async () => {
    const app = createApp({
      config: loadConfig(TEST_ENV),
      auth: { verifyToken: async () => ({ id: 'unused', email: null }) },
      repositories: { forUser: () => ({}), public: () => ({ verifyCertificate: async () => null }) },
      logger: createLogger({ level: 'silent' }),
    })
    const statuses = []
    for (let i = 0; i < 61; i += 1) {
      statuses.push((await request(app).get('/api/v1/certificates/verify/VIT-0000-0000-0000-0000')).status)
    }
    expect(statuses.slice(0, 60).every((status) => status === 404)).toBe(true)
    const limited = await request(app).get('/api/v1/certificates/verify/VIT-0000-0000-0000-0000')
    expect(limited.status).toBe(429)
    expect(limited.body.error.code).toBe('RATE_LIMITED')
    expect(limited.headers['retry-after']).toBeDefined()
  })

  it('limits AI analysis to 15 requests per signed-in user, independently for each student on one IP', async () => {
    const { app, providers } = createAiApp()
    const analyze = (token) => request(app).post('/api/v1/ai/analyze').set('Authorization', `Bearer ${token}`).send({ content: ARTICLE })
    for (let i = 0; i < 15; i += 1) await analyze('student-a').expect(200)

    const limited = await analyze('student-a')
    expect(limited.status).toBe(429)
    expect(limited.body.error.code).toBe('RATE_LIMITED')
    expect(limited.headers['retry-after']).toBeDefined()
    // A limited request never reaches the AI provider.
    expect(providers.calls()).toHaveLength(15)
    // A classmate behind the same campus IP still has their own budget.
    await analyze('student-b').expect(200)
  })

  it('limits AI analysis to 100 requests per IP before the sign-in check', async () => {
    const { app, providers } = createAiApp()
    const statuses = []
    for (let i = 0; i < 100; i += 1) {
      statuses.push((await request(app).post('/api/v1/ai/analyze').send({ content: ARTICLE })).status)
    }
    expect(statuses.every((status) => status === 401)).toBe(true)
    const limited = await request(app).post('/api/v1/ai/analyze').set('Authorization', 'Bearer student-c').send({ content: ARTICLE })
    expect(limited.status).toBe(429)
    expect(limited.body.error.code).toBe('RATE_LIMITED')
    expect(providers.calls()).toEqual([])
  })
})
