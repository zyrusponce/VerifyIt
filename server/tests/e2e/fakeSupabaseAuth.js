// TEST-ONLY stand-in for the parts of Supabase Auth (GoTrue) that VerifyIT uses, so the browser tests can
// sign up, sign in, and sign out without a real Supabase project. Users are written to the PGlite
// auth.users table, which fires the real profile trigger. Never use this outside automated tests.
import { randomBytes, randomUUID } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import { unauthorized } from '../../src/utils/AppError.js'

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export function createFakeSupabaseAuth({ db }) {
  const usersByEmail = new Map()
  const accessTokens = new Map()
  const refreshTokens = new Map()

  const publicUser = (user) => ({
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: user.createdAt,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: user.metadata,
    identities: [],
    created_at: user.createdAt,
    updated_at: user.createdAt,
  })

  function issueSession(user) {
    const now = Math.floor(Date.now() / 1000)
    const payload = { sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600, session_id: randomUUID() }
    const accessToken = `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.${randomBytes(16).toString('base64url')}`
    const refreshToken = randomBytes(24).toString('hex')
    accessTokens.set(accessToken, user)
    refreshTokens.set(refreshToken, user)
    return { access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: refreshToken, user: publicUser(user) }
  }

  const bearer = (req) => /^Bearer (.+)$/.exec(req.get('authorization') ?? '')?.[1]

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.post('/auth/v1/signup', async (req, res) => {
    const { email, password, data } = req.body ?? {}
    if (!email || !password) return res.status(400).json({ code: 'validation_failed', msg: 'Email and password are required' })
    if (usersByEmail.has(email)) return res.status(422).json({ code: 'user_already_exists', msg: 'User already registered' })
    const user = { id: randomUUID(), email, password, metadata: data ?? {}, createdAt: new Date().toISOString() }
    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [user.id, email, user.metadata])
    usersByEmail.set(email, user)
    return res.status(200).json(issueSession(user))
  })

  app.post('/auth/v1/token', (req, res) => {
    if (req.query.grant_type === 'password') {
      const user = usersByEmail.get(req.body?.email)
      if (!user || user.password !== req.body?.password) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid login credentials' })
      }
      return res.status(200).json(issueSession(user))
    }
    if (req.query.grant_type === 'refresh_token') {
      const user = refreshTokens.get(req.body?.refresh_token)
      if (!user) return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid Refresh Token' })
      refreshTokens.delete(req.body.refresh_token)
      return res.status(200).json(issueSession(user))
    }
    return res.status(400).json({ error: 'unsupported_grant_type' })
  })

  app.get('/auth/v1/user', (req, res) => {
    const user = accessTokens.get(bearer(req))
    if (!user) return res.status(401).json({ code: 'bad_jwt', msg: 'invalid JWT' })
    return res.status(200).json(publicUser(user))
  })

  app.put('/auth/v1/user', (req, res) => {
    const user = accessTokens.get(bearer(req))
    if (!user) return res.status(401).json({ code: 'bad_jwt', msg: 'invalid JWT' })
    if (req.body?.password) user.password = req.body.password
    return res.status(200).json(publicUser(user))
  })

  app.post('/auth/v1/logout', (req, res) => {
    accessTokens.delete(bearer(req))
    return res.status(204).end()
  })

  app.post('/auth/v1/recover', (_req, res) => res.status(200).json({}))

  return {
    app,
    // Used by the API under test in place of Supabase's auth.getUser().
    verifier: {
      async verifyToken(token) {
        const user = accessTokens.get(token)
        if (!user) throw unauthorized('INVALID_TOKEN', 'Your session has expired. Please sign in again.')
        return { id: user.id, email: user.email }
      },
    },
  }
}
