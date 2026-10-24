import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { createTestContext } from '../support/testApp.js'
import { API, mixedDraw, topicAnswers, wrongAnswer } from '../support/fixtures.js'
import { MIXED_CATEGORY_ID, getCategory, getQuestion, topicCategories } from '../../src/data/quizzes.js'
import { quizCategories as frontendCategories } from '../../../src/data/quizCategories.js'

let ctx

beforeAll(async () => {
  ctx = await createTestContext()
})

describe('quiz catalog', () => {
  it('preserves every existing quiz category with its id and title', async () => {
    const res = await request(ctx.app).get(`${API}/quizzes/categories`).expect(200)
    expect(res.body.data.map(({ id, title }) => ({ id, title }))).toEqual([
      { id: 'ai-generated-images', title: 'AI-Generated Image Detection' },
      { id: 'misleading-information', title: 'Misleading Information' },
      { id: 'source-credibility', title: 'Source Credibility' },
      { id: 'image-manipulation', title: 'Image Manipulation and Missing Context' },
      { id: 'deepfakes', title: 'Deepfakes and AI-Generated Content' },
      { id: 'fact-checking', title: 'Fact-Checking and Evidence Verification' },
      { id: 'mixed-challenge', title: 'Mixed Challenge' },
    ])
    expect(res.body.data.find((c) => c.id === MIXED_CATEGORY_ID)).toMatchObject({ isMixed: true, questionCount: 12 })
  })

  it('serves questions identical to the frontend content, without answers or explanations', async () => {
    for (const category of frontendCategories.filter((c) => !c.isMixed)) {
      const res = await request(ctx.app).get(`${API}/quizzes/${category.id}/questions`).expect(200)
      expect(res.body.data.questions).toEqual(category.questions)
      for (const question of res.body.data.questions) {
        expect(question).not.toHaveProperty('answer')
        expect(question).not.toHaveProperty('explanation')
      }
    }
  })

  it('serves the Mixed Challenge pool and its draw rule', async () => {
    const res = await request(ctx.app).get(`${API}/quizzes/${MIXED_CATEGORY_ID}/questions`).expect(200)
    expect(res.body.data.questions).toHaveLength(topicCategories.reduce((sum, c) => sum + c.questionIds.length, 0))
    expect(res.body.data.draw).toEqual({ questionsPerCategory: 2, fromCategories: topicCategories.map((c) => c.id) })
  })

  it('rejects unknown categories', async () => {
    const res = await request(ctx.app).get(`${API}/quizzes/not-a-category/questions`).expect(404)
    expect(res.body.error.code).toBe('CATEGORY_NOT_FOUND')
  })
})

