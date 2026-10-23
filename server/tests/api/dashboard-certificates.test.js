import request from 'supertest'
import { extractText, getDocumentProxy } from 'unpdf'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestContext } from '../support/testApp.js'
import { API, completeLessons, submitCases, topicAnswers } from '../support/fixtures.js'
import { REQUIRED_LESSON_IDS } from '../../src/data/lessons.js'
import { REQUIRED_CASE_IDS, getCase } from '../../src/data/investigations.js'
import { TOOLKIT_ITEM_IDS } from '../../src/data/toolkit.js'
import { formatIssueDate } from '../../src/services/pdf.service.js'

let ctx

beforeAll(async () => {
  ctx = await createTestContext()
})

async function eligibleUser(displayName = 'Maria Clara Santos') {
  const user = await ctx.signUp(displayName)
  await completeLessons(ctx.app, user.headers)
  await submitCases(ctx.app, user.headers)
  return user
}

const binaryParser = (res, callback) => {
  const chunks = []
  res.on('data', (chunk) => chunks.push(chunk))
  res.on('end', () => callback(null, Buffer.concat(chunks)))
}

describe('dashboard', () => {
  it('returns valid empty statistics for a new user', async () => {
    const user = await ctx.signUp()
    const { body } = await request(ctx.app).get(`${API}/dashboard`).set(user.headers).expect(200)
    expect(body.data.lessons).toMatchObject({ completed: 0, required: 8 })
    expect(body.data.quizzes).toMatchObject({ totalAttempts: 0, latestAttempts: [] })
    expect(body.data.quizzes.categories).toHaveLength(7)
    expect(body.data.quizzes.categories.every((c) => c.attempts === 0 && c.best === null)).toBe(true)
    expect(body.data.investigations).toMatchObject({ completed: 0, required: 6, history: [] })
    expect(body.data.confidence.quiz).toMatchObject({ rated: 0, averageWhenCorrect: null, averageWhenIncorrect: null })
    expect(body.data.toolkit).toMatchObject({ checked: 0, total: TOOLKIT_ITEM_IDS.length })
    expect(body.data.certificate).toMatchObject({ eligible: false, completedLessons: 0, completedCases: 0, existingCertificate: null })
  })

  it('matches the saved records and never includes another user\'s data', async () => {
    const alice = await ctx.signUp()
    const bob = await ctx.signUp()
    await completeLessons(ctx.app, alice.headers, REQUIRED_LESSON_IDS.slice(0, 2))
    for (const correct of [3, 8, 5]) {
      await request(ctx.app).post(`${API}/quizzes/deepfakes/attempts`).set(alice.headers).send({ answers: topicAnswers('deepfakes', correct) }).expect(201)
    }
    const item = getCase('flood-photo')
    await request(ctx.app).post(`${API}/investigations/flood-photo/attempts`).set(alice.headers).send({ verdict: item.expected, confidenceRating: 4 })
    await request(ctx.app).put(`${API}/toolkit/progress`).set(alice.headers).send({ items: [{ itemId: TOOLKIT_ITEM_IDS[0], checked: true }] })
    // Bob's activity must not leak into Alice's dashboard.
    await completeLessons(ctx.app, bob.headers)
    await request(ctx.app).post(`${API}/quizzes/fact-checking/attempts`).set(bob.headers).send({ answers: topicAnswers('fact-checking', 10) })

    const { body } = await request(ctx.app).get(`${API}/dashboard`).set(alice.headers).expect(200)
    const dashboard = body.data
    expect(dashboard.lessons.completed).toBe(2)
    expect(dashboard.quizzes.totalAttempts).toBe(3)
    const deepfakes = dashboard.quizzes.categories.find((c) => c.category === 'deepfakes')
    expect(deepfakes).toMatchObject({ attempts: 3, best: { score: 8, percent: 80 }, latest: { score: 5 } })
    expect(dashboard.quizzes.categories.find((c) => c.category === 'fact-checking').attempts).toBe(0)
    expect(dashboard.investigations.completed).toBe(1)
    expect(dashboard.investigations.history).toHaveLength(1)
    expect(dashboard.confidence.investigations).toMatchObject({ rated: 1, averageWhenCorrect: 4 })
    expect(dashboard.confidence.quiz.rated).toBe(30)
    expect(dashboard.confidence.quiz.byLevel.reduce((sum, level) => sum + level.answered, 0)).toBe(30)
    expect(dashboard.toolkit.checked).toBe(1)
    expect(dashboard.certificate).toMatchObject({ completedLessons: 2, completedCases: 1, eligible: false })
  })
})

