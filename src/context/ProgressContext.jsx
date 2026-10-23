import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useAuth from '../hooks/useAuth'
import useLocalStorage from '../hooks/useLocalStorage'
import { api, newClientId } from '../lib/api'
import { discardFailed, enqueue, flushOutbox, onOutboxChange, readOutbox } from '../lib/outbox'
import { importGuestProgress, pendingGuestItems } from '../lib/guestSync'
import { STORAGE_KEYS, addAttempt, quizSessionKey, summarizeProgress } from '../utils/progress'
import { quizCategories } from '../data/quizCategories'
import { checklistItems } from '../data/checklist'

export const ProgressContext = createContext(null)

const MAX_GUEST_QUIZ_ATTEMPTS = 100

// ---- Dashboard (server) → the record shapes the pages already use ----

function toQuizResult(summary) {
  if (!summary) return null
  return {
    categoryId: summary.category,
    score: summary.score,
    total: summary.totalQuestions,
    percent: summary.percent,
    date: summary.completedAt,
  }
}

function accountLessonProgress(dashboard) {
  return Object.fromEntries(
    (dashboard?.lessons?.items ?? []).filter((item) => item.completed).map((item) => [item.lessonId, { completed: true, completedAt: item.completedAt }]),
  )
}

function accountCaseProgress(dashboard) {
  return Object.fromEntries(
    (dashboard?.investigations?.cases ?? [])
      .filter((item) => item.completed && item.latest)
      .map((item) => [
        item.caseId,
        {
          completed: true,
          correct: item.latest.isCorrect,
          solved: item.solved,
          assessment: item.latest.selectedVerdict,
          attempts: item.attempts,
          completedAt: item.latest.submittedAt,
        },
      ]),
  )
}

function accountQuizRecords(dashboard) {
  return Object.fromEntries(
    (dashboard?.quizzes?.categories ?? [])
      .filter((item) => item.attempts > 0)
      .map((item) => [item.category, { latest: toQuizResult(item.latest), best: toQuizResult(item.best), attempts: item.attempts, completed: true }]),
  )
}

/** Converts a server quiz attempt into the result shape the quiz screens display. */
export function attemptToResult(attempt) {
  return {
    categoryId: attempt.category,
    score: attempt.score,
    total: attempt.totalQuestions,
    percent: attempt.percent,
    byCategory: attempt.byCategory,
    confidence: attempt.confidence,
    date: attempt.completedAt,
  }
}

/**
 * One source of learning progress for the whole app.
 * Guests: everything lives in this browser's localStorage (unchanged keys).
 * Signed in: progress is loaded from the API (/dashboard) and every change goes through the API.
 * Failed account saves are queued in a per-user outbox and retried; nothing is silently discarded.
 */