describe('answer check (instant feedback)', () => {
  it('reveals correctness and the explanation only for the submitted question', async () => {
    const question = getQuestion('mi-01')
    const right = await request(ctx.app)
      .post(`${API}/quizzes/misleading-information/check`)
      .send({ questionId: 'mi-01', selectedAnswer: question.answer })
      .expect(200)
    expect(right.body.data).toEqual({
      questionId: 'mi-01',
      selectedAnswer: question.answer,
      isCorrect: true,
      correctAnswer: question.answer,
      explanation: question.explanation,
      credits: [],
    })
    const wrong = await request(ctx.app)
      .post(`${API}/quizzes/misleading-information/check`)
      .send({ questionId: 'mi-01', selectedAnswer: wrongAnswer(question) })
      .expect(200)
    expect(wrong.body.data.isCorrect).toBe(false)
  })

  it('reveals image credits only after an answer is checked', async () => {
    const list = await request(ctx.app).get(`${API}/quizzes/ai-generated-images/questions`).expect(200)
    const listed = list.body.data.questions.find((q) => q.id === 'aii-11')
    expect(listed.images).toHaveLength(2)
    expect(JSON.stringify(listed)).not.toMatch(/FLUX|formicacid|commons\.wikimedia/)
    const res = await request(ctx.app)
      .post(`${API}/quizzes/ai-generated-images/check`)
      .send({ questionId: 'aii-11', selectedAnswer: getQuestion('aii-11').answer })
      .expect(200)
    expect(res.body.data.isCorrect).toBe(true)
    expect(res.body.data.credits).toHaveLength(2)
    for (const credit of res.body.data.credits) expect(credit.url).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
  })

  it('serves video questions without anything that gives away which clips are fake', async () => {
    const list = await request(ctx.app).get(`${API}/quizzes/deepfakes/questions`).expect(200)
    const questions = list.body.data.questions
    expect(questions).toHaveLength(10)
    for (const question of questions) {
      const clips = question.videos ?? [question.video]
      expect(clips.length).toBeGreaterThan(0)
      for (const clip of clips) {
        expect(clip.src).toMatch(/^\/quiz-videos\/clip-\d{2}\.mp4$/)
        expect(clip.poster).toMatch(/^\/quiz-videos\/clip-\d{2}\.jpg$/)
        expect(clip.description).toBeTruthy()
      }
      // Tool names, the word "deepfake" in descriptions, and source links only appear after answering.
      const clipText = JSON.stringify(clips)
      expect(clipText).not.toMatch(/sora|veo|openai|deepfake|represent|commons|wikimedia/i)
      expect(question).not.toHaveProperty('credits')
    }

    const pair = await request(ctx.app)
      .post(`${API}/quizzes/deepfakes/check`)
      .send({ questionId: 'df-26', selectedAnswer: getQuestion('df-26').answer })
      .expect(200)
    expect(pair.body.data.isCorrect).toBe(true)
    expect(pair.body.data.credits).toHaveLength(2)
    for (const credit of pair.body.data.credits) expect(credit.url).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/)
  })

  it('serves the image manipulation photos without anything that gives away which one was edited', async () => {
    const list = await request(ctx.app).get(`${API}/quizzes/image-manipulation/questions`).expect(200)
    const questions = list.body.data.questions
    expect(questions).toHaveLength(10)
    for (const question of questions) {
      const pictures = question.images ?? [question.image]
      for (const picture of pictures) expect(picture.src).toMatch(/^\/quiz-images\/edit-\d{2}\.jpg$/)
      expect(JSON.stringify(pictures)).not.toMatch(/edited|removed|deleted|composite|fake|original|altered|commons/i)
      expect(question).not.toHaveProperty('credits')
    }
    const res = await request(ctx.app)
      .post(`${API}/quizzes/image-manipulation/check`)
      .send({ questionId: 'im-11', selectedAnswer: getQuestion('im-11').answer })
      .expect(200)
    expect(res.body.data.isCorrect).toBe(true)
    expect(res.body.data.credits).toHaveLength(2)
  })

  it('accepts any topic question in the Mixed Challenge but rejects questions from other categories', async () => {
    await request(ctx.app).post(`${API}/quizzes/${MIXED_CATEGORY_ID}/check`).send({ questionId: 'df-22', selectedAnswer: 0 }).expect(200)
    const res = await request(ctx.app).post(`${API}/quizzes/fact-checking/check`).send({ questionId: 'df-22', selectedAnswer: 0 }).expect(422)
    expect(res.body.error.code).toBe('UNKNOWN_QUESTION')
  })

  it('validates the selected option', async () => {
    await request(ctx.app).post(`${API}/quizzes/deepfakes/check`).send({ questionId: 'df-22', selectedAnswer: 4 }).expect(400)
    await request(ctx.app).post(`${API}/quizzes/deepfakes/check`).send({ questionId: 'df-22', selectedAnswer: -1 }).expect(400)
    await request(ctx.app).post(`${API}/quizzes/deepfakes/check`).send({ questionId: 'df-22' }).expect(400)
  })
})