describe('certificate eligibility', () => {
  it('is not eligible with no completed lessons', async () => {
    const user = await ctx.signUp()
    const { body } = await request(ctx.app).get(`${API}/certificates/eligibility`).set(user.headers).expect(200)
    expect(body.data).toMatchObject({ eligible: false, completedLessons: 0, requiredLessons: 8, completedCases: 0, requiredCases: 6 })
    expect(body.data.remainingRequirements).toHaveLength(14)
    expect(body.data.remainingRequirements[0]).toMatchObject({ type: 'lesson', id: REQUIRED_LESSON_IDS[0], path: `/learn/${REQUIRED_LESSON_IDS[0]}` })
  })

  it('is not eligible with every lesson but incomplete cases', async () => {
    const user = await ctx.signUp()
    await completeLessons(ctx.app, user.headers)
    await submitCases(ctx.app, user.headers, REQUIRED_CASE_IDS.slice(0, 5))
    const { body } = await request(ctx.app).get(`${API}/certificates/eligibility`).set(user.headers).expect(200)
    expect(body.data.eligible).toBe(false)
    expect(body.data.remainingRequirements).toEqual([
      { type: 'investigation', id: REQUIRED_CASE_IDS[5], title: getCase(REQUIRED_CASE_IDS[5]).title, path: `/lab/${REQUIRED_CASE_IDS[5]}` },
    ])
  })

  it('is not eligible with every case but incomplete lessons', async () => {
    const user = await ctx.signUp()
    await completeLessons(ctx.app, user.headers, REQUIRED_LESSON_IDS.slice(1))
    await submitCases(ctx.app, user.headers)
    const { body } = await request(ctx.app).get(`${API}/certificates/eligibility`).set(user.headers).expect(200)
    expect(body.data.eligible).toBe(false)
    expect(body.data.remainingRequirements.map((r) => r.id)).toEqual([REQUIRED_LESSON_IDS[0]])
  })

  it('is eligible after full completion, even with wrong investigation verdicts', async () => {
    const user = await eligibleUser()
    const { body } = await request(ctx.app).get(`${API}/certificates/eligibility`).set(user.headers).expect(200)
    expect(body.data).toMatchObject({ eligible: true, completedLessons: 8, completedCases: 6, remainingRequirements: [] })
  })
})

describe('certificate issuance', () => {
  it('refuses ineligible users and lists what is missing', async () => {
    const user = await ctx.signUp('Not Done Yet')
    await completeLessons(ctx.app, user.headers)
    const res = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(422)
    expect(res.body.error.code).toBe('NOT_ELIGIBLE')
    expect(res.body.error.details.remainingRequirements).toHaveLength(6)
    const mine = await request(ctx.app).get(`${API}/certificates/my`).set(user.headers).expect(200)
    expect(mine.body.data).toEqual([])
  })

  it('ignores a client-sent eligibility flag', async () => {
    const user = await ctx.signUp('Sneaky Student')
    const res = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({ eligible: true })
    expect(res.status).toBe(400)
  })

  it('requires a display name before issuing, then issues with the supplied name', async () => {
    const user = await eligibleUser(null)
    const missing = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(422)
    expect(missing.body.error.code).toBe('DISPLAY_NAME_REQUIRED')
    const issued = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({ recipientName: 'Jose  Rizal' }).expect(201)
    expect(issued.body.data).toMatchObject({ recipientName: 'Jose Rizal', status: 'active', title: 'Certificate of Completion' })
  })

  it('rejects names the certificate font cannot print', async () => {
    const user = await eligibleUser(null)
    const res = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({ recipientName: '李小龍 Lee' }).expect(422)
    expect(res.body.error.code).toBe('NAME_NOT_PRINTABLE')
  })

  it('does not create duplicates for repeated or simultaneous requests', async () => {
    const user = await eligibleUser()
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({})),
    )
    const ids = new Set(responses.map((res) => res.body.data.id))
    expect(ids.size).toBe(1)
    expect(responses.filter((res) => res.status === 201)).toHaveLength(1)
    expect(responses.filter((res) => res.status === 200)).toHaveLength(4)
    const again = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({ recipientName: 'Another Name' }).expect(200)
    expect(again.body.data.recipientName).toBe('Maria Clara Santos')
    const mine = await request(ctx.app).get(`${API}/certificates/my`).set(user.headers).expect(200)
    expect(mine.body.data).toHaveLength(1)
    expect(mine.body.data[0].certificateNumber).toMatch(/^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
    expect(mine.body.data[0].verificationUrl).toBe(`https://verifyit.test/verify-certificate/${mine.body.data[0].certificateNumber}`)
  })

  it('shows the existing certificate in the eligibility response after logging in again', async () => {
    const user = await eligibleUser()
    const issued = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(201)
    const { body } = await request(ctx.app).get(`${API}/certificates/eligibility`).set(user.headers).expect(200)
    expect(body.data.existingCertificate.id).toBe(issued.body.data.id)
  })
})

