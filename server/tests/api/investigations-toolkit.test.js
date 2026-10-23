import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestContext } from '../support/testApp.js'
import { API } from '../support/fixtures.js'
import { REQUIRED_CASE_IDS, getCase, investigationCases } from '../../src/data/investigations.js'
import { TOOLKIT_ITEM_IDS } from '../../src/data/toolkit.js'

let ctx

beforeAll(async () => {
  ctx = await createTestContext()
})

const otherVerdict = (expected) => ['supported', 'misleading', 'insufficient'].find((verdict) => verdict !== expected)

describe('investigation cases', () => {
  it('lists every existing case without expected verdicts', async () => {
    const res = await request(ctx.app).get(`${API}/investigations/cases`).expect(200)
    expect(res.body.data.cases.map((c) => c.id)).toEqual(investigationCases.map((c) => c.id))
    for (const item of res.body.data.cases) {
      expect(item).not.toHaveProperty('expected')
      expect(item).not.toHaveProperty('explanation')
    }
    expect(res.body.data.verdicts.map((v) => v.id)).toEqual(['supported', 'misleading', 'insufficient'])
  })

  it('reveals the expected verdict to guests only after they check an answer, without storing anything', async () => {
    const item = getCase('class-suspension')
    const res = await request(ctx.app).post(`${API}/investigations/${item.id}/check`).send({ verdict: item.expected }).expect(200)
    expect(res.body.data).toEqual({
      caseId: item.id,
      isCorrect: true,
      selectedVerdict: item.expected,
      expectedVerdict: item.expected,
      explanation: item.explanation,
    })
    const { rows } = await ctx.db.query('select count(*)::int as n from public.investigation_attempts')
    expect(rows[0].n).toBe(0)
  })
})

describe('investigation attempts', () => {
  it('accepts allowed verdicts and decides correctness from the server catalog', async () => {
    const user = await ctx.signUp()
    const item = getCase(REQUIRED_CASE_IDS[0])
    const right = await request(ctx.app)
      .post(`${API}/investigations/${item.id}/attempts`)
      .set(user.headers)
      .send({ verdict: item.expected, confidenceRating: 5 })
      .expect(201)
    expect(right.body.data.result).toMatchObject({ isCorrect: true, expectedVerdict: item.expected, explanation: item.explanation })
    expect(right.body.data.attempt).toMatchObject({ caseId: item.id, selectedVerdict: item.expected, confidenceRating: 5 })

    const wrong = await request(ctx.app)
      .post(`${API}/investigations/${item.id}/attempts`)
      .set(user.headers)
      .send({ verdict: otherVerdict(item.expected) })
      .expect(201)
    expect(wrong.body.data.result.isCorrect).toBe(false)
  })

  it('rejects unknown cases, unknown verdicts, client correctness flags, and bad confidence values', async () => {
    const user = await ctx.signUp()
    await request(ctx.app).post(`${API}/investigations/not-a-case/attempts`).set(user.headers).send({ verdict: 'misleading' }).expect(404)
    await request(ctx.app).post(`${API}/investigations/flood-photo/attempts`).set(user.headers).send({ verdict: 'fake' }).expect(400)
    await request(ctx.app)
      .post(`${API}/investigations/flood-photo/attempts`)
      .set(user.headers)
      .send({ verdict: 'supported', isCorrect: true })
      .expect(400)
    await request(ctx.app)
      .post(`${API}/investigations/flood-photo/attempts`)
      .set(user.headers)
      .send({ verdict: 'supported', confidenceRating: 9 })
      .expect(400)
  })

  it('counts a case as completed only after a saved submission, and only once', async () => {
    const user = await ctx.signUp()
    const progress = async () => (await request(ctx.app).get(`${API}/investigations/progress`).set(user.headers).expect(200)).body.data
    await request(ctx.app).get(`${API}/investigations/cases`).expect(200)
    expect((await progress()).completed).toBe(0)

    for (let i = 0; i < 3; i += 1) {
      await request(ctx.app).post(`${API}/investigations/flood-photo/attempts`).set(user.headers).send({ verdict: 'supported' }).expect(201)
    }
    const after = await progress()
    expect(after.completed).toBe(1)
    expect(after.cases.find((c) => c.caseId === 'flood-photo')).toMatchObject({ completed: true, attempts: 3, solved: false })
  })

  it('is idempotent per clientAttemptId and keeps history private', async () => {
    const alice = await ctx.signUp()
    const bob = await ctx.signUp()
    const body = { verdict: 'misleading', clientAttemptId: randomUUID() }
    const first = await request(ctx.app).post(`${API}/investigations/coffee-study/attempts`).set(alice.headers).send(body).expect(201)
    const retry = await request(ctx.app).post(`${API}/investigations/coffee-study/attempts`).set(alice.headers).send(body).expect(200)
    expect(retry.body.data.attempt.id).toBe(first.body.data.attempt.id)
    const conflict = await request(ctx.app).post(`${API}/investigations/fuel-price/attempts`).set(alice.headers).send(body).expect(409)
    expect(conflict.body.error.code).toBe('CLIENT_ATTEMPT_ID_CONFLICT')

    const aliceHistory = await request(ctx.app).get(`${API}/investigations/attempts`).set(alice.headers).expect(200)
    expect(aliceHistory.body.data).toHaveLength(1)
    const bobHistory = await request(ctx.app).get(`${API}/investigations/attempts`).set(bob.headers).expect(200)
    expect(bobHistory.body.data).toEqual([])
  })
})

