// Builds the real Express app on top of the real migrations (PGlite). Only token verification is
// replaced: tokens issued by signUp() map to users, every other token is rejected like Supabase would.
// AI provider calls go through `fetch`, which a test may replace with a mock.
import { createApp } from '../../src/app.js'
import { loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { unauthorized } from '../../src/utils/AppError.js'
import { createTestDatabase, createUser } from '../db/harness.js'
import { createPgliteRepositories } from './pgliteRepository.js'

export const TEST_ENV = {
  NODE_ENV: 'test',
  FRONTEND_URL: 'http://localhost:5173',
  PUBLIC_APP_URL: 'https://verifyit.test',
  SUPABASE_URL: 'https://project-ref.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key-not-a-real-secret',
  CERTIFICATE_TIMEZONE: 'Asia/Manila',
}

/**
 * @param {object} [overrides]
 * @param {Record<string, string>} [overrides.env] extra environment values (for example AI provider keys)
 * @param {typeof fetch} [overrides.fetch] replaces the fetch used to call AI providers
 */
export async function createTestContext({ env = {}, fetch } = {}) {
  const db = await createTestDatabase()
  const tokens = new Map()
  const auth = {
    async verifyToken(token) {
      const user = tokens.get(token)
      if (!user) throw unauthorized('INVALID_TOKEN', 'Your session has expired. Please sign in again.')
      return user
    },
  }
  const config = loadConfig({ ...TEST_ENV, ...env })
  const app = createApp({
    config,
    auth,
    repositories: createPgliteRepositories(db),
    logger: createLogger({ level: 'silent' }),
    options: { rateLimit: { enabled: false }, fetch },
  })

  async function signUp(displayName) {
    const id = await createUser(db, { displayName })
    const token = `test-token-${id}`
    tokens.set(token, { id, email: `${id}@example.test` })
    return { id, token, headers: { Authorization: `Bearer ${token}` } }
  }

  return { db, app, config, signUp, revokeToken: (token) => tokens.delete(token) }
}