describe('certificate PDF', () => {
  it('contains the recipient name, issue date, certificate number, and verification URL', async () => {
    const user = await eligibleUser('Andrés Bonifacio Peñaflorida')
    const { body } = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(201)
    const certificate = body.data
    const res = await request(ctx.app)
      .get(`${API}/certificates/${certificate.id}/pdf`)
      .set(user.headers)
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['content-disposition']).toBe(`attachment; filename="VerifyIT-Certificate-${certificate.certificateNumber}.pdf"`)
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-')

    const pdf = await getDocumentProxy(new Uint8Array(res.body))
    expect(pdf.numPages).toBe(1)
    const { text } = await extractText(pdf, { mergePages: true })
    expect(text).toContain('CERTIFICATE OF COMPLETION')
    expect(text).toContain('MEDIA LITERACY AND ONLINE MISINFORMATION AWARENESS')
    expect(text).not.toMatch(/digital literacy/i)
    expect(text).toContain('Andrés Bonifacio Peñaflorida')
    expect(text).toContain(certificate.certificateNumber)
    expect(text).toContain(formatIssueDate(certificate.issuedAt, 'Asia/Manila'))
    expect(text).toContain(certificate.verificationUrl)
    expect(text).toContain('Issued by the VerifyIT educational project')
  })

  it('does not let a user download another user\'s certificate', async () => {
    const owner = await eligibleUser()
    const other = await ctx.signUp('Curious Classmate')
    const { body } = await request(ctx.app).post(`${API}/certificates/issue`).set(owner.headers).send({}).expect(201)
    const res = await request(ctx.app).get(`${API}/certificates/${body.data.id}/pdf`).set(other.headers).expect(404)
    expect(res.body.error.code).toBe('CERTIFICATE_NOT_FOUND')
    await request(ctx.app).get(`${API}/certificates/${body.data.id}/pdf`).expect(401)
  })

  it('refuses to generate a PDF for a revoked certificate', async () => {
    const user = await eligibleUser()
    const { body } = await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(201)
    await ctx.db.query("update public.certificates set status = 'revoked', revoked_at = now() where id = $1", [body.data.id])
    const res = await request(ctx.app).get(`${API}/certificates/${body.data.id}/pdf`).set(user.headers).expect(410)
    expect(res.body.error.code).toBe('CERTIFICATE_REVOKED')
  })
})

describe('public certificate verification', () => {
  it('confirms a valid certificate with only the printed details', async () => {
    const user = await eligibleUser()
    const issued = (await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(201)).body.data
    const res = await request(ctx.app).get(`${API}/certificates/verify/${issued.certificateNumber.toLowerCase()}`).expect(200)
    expect(res.body.data).toEqual({
      valid: true,
      status: 'valid',
      title: 'Certificate of Completion',
      program: 'Media Literacy and Online Misinformation Awareness',
      description: expect.any(String),
      issuer: 'VerifyIT educational project',
      recipientName: 'Maria Clara Santos',
      certificateNumber: issued.certificateNumber,
      issuedAt: issued.issuedAt,
    })
    const serialized = JSON.stringify(res.body)
    expect(serialized).not.toContain(user.id)
    expect(serialized).not.toContain('@example.test')
  })

  it('reports unknown and malformed numbers as invalid', async () => {
    const unknown = await request(ctx.app).get(`${API}/certificates/verify/VIT-0000-0000-0000-0000`).expect(404)
    expect(unknown.body.error).toMatchObject({ code: 'CERTIFICATE_NOT_FOUND', details: { valid: false, status: 'not_found' } })
    await request(ctx.app).get(`${API}/certificates/verify/VIT-NOT-REAL`).expect(400)
  })

  it('reports revoked certificates as not valid', async () => {
    const user = await eligibleUser()
    const issued = (await request(ctx.app).post(`${API}/certificates/issue`).set(user.headers).send({}).expect(201)).body.data
    await ctx.db.query("update public.certificates set status = 'revoked', revoked_at = now() where id = $1", [issued.id])
    const res = await request(ctx.app).get(`${API}/certificates/verify/${issued.certificateNumber}`).expect(200)
    expect(res.body.data).toMatchObject({ valid: false, status: 'revoked', certificateNumber: issued.certificateNumber })
    expect(res.body.data).not.toHaveProperty('recipientName')
  })
})