describe('verification toolkit', () => {
  it('saves and returns checklist progress', async () => {
    const user = await ctx.signUp()
    const empty = await request(ctx.app).get(`${API}/toolkit/progress`).set(user.headers).expect(200)
    expect(empty.body.data).toMatchObject({ checked: 0, total: TOOLKIT_ITEM_IDS.length })

    const saved = await request(ctx.app)
      .put(`${API}/toolkit/progress`)
      .set(user.headers)
      .send({ items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: true }, { itemId: TOOLKIT_ITEM_IDS[1], checked: true }] })
      .expect(200)
    expect(saved.body.data.checked).toBe(2)
    expect(saved.body.data.items[TOOLKIT_ITEM_IDS[0]]).toBe(true)

    const unchecked = await request(ctx.app)
      .put(`${API}/toolkit/progress`)
      .set(user.headers)
      .send({ items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: false }] })
      .expect(200)
    expect(unchecked.body.data.checked).toBe(1)
  })

  it('never lets an imported guest checklist overwrite saved account data', async () => {
    const user = await ctx.signUp()
    await request(ctx.app).put(`${API}/toolkit/progress`).set(user.headers).send({ items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: false }] })
    const imported = await request(ctx.app)
      .put(`${API}/toolkit/progress`)
      .set(user.headers)
      .send({ keepExisting: true, items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: true }, { itemId: TOOLKIT_ITEM_IDS[2], checked: true }] })
      .expect(200)
    expect(imported.body.data.items[TOOLKIT_ITEM_IDS[0]]).toBe(false)
    expect(imported.body.data.items[TOOLKIT_ITEM_IDS[2]]).toBe(true)
  })

  it('rejects unknown and duplicate items', async () => {
    const user = await ctx.signUp()
    const unknown = await request(ctx.app).put(`${API}/toolkit/progress`).set(user.headers).send({ items: [{ itemId: 'made-up', checked: true }] })
    expect(unknown.status).toBe(422)
    const duplicate = await request(ctx.app)
      .put(`${API}/toolkit/progress`)
      .set(user.headers)
      .send({ items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: true }, { itemId: TOOLKIT_ITEM_IDS[0], checked: false }] })
    expect(duplicate.status).toBe(400)
    await request(ctx.app).put(`${API}/toolkit/progress`).set(user.headers).send({ items: [] }).expect(400)
  })
})
