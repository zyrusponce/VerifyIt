/*
  ⚡ LAYER: Service (quizzes)
  🔒 SECURITY: Questions are served without answers. Correctness and scores are computed from the
     trusted answer key: per-question checks here, and persisted attempts by the submit_quiz_attempt
     SQL function. Client-sent scores or correctness flags are never accepted (the schemas reject them).
  🚨 ERROR HANDLING: Unknown category → 404; unknown question/invalid set → 422; duplicates and
     out-of-range answers → 400; attempts that are not the user's → 404.
*/
import {
  MIXED_CATEGORY_ID,
  getCategory,
  getQuestion,
  publicQuestionsFor,
  questionCount,
  quizCategories,
  topicCategories,
} from '../data/quizzes.js'
import { AppError, badRequest, notFound, unprocessable } from '../utils/AppError.js'

const percentOf = (score, total) => (total > 0 ? Math.round((score / total) * 100) : 0)

function requireCategory(categoryId) {
  const category = getCategory(categoryId)
  if (!category) throw notFound('CATEGORY_NOT_FOUND', 'This quiz category does not exist.')
  return category
}

/** True when a question can appear in an attempt of this category. */
function belongsTo(category, question) {
  return category.isMixed ? question.categoryId !== MIXED_CATEGORY_ID : question.categoryId === category.id
}

export function categorySummary(category) {
  return {
    id: category.id,
    title: category.title,
    description: category.description,
    difficulty: category.difficulty,
    topics: category.topics,
    isMixed: category.isMixed,
    questionCount: questionCount(category),
    questionsPerCategory: category.questionsPerCategory,
  }
}

export function listCategories() {
  return quizCategories.map(categorySummary)
}

export function getQuestions(categoryId) {
  const category = requireCategory(categoryId)
  return {
    category: categorySummary(category),
    questions: publicQuestionsFor(category),
    draw: category.isMixed
      ? { questionsPerCategory: category.questionsPerCategory, fromCategories: topicCategories.map((topic) => topic.id) }
      : null,
  }
}

/** Reveals whether one answer is correct, with the explanation. Used for instant feedback. */
export function checkAnswer(categoryId, { questionId, selectedAnswer }) {
  const category = requireCategory(categoryId)
  const question = getQuestion(questionId)
  if (!question || !belongsTo(category, question)) {
    throw unprocessable('UNKNOWN_QUESTION', 'This question is not part of this quiz.')
  }
  if (selectedAnswer >= question.options.length) {
    throw badRequest('INVALID_SELECTED_ANSWER', 'That answer option does not exist.')
  }
  return {
    questionId,
    selectedAnswer,
    isCorrect: selectedAnswer === question.answer,
    correctAnswer: question.answer,
    explanation: question.explanation,
    // Image sources can reveal the answer, so they are only sent with the result.
    credits: question.credits,
  }
}

/** Mirrors the database checks so clients get a precise error before anything is written. */
export function validateAnswerSet(category, answers) {
  const ids = answers.map((answer) => answer.questionId)
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
  if (duplicates.length) {
    throw badRequest('DUPLICATE_QUESTION', 'Each question can be answered only once per attempt.', { details: { questionIds: duplicates } })
  }

  const unknown = answers.filter((answer) => {
    const question = getQuestion(answer.questionId)
    return !question || !belongsTo(category, question)
  })
  if (unknown.length) {
    throw unprocessable('UNKNOWN_QUESTION', 'Some answers are for questions that are not part of this quiz.', {
      details: { questionIds: unknown.map((answer) => answer.questionId) },
    })
  }

  const outOfRange = answers.filter((answer) => answer.selectedAnswer >= getQuestion(answer.questionId).options.length)
  if (outOfRange.length) {
    throw badRequest('INVALID_SELECTED_ANSWER', 'An answer refers to an option that does not exist.', {
      details: { questionIds: outOfRange.map((answer) => answer.questionId) },
    })
  }

  if (category.isMixed) {
    const perCategory = new Map(topicCategories.map((topic) => [topic.id, 0]))
    for (const answer of answers) {
      const topicId = getQuestion(answer.questionId).categoryId
      perCategory.set(topicId, (perCategory.get(topicId) ?? 0) + 1)
    }
    const balanced = [...perCategory.values()].every((count) => count === category.questionsPerCategory)
    if (!balanced) {
      throw unprocessable(
        'INVALID_QUESTION_SET',
        `The Mixed Challenge needs exactly ${category.questionsPerCategory} questions from each topic.`,
      )
    }
  } else {
    const answered = new Set(ids)
    const missing = category.questionIds.filter((id) => !answered.has(id))
    if (missing.length) {
      throw unprocessable('INVALID_QUESTION_SET', 'Answer every question in this quiz before submitting.', {
        details: { missingQuestionIds: missing },
      })
    }
  }
}

