import { lessons } from '../data/lessons'
import { investigations } from '../data/investigations'
import { categoryTitle, quizCategories, topicCategories } from '../data/quizCategories'

// All localStorage keys used by VerifyIT live here so they are easy to find.
export const STORAGE_KEYS = {
  lessons: 'verifyit:lessons',
  investigations: 'verifyit:investigations',
  quizCategories: 'verifyit:quiz-categories',
  checklist: 'verifyit:checklist',
  // Finished guest quiz attempts with their answers, so they can be re-scored by the server when the
  // guest later saves their progress to an account.
  guestQuizAttempts: 'verifyit:guest-quiz-attempts',
  // Saved scores and sessions from the old single "Real or Misleading?" quiz. Only used to clean up on reset.
  legacyQuiz: 'verifyit:quiz',
  legacyQuizSession: 'verifyit:quiz-session',
}

/**
 * Key for an in-progress (or just finished) attempt of one category quiz.
 * Guests use the original key; signed-in users get their own key so people sharing a browser
 * never see each other's unfinished quizzes.
 */
export function quizSessionKey(categoryId, ownerId = null) {
  return ownerId ? `verifyit:quiz-session:${ownerId}:${categoryId}` : `verifyit:quiz-session:${categoryId}`
}

// A score at or above this percentage counts as "Mastered" on the category cards.
export const MASTERY_PERCENT = 80

export const EMPTY_CATEGORY_RECORD = { latest: null, best: null, attempts: 0, completed: false }

/**
 * Adds a finished attempt to one category's saved record.
 * The best score only changes when the new score is equal or higher.
 */
export function addAttempt(record = EMPTY_CATEGORY_RECORD, result) {
  const best = !record?.best || result.percent >= record.best.percent ? result : record.best
  return {
    latest: result,
    best,
    attempts: (record?.attempts ?? 0) + 1,
    completed: true,
  }
}

/** Short status label for a category card. */
export function categoryStatus(record, hasSessionInProgress = false) {
  if (hasSessionInProgress) return 'in-progress'
  if (record?.best?.percent >= MASTERY_PERCENT) return 'mastered'
  if (record?.completed) return 'completed'
  return 'not-started'
}

/** Overall performance across every quiz category. */
export function summarizeQuizzes(quizRecords = {}) {
  const rows = quizCategories.map((category) => ({ category, record: quizRecords?.[category.id] ?? EMPTY_CATEGORY_RECORD }))
  const attempted = rows.filter((row) => row.record.completed && row.record.best)

  const latest = attempted
    .map((row) => row.record.latest)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] ?? null
  const best = attempted.map((row) => row.record.best).sort((a, b) => b.percent - a.percent)[0] ?? null
  const averageBest = attempted.length
    ? Math.round(attempted.reduce((sum, row) => sum + row.record.best.percent, 0) / attempted.length)
    : null

  return {
    completedCount: attempted.length,
    categoryCount: quizCategories.length,
    masteredCount: attempted.filter((row) => row.record.best.percent >= MASTERY_PERCENT).length,
    totalAttempts: rows.reduce((sum, row) => sum + (row.record.attempts ?? 0), 0),
    averageBest,
    latest: latest && { ...latest, categoryTitle: categoryTitle[latest.categoryId] },
    best: best && { ...best, categoryTitle: categoryTitle[best.categoryId] },
  }
}

/** Combines saved lesson, investigation, and quiz data into numbers the UI can show. */
export function summarizeProgress(lessonProgress = {}, caseProgress = {}, quizRecords = {}) {
  const completedLessonIds = lessons.filter((lesson) => lessonProgress[lesson.id]?.completed).map((l) => l.id)
  const completedCaseIds = investigations.filter((item) => caseProgress[item.id]?.completed).map((c) => c.id)
  const quiz = summarizeQuizzes(quizRecords)

  // Strengths and weaknesses use the best score in each single-topic category quiz.
  const categoryStats = topicCategories.map((category) => {
    const best = quizRecords?.[category.id]?.best
    return {
      id: category.id,
      label: category.title,
      correct: best?.score ?? 0,
      total: best?.total ?? 0,
      percent: best ? best.percent : null,
    }
  })

  const scored = categoryStats.filter((category) => category.percent !== null)
  const strengths = scored.filter((category) => category.percent >= 75)
  const improvements = scored.filter((category) => category.percent < 75)

  const suggestedLesson =
    findLessonForWeakestCategory(improvements, completedLessonIds) ??
    lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    null

  const hasAnyProgress =
    completedLessonIds.length > 0 ||
    completedCaseIds.length > 0 ||
    Object.keys(caseProgress).length > 0 ||
    quiz.completedCount > 0

  return {
    completedLessonIds,
    completedCaseIds,
    lessonCount: lessons.length,
    caseCount: investigations.length,
    latestQuiz: quiz.latest,
    bestQuiz: quiz.best,
    quizAttempts: quiz.totalAttempts,
    quiz,
    categoryStats,
    strengths,
    improvements,
    suggestedLesson,
    hasAnyProgress,
  }
}

function findLessonForWeakestCategory(improvements, completedLessonIds) {
  const weakest = [...improvements].sort((a, b) => a.percent - b.percent)
  for (const category of weakest) {
    const lesson = lessons.find(
      (item) => item.relatedCategories.includes(category.id) && !completedLessonIds.includes(item.id),
    )
    if (lesson) return lesson
  }
  return null
}

export function formatDate(isoString) {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}
