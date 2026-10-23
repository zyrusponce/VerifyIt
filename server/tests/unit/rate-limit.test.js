import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.js'
import { loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { TEST_ENV } from '../support/testApp.js'

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
})