describe('quiz attempts', () => {
  it('calculates the score on the server', async () => {
    const user = await ctx.signUp()
    const res = await request(ctx.app)
      .post(`${API}/quizzes/source-credibility/attempts`)
      .set(user.headers)
      .send({ answers: topicAnswers('source-credibility', 6) })
      .expect(201)
    expect(res.body.data).toMatchObject({ category: 'source-credibility', score: 6, totalQuestions: 10, percent: 60 })
    expect(res.body.data.answers).toHaveLength(10)
    const first = res.body.data.answers[0]
    expect(first).toMatchObject({ isCorrect: true, correctAnswer: getQuestion(first.questionId).answer })
    expect(first.explanation).toBe(getQuestion(first.questionId).explanation)
    expect(res.body.data.confidence.rated).toBe(10)
  })

  it('does not accept a client-provided score, correctness flag, or user id', async () => {
    const user = await ctx.signUp()
    const answers = topicAnswers('deepfakes', 0)
    for (const body of [
      { answers, score: 10 },
      { answers, totalQuestions: 10 },
      { answers, user_id: randomUUID() },
      { answers: answers.map((a) => ({ ...a, isCorrect: true })) },
    ]) {
      const res = await request(ctx.app).post(`${API}/quizzes/deepfakes/attempts`).set(user.headers).send(body).expect(400)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
    }
    const history = await request(ctx.app).get(`${API}/quizzes/attempts`).set(user.headers).expect(200)
    expect(history.body.data).toEqual([])
  })

  it('rejects invalid categories, duplicates, incomplete sets, and bad confidence values', async () => {
    const user = await ctx.signUp()
    const post = (category, answers) => request(ctx.app).post(`${API}/quizzes/${category}/attempts`).set(user.headers).send({ answers })
    const answers = topicAnswers('deepfakes', 5)

    expect((await post('not-a-category', answers)).status).toBe(404)
    const duplicate = [...answers.slice(0, -1), answers[0]]
    expect((await post('deepfakes', duplicate)).body.error.code).toBe('DUPLICATE_QUESTION')
    const incomplete = await post('deepfakes', answers.slice(1))
    expect(incomplete.status).toBe(422)
    expect(incomplete.body.error.code).toBe('INVALID_QUESTION_SET')
    const foreign = await post('deepfakes', [...answers.slice(1), { questionId: 'fc-01', selectedAnswer: 0 }])
    expect(foreign.status).toBe(422)
    for (const confidenceRating of [0, 6, 2.5, '3']) {
      const res = await post('deepfakes', answers.map((a, i) => (i === 0 ? { ...a, confidenceRating } : a)))
      expect(res.status, String(confidenceRating)).toBe(400)
    }
    expect((await post('deepfakes', [])).status).toBe(400)
  })

  it('accepts a balanced Mixed Challenge and rejects an unbalanced one', async () => {
    const user = await ctx.signUp()
    const draw = mixedDraw()
    const ok = await request(ctx.app).post(`${API}/quizzes/${MIXED_CATEGORY_ID}/attempts`).set(user.headers).send({ answers: draw }).expect(201)
    expect(ok.body.data).toMatchObject({ score: 12, totalQuestions: 12 })
    expect(Object.keys(ok.body.data.byCategory).sort()).toEqual(topicCategories.map((c) => c.id).sort())

    const extraFromOne = getCategory('deepfakes').questionIds[5]
    const unbalanced = [...draw.slice(1), { questionId: extraFromOne, selectedAnswer: 0 }]
    const res = await request(ctx.app).post(`${API}/quizzes/${MIXED_CATEGORY_ID}/attempts`).set(user.headers).send({ answers: unbalanced })
    expect(res.status).toBe(422)
  })

  it('does not duplicate an attempt retried with the same clientAttemptId', async () => {
    const user = await ctx.signUp()
    const clientAttemptId = randomUUID()
    const body = { clientAttemptId, answers: topicAnswers('fact-checking', 4) }
    const first = await request(ctx.app).post(`${API}/quizzes/fact-checking/attempts`).set(user.headers).send(body).expect(201)
    const retry = await request(ctx.app).post(`${API}/quizzes/fact-checking/attempts`).set(user.headers).send(body).expect(200)
    expect(retry.body.data.id).toBe(first.body.data.id)
    const history = await request(ctx.app).get(`${API}/quizzes/attempts`).set(user.headers).expect(200)
    expect(history.body.data).toHaveLength(1)
  })

  it('keeps quiz history private to its owner', async () => {
    const alice = await ctx.signUp()
    const bob = await ctx.signUp()
    const attempt = await request(ctx.app)
      .post(`${API}/quizzes/deepfakes/attempts`)
      .set(alice.headers)
      .send({ answers: topicAnswers('deepfakes', 9) })
      .expect(201)

    const aliceHistory = await request(ctx.app).get(`${API}/quizzes/attempts`).set(alice.headers).expect(200)
    expect(aliceHistory.body.data.map((a) => a.id)).toEqual([attempt.body.data.id])
    const bobHistory = await request(ctx.app).get(`${API}/quizzes/attempts`).set(bob.headers).expect(200)
    expect(bobHistory.body.data).toEqual([])

    await request(ctx.app).get(`${API}/quizzes/attempts/${attempt.body.data.id}`).set(alice.headers).expect(200)
    const stolen = await request(ctx.app).get(`${API}/quizzes/attempts/${attempt.body.data.id}`).set(bob.headers).expect(404)
    expect(stolen.body.error.code).toBe('ATTEMPT_NOT_FOUND')
  })

  it('filters history by category and validates query parameters', async () => {
    const user = await ctx.signUp()
    await request(ctx.app).post(`${API}/quizzes/deepfakes/attempts`).set(user.headers).send({ answers: topicAnswers('deepfakes', 1) }).expect(201)
    await request(ctx.app).post(`${API}/quizzes/fact-checking/attempts`).set(user.headers).send({ answers: topicAnswers('fact-checking', 1) }).expect(201)
    const filtered = await request(ctx.app).get(`${API}/quizzes/attempts?category=deepfakes`).set(user.headers).expect(200)
    expect(filtered.body.data.map((a) => a.category)).toEqual(['deepfakes'])
    await request(ctx.app).get(`${API}/quizzes/attempts?limit=0`).set(user.headers).expect(400)
    await request(ctx.app).get(`${API}/quizzes/attempts?category=nope`).set(user.headers).expect(404)
    await request(ctx.app).get(`${API}/quizzes/attempts/not-a-uuid`).set(user.headers).expect(400)
  })
})
