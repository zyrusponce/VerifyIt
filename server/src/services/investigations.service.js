/*
  ⚡ LAYER: Service (Investigation Lab)
  🔒 SECURITY: Expected verdicts stay on the server and are revealed only after a submission.
     Persisted correctness is decided by the submit_investigation_attempt SQL function.
     A case counts as completed only when a submission is saved, never when its page is opened.
  🚨 ERROR HANDLING: Unknown case → 404 CASE_NOT_FOUND; invalid verdict/confidence → 400 (schema);
     attempt missing after save → 502.
*/
import { REQUIRED_CASE_IDS, getCase, investigationCases, toPublicCase, verdictLabel } from '../data/investigations.js'
import { AppError, notFound } from '../utils/AppError.js'

function requireCase(caseId) {
  const item = getCase(caseId)
  if (!item) throw notFound('CASE_NOT_FOUND', 'This investigation case does not exist.')
  return item
}

export function listCases() {
  return {
    cases: investigationCases.map(toPublicCase),
    verdicts: Object.entries(verdictLabel).map(([id, label]) => ({ id, label })),
  }
}

function revealResult(item, verdict) {
  return {
    isCorrect: verdict === item.expected,
    selectedVerdict: verdict,
    expectedVerdict: item.expected,
    explanation: item.explanation,
  }
}

/** Reveals the expected verdict for a guest submission. Nothing is stored. */
export function checkVerdict(caseId, { verdict }) {
  const item = requireCase(caseId)
  return { caseId: item.id, ...revealResult(item, verdict) }
}

const attemptResponse = (attempt) => ({
  id: attempt.id,
  caseId: attempt.caseId,
  caseTitle: getCase(attempt.caseId)?.title ?? attempt.caseId,
  selectedVerdict: attempt.selectedVerdict,
  isCorrect: attempt.isCorrect,
  confidenceRating: attempt.confidenceRating,
  submittedAt: attempt.submittedAt,
  clientAttemptId: attempt.clientAttemptId,
})

export async function submitAttempt(repo, caseId, { verdict, confidenceRating, clientAttemptId }) {
  const item = requireCase(caseId)
  const { id, created } = await repo.submitInvestigationAttempt({ caseId: item.id, verdict, confidenceRating, clientAttemptId })
  const attempt = await repo.getInvestigationAttempt(id)
  if (!attempt) {
    throw new AppError(502, 'ATTEMPT_UNAVAILABLE', 'Your investigation was saved but could not be loaded. Please refresh.', {
      cause: { context: 'investigation attempt missing after submit', attemptId: id },
    })
  }
  // Report the stored verdict (a retried submission returns the original attempt).
  return {
    attempt: attemptResponse(attempt),
    result: { ...revealResult(item, attempt.selectedVerdict), isCorrect: attempt.isCorrect },
    created,
  }
}

export async function listAttempts(repo, { caseId, limit }) {
  if (caseId) requireCase(caseId)
  return (await repo.listInvestigationAttempts({ caseId, limit })).map(attemptResponse)
}

/** One row per case: attempts, completion (any saved submission), whether any attempt was correct, latest attempt. */
export function summarizeCases(attempts) {
  const cases = investigationCases.map((item) => {
    const mine = attempts.filter((attempt) => attempt.caseId === item.id)
    const latest = mine.reduce((newest, attempt) => (!newest || attempt.submittedAt > newest.submittedAt ? attempt : newest), null)
    return {
      caseId: item.id,
      title: item.title,
      requiredForCertificate: item.requiredForCertificate,
      completed: mine.length > 0,
      attempts: mine.length,
      solved: mine.some((attempt) => attempt.isCorrect),
      latest: latest ? attemptResponse(latest) : null,
    }
  })
  return {
    cases,
    completed: cases.filter((item) => item.completed && REQUIRED_CASE_IDS.includes(item.caseId)).length,
    required: REQUIRED_CASE_IDS.length,
  }
}

export const PROGRESS_ATTEMPT_LIMIT = 1000

export async function getProgress(repo) {
  return summarizeCases(await repo.listInvestigationAttempts({ limit: PROGRESS_ATTEMPT_LIMIT }))
}

export { attemptResponse }
