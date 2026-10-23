import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestContext } from '../support/testApp.js'
import { API, completeLessons } from '../support/fixtures.js'
import { REQUIRED_LESSON_IDS, lessons } from '../../src/data/lessons.js'

let ctx

beforeAll(async () => {
  ctx = await createTestContext()
})

const PROTECTED_ROUTES = [
  ['get', '/me'],
  ['patch', '/me'],
  ['get', '/lessons/progress'],
  ['put', `/lessons/progress/${REQUIRED_LESSON_IDS[0]}`],
  ['get', '/quizzes/attempts'],
  ['get', '/quizzes/attempts/6f1c2b4e-7f5d-4a3e-9b2a-0c1d2e3f4a5b'],
  ['post', '/quizzes/deepfakes/attempts'],
  ['get', '/investigations/progress'],
  ['get', '/investigations/attempts'],
  ['post', '/investigations/flood-photo/attempts'],
  ['get', '/toolkit/progress'],
  ['put', '/toolkit/progress'],
  ['get', '/dashboard'],
  ['get', '/certificates/eligibility'],
  ['post', '/certificates/issue'],
  ['get', '/certificates/my'],
  ['get', '/certificates/6f1c2b4e-7f5d-4a3e-9b2a-0c1d2e3f4a5b/pdf'],
]

describe('authentication', () => {
  it.each(PROTECTED_ROUTES)('%s %s rejects requests without a token', async (method, path) => {
    const res = await request(ctx.app)[method](`${API}${path}`).send({})
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('AUTH_REQUIRED')
  })

  it.each(PROTECTED_ROUTES)('%s %s rejects invalid tokens', async (method, path) => {
    const res = await request(ctx.app)[method](`${API}${path}`).set('Authorization', 'Bearer not.a.valid-token').send({})
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('INVALID_TOKEN')
  })

  it('rejects malformed Authorization headers', async () => {
    for (const header of ['Basic abc', 'Bearer', 'Bearer two words', `Bearer ${'a'.repeat(9000)}`]) {
      const res = await request(ctx.app).get(`${API}/me`).set('Authorization', header)
      expect(res.status, header.slice(0, 20)).toBe(401)
    }
  })

  it('rejects a token after it is revoked', async () => {
    const user = await ctx.signUp('Revoked User')
    await request(ctx.app).get(`${API}/me`).set(user.headers).expect(200)
    ctx.revokeToken(user.token)
    await request(ctx.app).get(`${API}/me`).set(user.headers).expect(401)
  })

  it('keeps the health check public and minimal', async () => {
    const res = await request(ctx.app).get(`${API}/health`).expect(200)
    expect(res.body).toEqual({ data: { status: 'ok' } })
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(ctx.app).get(`${API}/does-not-exist`).expect(404)
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND')
  })
})

