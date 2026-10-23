import { quizSessionKey } from './progress'
import { topicCategories } from '../data/quizCategories'

/** Returns a shuffled copy of a list (Fisher-Yates). */
export function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Picks the questions for a new attempt and shuffles each question's answer options,
 * so the correct answer is not always in the same position.
 * Every question is self-contained (images and scenarios belong to their own question),
 * so shuffling the order never separates a question from its context.
 * The Mixed Challenge draws `questionsPerCategory` random questions from each topic category.
 *
 * Returns { questionIds, optionOrders: { [questionId]: [original option indexes in display order] } }
 */
export function drawAttempt(category) {
  const picked = category.isMixed
    ? topicCategories.flatMap((topic) => shuffle(topic.questions).slice(0, category.questionsPerCategory))
    : category.questions
  const questions = shuffle(picked)
  return {
    questionIds: questions.map((question) => question.id),
    optionOrders: Object.fromEntries(questions.map((question) => [question.id, shuffle(question.options.map((_, i) => i))])),
  }
}

/**
 * Returns the question with its options in the saved display order. The correct answer is only known
 * after the server reveals it (`question.answer` is undefined before that); once known it is mapped
 * to the display order too.
 */
export function applyOptionOrder(question, order) {
  const valid = Array.isArray(order) && order.length === question.options.length && order.every((i) => question.options[i] !== undefined)
  if (!valid) return question
  const answer = Number.isInteger(question.answer) ? order.indexOf(question.answer) : undefined
  return { ...question, options: order.map((i) => question.options[i]), answer }
}

/** Turns the user's responses into a score, per-topic breakdown, and confidence summary. */
export function computeResult(categoryId, questions, responses) {
  const byCategory = {}
  const confidenceCorrect = []
  const confidenceIncorrect = []
  let score = 0

  questions.forEach((question) => {
    const response = responses[question.id]
    const correct = response?.selected === question.answer
    byCategory[question.categoryId] ??= { correct: 0, total: 0 }
    byCategory[question.categoryId].total += 1
    if (correct) {
      score += 1
      byCategory[question.categoryId].correct += 1
    }
    if (response?.confidence) {
      ;(correct ? confidenceCorrect : confidenceIncorrect).push(response.confidence)
    }
  })

  const average = (values) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null)

  return {
    categoryId,
    score,
    total: questions.length,
    percent: questions.length ? Math.round((score / questions.length) * 100) : 0,
    byCategory,
    confidence: {
      rated: confidenceCorrect.length + confidenceIncorrect.length,
      averageWhenCorrect: average(confidenceCorrect),
      averageWhenIncorrect: average(confidenceIncorrect),
      highConfidenceWrong: confidenceIncorrect.filter((value) => value >= 4).length,
    },
    date: new Date().toISOString(),
  }
}

export function scoreMessage(percent) {
  if (percent >= 90) return 'Outstanding. You think like a fact-checker.'
  if (percent >= 75) return 'Great work. You have strong verification instincts.'
  if (percent >= 50) return 'Good start. Review the explanations below to sharpen your skills.'
  return 'Keep practicing. The explanations and suggested lessons below will help you build these skills.'
}

/** Reads a saved quiz session without subscribing to it (used by the category cards). */
export function readQuizSession(categoryId, ownerId = null) {
  try {
    const stored = window.localStorage.getItem(quizSessionKey(categoryId, ownerId))
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/** True when a category has an unfinished attempt with at least one answered question. */
export function hasSessionInProgress(categoryId, ownerId = null) {
  const session = readQuizSession(categoryId, ownerId)
  return (
    session?.version === QUIZ_SESSION_VERSION &&
    session?.status === 'active' &&
    Object.values(session.responses ?? {}).some((response) => response?.submitted)
  )
}

/**
 * Saved sessions from before answers were checked on the server have no revealed answers,
 * so they cannot be resumed and are ignored.
 */
export const QUIZ_SESSION_VERSION = 2

/** Converts an option index as displayed in this attempt back to the index in the question data. */
export function toOriginalIndex(order, displayIndex, optionCount) {
  const valid = Array.isArray(order) && order.length === optionCount && order.every((i) => Number.isInteger(i) && i >= 0 && i < optionCount)
  return valid ? order[displayIndex] : displayIndex
}
