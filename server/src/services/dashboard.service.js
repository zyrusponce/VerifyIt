/*
  ⚡ LAYER: Service (dashboard aggregation)
  🔒 SECURITY: Aggregates only the verified user's own records (user-scoped repository + RLS).
     Nothing is estimated: a user with no history gets zeros and empty lists.
  🚨 ERROR HANDLING: Any failed query rejects the whole dashboard (mapped AppError); partial
     dashboards are never returned as if complete.
*/
import { quizCategories } from '../data/quizzes.js'
import { getLessonProgress } from './lessons.service.js'
import { attemptSummary, confidenceSummary } from './quizzes.service.js'
import { PROGRESS_ATTEMPT_LIMIT, attemptResponse, summarizeCases } from './investigations.service.js'
import { summarizeToolkit } from './toolkit.service.js'
import { getEligibility } from './certificates.service.js'

const QUIZ_HISTORY_LIMIT = 1000
const RATED_ANSWER_LIMIT = 10000

function byConfidenceLevel(answers) {
  return [1, 2, 3, 4, 5].map((level) => {
    const atLevel = answers.filter((answer) => answer.confidenceRating === level)
    return { level, answered: atLevel.length, correct: atLevel.filter((answer) => answer.isCorrect).length }
  })
}

function summarizeQuizzes(attempts) {
  const categories = quizCategories.map((category) => {
    const mine = attempts.filter((attempt) => attempt.category === category.id)
    const best = mine.reduce((top, attempt) => {
      if (!top) return attempt
      const percent = attempt.score / attempt.totalQuestions
      const topPercent = top.score / top.totalQuestions
      return percent > topPercent || (percent === topPercent && attempt.completedAt < top.completedAt) ? attempt : top
    }, null)
    return {
      category: category.id,
      title: category.title,
      attempts: mine.length,
      best: best ? attemptSummary(best) : null,
      latest: mine[0] ? attemptSummary(mine[0]) : null,
    }
  })
  return {
    totalAttempts: attempts.length,
    historyTruncated: attempts.length >= QUIZ_HISTORY_LIMIT,
    latestAttempts: attempts.slice(0, 10).map(attemptSummary),
    categories,
  }
}

export async function buildDashboard(repo, config, logger) {
  const [lessons, quizAttempts, ratedAnswers, caseAttempts, toolkitRecords, certificate] = await Promise.all([
    getLessonProgress(repo),
    repo.listQuizAttempts({ limit: QUIZ_HISTORY_LIMIT }),
    repo.listRatedQuizAnswers({ limit: RATED_ANSWER_LIMIT }),
    repo.listInvestigationAttempts({ limit: PROGRESS_ATTEMPT_LIMIT }),
    repo.listToolkitProgress(),
    getEligibility(repo, config, logger),
  ])

  const ratedCases = caseAttempts.filter((attempt) => attempt.confidenceRating !== null)

  return {
    lessons,
    quizzes: summarizeQuizzes(quizAttempts),
    investigations: {
      ...summarizeCases(caseAttempts),
      historyTruncated: caseAttempts.length >= PROGRESS_ATTEMPT_LIMIT,
      history: caseAttempts.slice(0, 20).map(attemptResponse),
    },
    confidence: {
      quiz: { ...confidenceSummary(ratedAnswers), byLevel: byConfidenceLevel(ratedAnswers) },
      investigations: { ...confidenceSummary(ratedCases), byLevel: byConfidenceLevel(ratedCases) },
    },
    toolkit: summarizeToolkit(toolkitRecords),
    certificate,
  }
}
