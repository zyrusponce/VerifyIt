import request from 'supertest'
import { REQUIRED_LESSON_IDS } from '../../src/data/lessons.js'
import { REQUIRED_CASE_IDS } from '../../src/data/investigations.js'
import { MIXED_CATEGORY_ID, getCategory, getQuestion, topicCategories } from '../../src/data/quizzes.js'

export const API = '/api/v1'

export const wrongAnswer = (question) => (question.answer + 1) % question.options.length

/** Every question of a topic category; the first `correctCount` answers are right. */
export function topicAnswers(categoryId, correctCount, { confidence = true } = {}) {
  return getCategory(categoryId).questionIds.map((questionId, index) => {
    const question = getQuestion(questionId)
    return {
      questionId,
      selectedAnswer: index < correctCount ? question.answer : wrongAnswer(question),
      ...(confidence ? { confidenceRating: (index % 5) + 1 } : {}),
    }
  })
}

/** A valid Mixed Challenge draw where every answer is correct. */
export function mixedDraw() {
  const perCategory = getCategory(MIXED_CATEGORY_ID).questionsPerCategory
  return topicCategories.flatMap((category) =>
    category.questionIds.slice(0, perCategory).map((questionId) => ({ questionId, selectedAnswer: getQuestion(questionId).answer })),
  )
}

export async function completeLessons(app, headers, lessonIds = REQUIRED_LESSON_IDS) {
  for (const lessonId of lessonIds) {
    await request(app).put(`${API}/lessons/progress/${lessonId}`).set(headers).send({ completed: true }).expect((res) => {
      if (![200, 201].includes(res.status)) throw new Error(`lesson ${lessonId}: ${res.status} ${JSON.stringify(res.body)}`)
    })
  }
}

export async function submitCases(app, headers, caseIds = REQUIRED_CASE_IDS, verdict = 'insufficient') {
  for (const caseId of caseIds) {
    await request(app).post(`${API}/investigations/${caseId}/attempts`).set(headers).send({ verdict }).expect(201)
  }
}