function confidenceSummary(answers) {
  const rated = answers.filter((answer) => answer.confidenceRating !== null && answer.confidenceRating !== undefined)
  const average = (values) =>
    values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10 : null
  const correct = rated.filter((answer) => answer.isCorrect).map((answer) => answer.confidenceRating)
  const incorrect = rated.filter((answer) => !answer.isCorrect).map((answer) => answer.confidenceRating)
  return {
    rated: rated.length,
    averageWhenCorrect: average(correct),
    averageWhenIncorrect: average(incorrect),
    highConfidenceWrong: incorrect.filter((value) => value >= 4).length,
  }
}

export function attemptSummary(attempt) {
  return {
    id: attempt.id,
    category: attempt.category,
    categoryTitle: getCategory(attempt.category)?.title ?? attempt.category,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percent: percentOf(attempt.score, attempt.totalQuestions),
    completedAt: attempt.completedAt,
    clientAttemptId: attempt.clientAttemptId,
  }
}

/** Full result: per-question correctness, explanations, per-topic breakdown, and confidence summary. */
export function attemptDetail(attempt, answers) {
  const byCategory = {}
  const items = answers.map((answer) => {
    const question = getQuestion(answer.questionId)
    const topicId = question?.categoryId ?? 'retired'
    byCategory[topicId] ??= { correct: 0, total: 0 }
    byCategory[topicId].total += 1
    if (answer.isCorrect) byCategory[topicId].correct += 1
    return {
      questionId: answer.questionId,
      categoryId: question?.categoryId ?? null,
      position: answer.position,
      selectedAnswer: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
      correctAnswer: question?.answer ?? null,
      confidenceRating: answer.confidenceRating,
      explanation: question?.explanation ?? null,
      credits: question?.credits ?? [],
    }
  })
  return { ...attemptSummary(attempt), byCategory, confidence: confidenceSummary(items), answers: items }
}

export async function getAttempt(repo, attemptId) {
  const attempt = await repo.getQuizAttempt(attemptId)
  if (!attempt) throw notFound('ATTEMPT_NOT_FOUND', 'This quiz attempt was not found.')
  return attemptDetail(attempt, await repo.listQuizAnswers(attempt.id))
}

export async function listAttempts(repo, { category, limit }) {
  if (category) requireCategory(category)
  const attempts = await repo.listQuizAttempts({ category, limit })
  return attempts.map(attemptSummary)
}

/** Scores and stores an attempt. Retrying with the same clientAttemptId returns the stored attempt. */
export async function submitAttempt(repo, categoryId, { answers, clientAttemptId }) {
  const category = requireCategory(categoryId)
  validateAnswerSet(category, answers)
  const { id, created } = await repo.submitQuizAttempt({ category: category.id, answers, clientAttemptId })
  const attempt = await repo.getQuizAttempt(id)
  if (!attempt) {
    throw new AppError(502, 'ATTEMPT_UNAVAILABLE', 'Your attempt was saved but could not be loaded. Please refresh.', {
      cause: { context: 'quiz attempt missing after submit', attemptId: id },
    })
  }
  return { attempt: attemptDetail(attempt, await repo.listQuizAnswers(id)), created }
}

export { confidenceSummary, percentOf }
