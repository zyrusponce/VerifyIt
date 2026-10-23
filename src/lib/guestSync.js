/*
  Saves progress made as a guest (in this browser) to the signed-in account.

  Guest data is never trusted as proof of anything: each item is replayed through the same validated
  API endpoints a signed-in user would call, so the server re-checks lesson ids, re-scores quiz answers,
  and re-decides investigation correctness. Every request is idempotent, so a failed import can simply be
  retried. Guest data stays in this browser until the user chooses to clear it.
*/
import { api } from './api'
import { lessons } from '../data/lessons'
import { investigations } from '../data/investigations'
import { checklistItems } from '../data/checklist'

const markerKey = (userId) => `verifyit:guest-sync:${userId}`
const EMPTY_MARKERS = { lessons: [], cases: [], quizzes: [], toolkit: [] }

export function readMarkers(userId) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(markerKey(userId)) ?? 'null')
    return { ...EMPTY_MARKERS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
  } catch {
    return { ...EMPTY_MARKERS }
  }
}

function addMarker(userId, kind, value) {
  const markers = readMarkers(userId)
  if (!markers[kind].includes(value)) markers[kind] = [...markers[kind], value]
  try {
    window.localStorage.setItem(markerKey(userId), JSON.stringify(markers))
  } catch {
    // Without markers the next import resends items; the server ignores the duplicates.
  }
}

/**
 * A stable UUID for guest case attempts saved before attempt ids existed, derived from the record,
 * so retrying an import reuses the same id and the server never stores the attempt twice.
 */
async function stableCaseAttemptId(caseId, record) {
  const input = new TextEncoder().encode(`verifyit-case|${caseId}|${record.completedAt ?? ''}|${record.assessment ?? ''}`)
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', input)).slice(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const caseMarker = (caseId, record) => record.clientAttemptId ?? `${caseId}|${record.completedAt ?? ''}`

/** Guest items in this browser that have not been saved to this account yet. */
export function pendingGuestItems(userId, { lessonProgress, caseProgress, quizAttempts, quizRecords, checklist }) {
  if (!userId) return { lessons: [], cases: [], quizzes: [], toolkit: [], legacyQuizScores: 0, total: 0 }
  const markers = readMarkers(userId)
  const pendingLessons = lessons.filter((lesson) => lessonProgress?.[lesson.id]?.completed && !markers.lessons.includes(lesson.id)).map((l) => l.id)
  const pendingCases = investigations
    .map((item) => ({ caseId: item.id, record: caseProgress?.[item.id] }))
    .filter(({ caseId, record }) => record?.completed && record.assessment && !markers.cases.includes(caseMarker(caseId, record)))
  const attempts = Array.isArray(quizAttempts) ? quizAttempts : []
  const pendingQuizzes = attempts.filter((attempt) => attempt?.clientAttemptId && !markers.quizzes.includes(attempt.clientAttemptId))
  const pendingToolkit = checklistItems.filter((item) => checklist?.[item.id] && !markers.toolkit.includes(item.id)).map((item) => item.id)

  // Scores saved before answers were kept locally cannot be re-scored by the server, so they stay in this browser.
  const recordedAttempts = Object.values(quizRecords ?? {}).reduce((sum, record) => sum + (record?.attempts ?? 0), 0)
  const legacyQuizScores = Math.max(0, recordedAttempts - attempts.length)

  return {
    lessons: pendingLessons,
    cases: pendingCases,
    quizzes: pendingQuizzes,
    toolkit: pendingToolkit,
    legacyQuizScores,
    total: pendingLessons.length + pendingCases.length + pendingQuizzes.length + (pendingToolkit.length ? 1 : 0),
  }
}

/**
 * Imports pending guest items one by one. Stops at the first retryable error (nothing is lost; run it
 * again later). Items the server permanently rejects are skipped and reported.
 * Returns { imported, skipped: [{ label, message }], error }.
 */
export async function importGuestProgress(userId, pending, { onProgress } = {}) {
  const tasks = [
    ...pending.lessons.map((lessonId) => ({
      label: lessons.find((lesson) => lesson.id === lessonId)?.title ?? lessonId,
      run: () => api.put(`/lessons/progress/${encodeURIComponent(lessonId)}`, { completed: true }, { auth: true }),
      mark: () => addMarker(userId, 'lessons', lessonId),
    })),
    ...pending.cases.map(({ caseId, record }) => ({
      label: investigations.find((item) => item.id === caseId)?.title ?? caseId,
      run: async () =>
        api.post(
          `/investigations/${encodeURIComponent(caseId)}/attempts`,
          {
            verdict: record.assessment,
            ...(Number.isInteger(record.confidence) ? { confidenceRating: record.confidence } : {}),
            clientAttemptId: record.clientAttemptId ?? (await stableCaseAttemptId(caseId, record)),
          },
          { auth: true },
        ),
      mark: () => addMarker(userId, 'cases', caseMarker(caseId, record)),
    })),
    ...pending.quizzes.map((attempt) => ({
      label: `Quiz attempt (${attempt.category})`,
      run: () =>
        api.post(
          `/quizzes/${encodeURIComponent(attempt.category)}/attempts`,
          { clientAttemptId: attempt.clientAttemptId, answers: attempt.answers },
          { auth: true },
        ),
      mark: () => addMarker(userId, 'quizzes', attempt.clientAttemptId),
    })),
    ...(pending.toolkit.length
      ? [
          {
            label: 'Verification Toolkit checklist',
            // keepExisting: never overwrite anything already saved in the account.
            run: () => api.put('/toolkit/progress', { keepExisting: true, items: pending.toolkit.map((itemId) => ({ itemId, checked: true })) }, { auth: true }),
            mark: () => pending.toolkit.forEach((itemId) => addMarker(userId, 'toolkit', itemId)),
          },
        ]
      : []),
  ]

  let imported = 0
  const skipped = []
  for (const [index, task] of tasks.entries()) {
    onProgress?.({ done: index, total: tasks.length })
    try {
      await task.run()
      task.mark()
      imported += 1
    } catch (error) {
      if (error?.isRetryable || error?.status === 401) return { imported, skipped, error }
      // Permanently rejected (for example content that no longer exists): report it and move on.
      skipped.push({ label: task.label, message: error?.message ?? 'Rejected by the server.' })
      task.mark()
    }
  }
  onProgress?.({ done: tasks.length, total: tasks.length })
  return { imported, skipped, error: null }
}
