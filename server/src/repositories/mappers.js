// Converts database rows (snake_case, Date or ISO strings) into the camelCase records the services use.
// Shared by the Supabase repository and the test repository so both return identical shapes.

export function toIso(value) {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export const mapProfile = (row) => ({
  id: row.id,
  displayName: row.display_name ?? null,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

export const mapLessonProgress = (row) => ({
  lessonId: row.lesson_id,
  completed: Boolean(row.completed),
  completedAt: toIso(row.completed_at),
  updatedAt: toIso(row.updated_at),
})

export const mapQuizAttempt = (row) => ({
  id: row.id,
  category: row.category,
  score: Number(row.score),
  totalQuestions: Number(row.total_questions),
  completedAt: toIso(row.completed_at),
  clientAttemptId: row.client_attempt_id ?? null,
})

export const mapQuizAnswer = (row) => ({
  attemptId: row.attempt_id,
  questionId: row.question_id,
  position: Number(row.position),
  selectedAnswer: Number(row.selected_answer),
  isCorrect: Boolean(row.is_correct),
  confidenceRating: row.confidence_rating === null || row.confidence_rating === undefined ? null : Number(row.confidence_rating),
})

export const mapRatedAnswer = (row) => ({
  isCorrect: Boolean(row.is_correct),
  confidenceRating: Number(row.confidence_rating),
})

export const mapInvestigationAttempt = (row) => ({
  id: row.id,
  caseId: row.case_id,
  selectedVerdict: row.selected_verdict,
  isCorrect: Boolean(row.is_correct),
  confidenceRating: row.confidence_rating === null || row.confidence_rating === undefined ? null : Number(row.confidence_rating),
  submittedAt: toIso(row.submitted_at),
  clientAttemptId: row.client_attempt_id ?? null,
})

export const mapToolkitProgress = (row) => ({
  itemId: row.item_id,
  checked: Boolean(row.checked),
  updatedAt: toIso(row.updated_at),
})

export const mapCertificate = (row) => ({
  id: row.id,
  certificateNumber: row.certificate_number,
  certificateType: row.certificate_type,
  recipientName: row.recipient_name,
  issuedAt: toIso(row.issued_at),
  status: row.status,
  revokedAt: toIso(row.revoked_at),
})

export const mapEligibility = (data) => ({
  eligible: data?.eligible === true,
  completedLessons: Number(data?.completed_lessons ?? 0),
  requiredLessons: Number(data?.required_lessons ?? 0),
  completedCases: Number(data?.completed_cases ?? 0),
  requiredCases: Number(data?.required_cases ?? 0),
  missingLessonIds: Array.isArray(data?.missing_lesson_ids) ? data.missing_lesson_ids : [],
  missingCaseIds: Array.isArray(data?.missing_case_ids) ? data.missing_case_ids : [],
})

export const mapVerification = (data) =>
  data
    ? {
        certificateNumber: data.certificate_number,
        certificateType: data.certificate_type,
        status: data.status,
        issuedAt: toIso(data.issued_at),
        revokedAt: toIso(data.revoked_at),
        recipientName: data.recipient_name ?? null,
      }
    : null

/** Result of the submit_* and issue_* functions: { <id>, created }. */
export const mapSubmission = (data, idKey) => {
  const id = data?.[idKey]
  if (!id) throw new TypeError(`Database function returned no ${idKey}`)
  return { id, created: data.created === true }
}

export const COLUMNS = {
  profile: 'id, display_name, created_at, updated_at',
  lessonProgress: 'lesson_id, completed, completed_at, updated_at',
  quizAttempt: 'id, category, score, total_questions, completed_at, client_attempt_id',
  quizAnswer: 'attempt_id, question_id, position, selected_answer, is_correct, confidence_rating',
  investigationAttempt: 'id, case_id, selected_verdict, is_correct, confidence_rating, submitted_at, client_attempt_id',
  toolkitProgress: 'item_id, checked, updated_at',
  certificate: 'id, certificate_number, certificate_type, recipient_name, issued_at, status, revoked_at',
}