export function ProgressProvider({ children }) {
  const { status: authStatus, user } = useAuth()
  const userId = authStatus === 'signedIn' ? (user?.id ?? null) : null
  const mode = userId ? 'account' : 'guest'

  // Guest progress (this browser).
  const [guestLessons, setGuestLessons, resetGuestLessons] = useLocalStorage(STORAGE_KEYS.lessons, {})
  const [guestCases, setGuestCases, resetGuestCases] = useLocalStorage(STORAGE_KEYS.investigations, {})
  const [guestQuizRecords, setGuestQuizRecords, resetGuestQuizRecords] = useLocalStorage(STORAGE_KEYS.quizCategories, {})
  const [guestChecklist, setGuestChecklist, resetGuestChecklist] = useLocalStorage(STORAGE_KEYS.checklist, {})
  const [guestQuizAttempts, setGuestQuizAttempts, resetGuestQuizAttempts] = useLocalStorage(STORAGE_KEYS.guestQuizAttempts, [])

  // Account progress (server).
  const [dashboard, setDashboard] = useState(null)
  const [accountStatus, setAccountStatus] = useState('idle')
  const [accountError, setAccountError] = useState(null)
  const [checklistOverrides, setChecklistOverrides] = useState({})
  const [toolkitSave, setToolkitSave] = useState({ state: 'idle', error: null })
  const [outbox, setOutbox] = useState([])
  const [guestImport, setGuestImport] = useState({ state: 'idle' })
  const [markersVersion, setMarkersVersion] = useState(0)
  const dashboardRequest = useRef(0)
  const toolkitRequest = useRef(0)

  const refresh = useCallback(async () => {
    if (!userId) return null
    const requestId = ++dashboardRequest.current
    setAccountStatus((current) => (current === 'ready' ? 'ready' : 'loading'))
    try {
      const data = await api.get('/dashboard', { auth: true })
      if (dashboardRequest.current !== requestId) return null
      setDashboard(data)
      setAccountError(null)
      setAccountStatus('ready')
      return data
    } catch (error) {
      if (dashboardRequest.current !== requestId) return null
      setAccountError(error)
      // Keep showing the last good data during a failed background refresh.
      setAccountStatus((current) => (current === 'ready' ? 'ready' : 'error'))
      return null
    }
  }, [userId])

  const syncOutbox = useCallback(async () => {
    if (!userId) return null
    const result = await flushOutbox(userId)
    if (result.sent > 0) await refresh()
    return result
  }, [userId, refresh])

  // Switching user (sign in/out) resets account state, sends anything queued, then loads progress.
  useEffect(() => {
    dashboardRequest.current += 1
    setDashboard(null)
    setAccountError(null)
    setChecklistOverrides({})
    setToolkitSave({ state: 'idle', error: null })
    setGuestImport({ state: 'idle' })
    setOutbox(readOutbox(userId))
    setAccountStatus(userId ? 'loading' : 'idle')
    if (!userId) return
    flushOutbox(userId).finally(() => refresh())
  }, [userId, refresh])

  useEffect(() => {
    if (!userId) return undefined
    const stopWatching = onOutboxChange(() => setOutbox(readOutbox(userId)))
    const retryWhenOnline = () => syncOutbox()
    window.addEventListener('online', retryWhenOnline)
    return () => {
      stopWatching()
      window.removeEventListener('online', retryWhenOnline)
    }
  }, [userId, syncOutbox])

  // ---- Lessons ----
  const completeLesson = useCallback(
    async (lessonId, { correct, total }) => {
      if (!userId) {
        setGuestLessons((prev) => ({
          ...prev,
          [lessonId]: { completed: true, correct, total, score: Math.round((correct / total) * 100), completedAt: new Date().toISOString() },
        }))
        return { state: 'browser' }
      }
      try {
        await api.put(`/lessons/progress/${encodeURIComponent(lessonId)}`, { completed: true }, { auth: true })
        refresh()
        return { state: 'account' }
      } catch (error) {
        if (error.isRetryable) {
          enqueue(userId, { type: 'lesson', lessonId })
          return { state: 'pending', error }
        }
        return { state: 'failed', error }
      }
    },
    [userId, refresh, setGuestLessons],
  )

  // ---- Investigation Lab ----
  /** Throws ApiError when the result could not be obtained; the page keeps the user's answer for a retry. */
  const submitCase = useCallback(
    async (caseId, { verdict, confidenceRating, inspectedCount, clientAttemptId }) => {
      const confidence = Number.isInteger(confidenceRating) ? confidenceRating : undefined
      if (!userId) {
        const result = await api.post(`/investigations/${encodeURIComponent(caseId)}/check`, { verdict })
        setGuestCases((prev) => ({
          ...prev,
          [caseId]: {
            completed: true,
            correct: result.isCorrect,
            assessment: verdict,
            confidence: confidence ?? null,
            inspectedCount,
            attempts: (prev?.[caseId]?.attempts ?? 0) + 1,
            completedAt: new Date().toISOString(),
            clientAttemptId: newClientId(),
          },
        }))
        return { ...result, saved: 'browser' }
      }
      const data = await api.post(
        `/investigations/${encodeURIComponent(caseId)}/attempts`,
        { verdict, ...(confidence ? { confidenceRating: confidence } : {}), clientAttemptId },
        { auth: true },
      )
      refresh()
      return { ...data.result, saved: 'account' }
    },
    [userId, refresh, setGuestCases],
  )

  // ---- Quizzes ----
  const checkQuizAnswer = useCallback(
    (categoryId, questionId, selectedAnswer) =>
      api.post(`/quizzes/${encodeURIComponent(categoryId)}/check`, { questionId, selectedAnswer }),
    [],
  )

  /**
   * Records a finished attempt. Guests: saved in this browser with its answers (for later import).
   * Signed in: scored and stored by the server; on a network failure it is queued for retry.
   */
  const recordQuizAttempt = useCallback(
    async (categoryId, { clientAttemptId, answers, localResult }) => {
      if (!userId) {
        setGuestQuizRecords((prev) => ({ ...prev, [categoryId]: addAttempt(prev?.[categoryId], localResult) }))
        setGuestQuizAttempts((prev) =>
          [
            ...(Array.isArray(prev) ? prev : []).filter((attempt) => attempt.clientAttemptId !== clientAttemptId),
            { clientAttemptId, category: categoryId, answers, completedAt: localResult.date },
          ].slice(-MAX_GUEST_QUIZ_ATTEMPTS),
        )
        return { state: 'browser', result: localResult }
      }
      const body = { clientAttemptId, answers }
      try {
        const attempt = await api.post(`/quizzes/${encodeURIComponent(categoryId)}/attempts`, body, { auth: true })
        refresh()
        return { state: 'account', result: attemptToResult(attempt) }
      } catch (error) {
        if (error.isRetryable) {
          enqueue(userId, { type: 'quiz', category: categoryId, body })
          return { state: 'pending', result: localResult, error }
        }
        return { state: 'failed', result: localResult, error }
      }
    },
    [userId, refresh, setGuestQuizRecords, setGuestQuizAttempts],
  )

  // ---- Verification Toolkit ----
  const saveToolkit = useCallback(
    async (items) => {
      const requestId = ++toolkitRequest.current
      setToolkitSave({ state: 'saving', error: null })
      try {
        const progress = await api.put('/toolkit/progress', { items }, { auth: true })
        if (toolkitRequest.current !== requestId) return
        setDashboard((prev) => (prev ? { ...prev, toolkit: progress } : prev))
        setChecklistOverrides({})
        setToolkitSave({ state: 'saved', error: null })
      } catch (error) {
        // Queue the change even if a newer save started meanwhile, so it is never silently lost.
        if (error.isRetryable) enqueue(userId, { type: 'toolkit', items })
        if (toolkitRequest.current !== requestId) return
        setToolkitSave({ state: 'error', error })
      }
    },
    [userId],
  )

  const setChecklistItem = useCallback(
    (itemId, checked) => {
      if (!userId) {
        setGuestChecklist((prev) => ({ ...prev, [itemId]: checked }))
        return
      }
      setChecklistOverrides((prev) => ({ ...prev, [itemId]: checked }))
      saveToolkit([{ itemId, checked }])
    },
    [userId, saveToolkit, setGuestChecklist],
  )

  const resetChecklist = useCallback(() => {
    if (!userId) {
      resetGuestChecklist()
      return
    }
    setChecklistOverrides(Object.fromEntries(checklistItems.map((item) => [item.id, false])))
    saveToolkit(checklistItems.map((item) => ({ itemId: item.id, checked: false })))
  }, [userId, saveToolkit, resetGuestChecklist])

  // ---- Guest data ----
  const resetGuestProgress = useCallback(() => {
    resetGuestLessons()
    resetGuestCases()
    resetGuestQuizRecords()
    resetGuestChecklist()
    resetGuestQuizAttempts()
    try {
      quizCategories.forEach((category) => window.localStorage.removeItem(quizSessionKey(category.id)))
      window.localStorage.removeItem(STORAGE_KEYS.legacyQuiz)
      window.localStorage.removeItem(STORAGE_KEYS.legacyQuizSession)
    } catch {
      // Storage blocked: the keys above were already reset through useLocalStorage.
    }
  }, [resetGuestLessons, resetGuestCases, resetGuestQuizRecords, resetGuestChecklist, resetGuestQuizAttempts])

  const pendingGuest = useMemo(
    () =>
      pendingGuestItems(userId, {
        lessonProgress: guestLessons,
        caseProgress: guestCases,
        quizAttempts: guestQuizAttempts,
        quizRecords: guestQuizRecords,
        checklist: guestChecklist,
      }),
    // markersVersion changes after an import so the pending list is recomputed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, guestLessons, guestCases, guestQuizAttempts, guestQuizRecords, guestChecklist, markersVersion],
  )

  const importGuest = useCallback(async () => {
    if (!userId) return
    setGuestImport({ state: 'importing', done: 0, total: pendingGuest.total })
    const outcome = await importGuestProgress(userId, pendingGuest, {
      onProgress: ({ done, total }) => setGuestImport({ state: 'importing', done, total }),
    })
    setMarkersVersion((version) => version + 1)
    await refresh()
    setGuestImport({ state: outcome.error ? 'error' : 'done', ...outcome })
  }, [userId, pendingGuest, refresh])

  // ---- Exposed values ----
  const accountLessons = useMemo(() => accountLessonProgress(dashboard), [dashboard])
  const accountCases = useMemo(() => accountCaseProgress(dashboard), [dashboard])
  const accountQuizzes = useMemo(() => accountQuizRecords(dashboard), [dashboard])
  const accountChecklist = useMemo(() => ({ ...(dashboard?.toolkit?.items ?? {}), ...checklistOverrides }), [dashboard, checklistOverrides])

  const lessonProgress = mode === 'account' ? accountLessons : guestLessons
  const caseProgress = mode === 'account' ? accountCases : guestCases
  const quizRecords = mode === 'account' ? accountQuizzes : guestQuizRecords
  const checklist = mode === 'account' ? accountChecklist : guestChecklist

  const summary = useMemo(() => summarizeProgress(lessonProgress, caseProgress, quizRecords), [lessonProgress, caseProgress, quizRecords])

  const hasGuestData =
    Object.keys(guestLessons ?? {}).length > 0 ||
    Object.keys(guestCases ?? {}).length > 0 ||
    Object.keys(guestQuizRecords ?? {}).length > 0 ||
    Object.values(guestChecklist ?? {}).some(Boolean)

  const value = {
    mode,
    userId,
    accountStatus,
    accountError,
    dashboard,
    refresh,

    lessonProgress,
    caseProgress,
    quizRecords,
    checklist,
    summary,

    completeLesson,
    submitCase,
    checkQuizAnswer,
    recordQuizAttempt,
    setChecklistItem,
    resetChecklist,
    toolkitSave,

    outbox: {
      pending: outbox.filter((op) => !op.failed),
      failed: outbox.filter((op) => op.failed),
      retry: syncOutbox,
      discardFailed: () => discardFailed(userId),
    },

    guest: {
      hasData: hasGuestData,
      pending: pendingGuest,
      importState: guestImport,
      importToAccount: importGuest,
      dismissImport: () => setGuestImport({ state: 'idle' }),
      reset: resetGuestProgress,
    },
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
