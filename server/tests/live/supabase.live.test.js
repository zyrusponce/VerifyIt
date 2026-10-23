// OPTIONAL end-to-end checks against a real Supabase project. Skipped unless these are set
// (use a test project or dedicated test accounts; the run writes progress rows for both users):
//   LIVE_SUPABASE_URL, LIVE_SUPABASE_ANON_KEY,
//   LIVE_USER_A_EMAIL, LIVE_USER_A_PASSWORD, LIVE_USER_B_EMAIL, LIVE_USER_B_PASSWORD
// Run with: npm run test:live --prefix server
import request from 'supertest'
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app.js'
import { loadConfig } from '../../src/config/env.js'
import { createSupabaseGateway } from '../../src/config/supabase.js'
import { createLogger } from '../../src/utils/logger.js'
import { topicAnswers } from '../support/fixtures.js'

const env = process.env
const configured = ['LIVE_SUPABASE_URL', 'LIVE_SUPABASE_ANON_KEY', 'LIVE_USER_A_EMAIL', 'LIVE_USER_A_PASSWORD', 'LIVE_USER_B_EMAIL', 'LIVE_USER_B_PASSWORD'].every(
  (name) => Boolean(env[name]),
)

describe.skipIf(!configured)('live Supabase project', () => {
  let app
  let userA
  let userB

  async function signIn(email, password) {
    const client = createClient(env.LIVE_SUPABASE_URL, env.LIVE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw new Error(`Could not sign in ${email}: ${error.message}`)
    return { client, id: data.user.id, headers: { Authorization: `Bearer ${data.session.access_token}` } }
  }

  beforeAll(async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      FRONTEND_URL: 'http://localhost:5173',
      PUBLIC_APP_URL: 'http://localhost:5173',
      SUPABASE_URL: env.LIVE_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.LIVE_SUPABASE_ANON_KEY,
    })
    const { auth, repositories } = createSupabaseGateway(config)
    app = createApp({ config, auth, repositories, logger: createLogger({ level: 'warn' }), options: { rateLimit: { enabled: false } } })
    userA = await signIn(env.LIVE_USER_A_EMAIL, env.LIVE_USER_A_PASSWORD)
    userB = await signIn(env.LIVE_USER_B_EMAIL, env.LIVE_USER_B_PASSWORD)
  })

  it('verifies real tokens and rejects forged ones', async () => {
    const me = await request(app).get('/api/v1/me').set(userA.headers).expect(200)
    expect(me.body.data.id).toBe(userA.id)
    await request(app).get('/api/v1/me').set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.forged').expect(401)
  })

  it('persists progress and scores attempts in the database', async () => {
    await request(app).put('/api/v1/lessons/progress/what-is-misinformation').set(userA.headers).send({ completed: true }).expect((res) => {
      expect([200, 201]).toContain(res.status)
    })
    const attempt = await request(app).post('/api/v1/quizzes/deepfakes/attempts').set(userA.headers).send({ answers: topicAnswers('deepfakes', 7) }).expect(201)
    expect(attempt.body.data).toMatchObject({ score: 7, totalQuestions: 10 })
    const stolen = await request(app).get(`/api/v1/quizzes/attempts/${attempt.body.data.id}`).set(userB.headers)
    expect(stolen.status).toBe(404)
  })

  it('enforces RLS for direct Data API access with the public anon key', async () => {
    const { error: insertError } = await userA.client
      .from('quiz_attempts')
      .insert({ user_id: userA.id, category: 'deepfakes', score: 10, total_questions: 10 })
    expect(insertError).not.toBeNull()
    const { data: othersRows } = await userB.client.from('quiz_attempts').select('id').eq('user_id', userA.id)
    expect(othersRows).toEqual([])
    const { error: catalogError } = await userA.client.schema('private').from('quiz_questions').select('*')
    expect(catalogError).not.toBeNull()
  })

  it('verifies certificate numbers publicly', async () => {
    await request(app).get('/api/v1/certificates/verify/VIT-0000-0000-0000-0000').expect(404)
  })
})