describe('security headers, CORS, and body limits', () => {
  it('sets Helmet headers and hides the framework', async () => {
    const res = await request(ctx.app).get(`${API}/health`)
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })

  it('allows only configured origins', async () => {
    const allowed = await request(ctx.app).get(`${API}/health`).set('Origin', 'http://localhost:5173')
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const blocked = await request(ctx.app).get(`${API}/health`).set('Origin', 'https://attacker.example')
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('rejects oversized and malformed JSON bodies', async () => {
    const user = await ctx.signUp('Body Limits')
    const big = await request(ctx.app).patch(`${API}/me`).set(user.headers).send({ displayName: 'x'.repeat(40_000) })
    expect(big.status).toBe(413)
    const broken = await request(ctx.app).patch(`${API}/me`).set(user.headers).set('Content-Type', 'application/json').send('{"displayName":')
    expect(broken.status).toBe(400)
    expect(broken.body.error.code).toBe('INVALID_JSON')
  })
})

describe('profile', () => {
  it('returns the signed-in user\'s profile', async () => {
    const user = await ctx.signUp('Juan Dela Cruz')
    const res = await request(ctx.app).get(`${API}/me`).set(user.headers).expect(200)
    expect(res.body.data).toMatchObject({ id: user.id, displayName: 'Juan Dela Cruz', email: `${user.id}@example.test` })
  })

  it('creates a missing profile on first read', async () => {
    const user = await ctx.signUp('Ghost Profile')
    await ctx.db.query('delete from public.profiles where id = $1', [user.id])
    const res = await request(ctx.app).get(`${API}/me`).set(user.headers).expect(200)
    expect(res.body.data).toMatchObject({ id: user.id, displayName: null })
  })

  it('updates the display name after normalizing it', async () => {
    const user = await ctx.signUp()
    const res = await request(ctx.app).patch(`${API}/me`).set(user.headers).send({ displayName: '  Maria   Santos ' }).expect(200)
    expect(res.body.data.displayName).toBe('Maria Santos')
  })

  it('rejects a user id in the body instead of trusting it', async () => {
    const alice = await ctx.signUp('Alice Reyes')
    const bob = await ctx.signUp('Bob Santos')
    const res = await request(ctx.app).patch(`${API}/me`).set(alice.headers).send({ displayName: 'Hacked', id: bob.id }).expect(400)
    expect(res.body.error.code).toBe('VALIDATION_FAILED')
    const bobProfile = await request(ctx.app).get(`${API}/me`).set(bob.headers).expect(200)
    expect(bobProfile.body.data.displayName).toBe('Bob Santos')
  })

  it.each([[''], ['x'], ['a'.repeat(81)], ['bad‮name'], [42]])('rejects the display name %j', async (displayName) => {
    const user = await ctx.signUp()
    await request(ctx.app).patch(`${API}/me`).set(user.headers).send({ displayName }).expect(400)
  })
})

describe('lessons', () => {
  it('lists every existing learning module publicly', async () => {
    const res = await request(ctx.app).get(`${API}/lessons`).expect(200)
    expect(res.body.data.map((lesson) => lesson.id)).toEqual(lessons.map((lesson) => lesson.id))
    expect(res.body.data).toHaveLength(8)
  })

  it('completes a known lesson once and treats repeats as idempotent', async () => {
    const user = await ctx.signUp()
    const first = await request(ctx.app).put(`${API}/lessons/progress/${REQUIRED_LESSON_IDS[2]}`).set(user.headers).send({ completed: true })
    expect(first.status).toBe(201)
    expect(first.body.data).toMatchObject({ lessonId: REQUIRED_LESSON_IDS[2], completed: true })
    const again = await request(ctx.app).put(`${API}/lessons/progress/${REQUIRED_LESSON_IDS[2]}`).set(user.headers).send({ completed: true })
    expect(again.status).toBe(200)
    expect(again.body.data.completedAt).toBe(first.body.data.completedAt)
  })

  it('rejects unknown lesson ids', async () => {
    const user = await ctx.signUp()
    const res = await request(ctx.app).put(`${API}/lessons/progress/made-up-lesson`).set(user.headers).send({ completed: true })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('LESSON_NOT_FOUND')
    await request(ctx.app).put(`${API}/lessons/progress/Bad_Id!`).set(user.headers).send({ completed: true }).expect(400)
  })

  it('rejects bodies other than { completed: true }', async () => {
    const user = await ctx.signUp()
    for (const body of [{}, { completed: false }, { completed: true, completedAt: '2020-01-01' }]) {
      await request(ctx.app).put(`${API}/lessons/progress/${REQUIRED_LESSON_IDS[0]}`).set(user.headers).send(body).expect(400)
    }
  })

  it('reports progress for the signed-in user only', async () => {
    const alice = await ctx.signUp()
    const bob = await ctx.signUp()
    await completeLessons(ctx.app, alice.headers, REQUIRED_LESSON_IDS.slice(0, 3))
    const aliceProgress = await request(ctx.app).get(`${API}/lessons/progress`).set(alice.headers).expect(200)
    expect(aliceProgress.body.data).toMatchObject({ completed: 3, required: 8 })
    const bobProgress = await request(ctx.app).get(`${API}/lessons/progress`).set(bob.headers).expect(200)
    expect(bobProgress.body.data).toMatchObject({ completed: 0, required: 8 })
    expect(bobProgress.body.data.items.every((item) => !item.completed)).toBe(true)
  })
})
