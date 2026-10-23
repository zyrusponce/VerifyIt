/*
  ⚡ LAYER: Data Access
  🔒 SECURITY: Every query runs through a client carrying the signed-in user's JWT, so Row Level
     Security applies. Queries also filter by the verified user id explicitly (defense in depth).
     Scores, correctness, eligibility, and certificates are computed by SECURITY DEFINER SQL functions.
  🚨 ERROR HANDLING: Supabase/Postgres errors are mapped by toAppError (domain codes → 400/401/409/422,
     constraint codes → 400/409/422, connectivity → 503, anything else → 502) with the operation name
     attached for the logs.
*/
import { toAppError } from '../utils/databaseErrors.js'
import {
  COLUMNS,
  mapCertificate,
  mapEligibility,
  mapInvestigationAttempt,
  mapLessonProgress,
  mapProfile,
  mapQuizAnswer,
  mapQuizAttempt,
  mapRatedAnswer,
  mapSubmission,
  mapToolkitProgress,
  mapVerification,
} from './mappers.js'

async function run(query, context) {
  let result
  try {
    result = await query
  } catch (error) {
    throw toAppError(error, context)
  }
  if (result?.error) throw toAppError(result.error, context)
  return result?.data ?? null
}

const many = (rows, mapper) => (Array.isArray(rows) ? rows.map(mapper) : [])
const one = (row, mapper) => (row ? mapper(row) : null)

export function createSupabaseRepository(db, userId) {
  return {
    userId,

    // ---- profiles ----
    async getProfile() {
      const row = await run(db.from('profiles').select(COLUMNS.profile).eq('id', userId).maybeSingle(), 'profiles.get')
      return one(row, mapProfile)
    },
    async createProfile() {
      await run(
        db.from('profiles').upsert({ id: userId, display_name: null }, { onConflict: 'id', ignoreDuplicates: true }),
        'profiles.create',
      )
    },
    async updateDisplayName(displayName) {
      const row = await run(
        db.from('profiles').update({ display_name: displayName }).eq('id', userId).select(COLUMNS.profile).maybeSingle(),
        'profiles.updateDisplayName',
      )
      return one(row, mapProfile)
    },

    // ---- lessons ----
    async listLessonProgress() {
      const rows = await run(db.from('lesson_progress').select(COLUMNS.lessonProgress).eq('user_id', userId), 'lessonProgress.list')
      return many(rows, mapLessonProgress)
    },
    async getLessonProgress(lessonId) {
      const row = await run(
        db.from('lesson_progress').select(COLUMNS.lessonProgress).eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle(),
        'lessonProgress.get',
      )
      return one(row, mapLessonProgress)
    },
    async completeLesson(lessonId) {
      const row = await run(
        db
          .from('lesson_progress')
          .upsert({ user_id: userId, lesson_id: lessonId, completed: true }, { onConflict: 'user_id,lesson_id' })
          .select(COLUMNS.lessonProgress)
          .single(),
        'lessonProgress.complete',
      )
      return mapLessonProgress(row)
    },

    // ---- quizzes ----
    async submitQuizAttempt({ category, answers, clientAttemptId }) {
      const data = await run(
        db.rpc('submit_quiz_attempt', {
          p_category: category,
          p_answers: answers.map((answer) => ({
            question_id: answer.questionId,
            selected_answer: answer.selectedAnswer,
            confidence_rating: answer.confidenceRating ?? null,
          })),
          p_client_attempt_id: clientAttemptId ?? null,
        }),
        'rpc.submit_quiz_attempt',
      )
      return mapSubmission(data, 'attempt_id')
    },
    async listQuizAttempts({ category, limit }) {
      let query = db.from('quiz_attempts').select(COLUMNS.quizAttempt).eq('user_id', userId)
      if (category) query = query.eq('category', category)
      const rows = await run(query.order('completed_at', { ascending: false }).limit(limit), 'quizAttempts.list')
      return many(rows, mapQuizAttempt)
    },
    async getQuizAttempt(attemptId) {
      const row = await run(
        db.from('quiz_attempts').select(COLUMNS.quizAttempt).eq('user_id', userId).eq('id', attemptId).maybeSingle(),
        'quizAttempts.get',
      )
      return one(row, mapQuizAttempt)
    },
    async listQuizAnswers(attemptId) {
      // The attempt was already loaded for this user; RLS additionally limits answers to owned attempts.
      const rows = await run(
        db.from('quiz_answer_results').select(COLUMNS.quizAnswer).eq('attempt_id', attemptId).order('position', { ascending: true }),
        'quizAnswers.list',
      )
      return many(rows, mapQuizAnswer)
    },
    async listRatedQuizAnswers({ limit }) {
      const rows = await run(
        db
          .from('quiz_answer_results')
          .select('is_correct, confidence_rating, quiz_attempts!inner(user_id)')
          .eq('quiz_attempts.user_id', userId)
          .not('confidence_rating', 'is', null)
          .limit(limit),
        'quizAnswers.listRated',
      )
      return many(rows, mapRatedAnswer)
    },

    // ---- investigations ----
    async submitInvestigationAttempt({ caseId, verdict, confidenceRating, clientAttemptId }) {
      const data = await run(
        db.rpc('submit_investigation_attempt', {
          p_case_id: caseId,
          p_verdict: verdict,
          p_confidence_rating: confidenceRating ?? null,
          p_client_attempt_id: clientAttemptId ?? null,
        }),
        'rpc.submit_investigation_attempt',
      )
      return mapSubmission(data, 'attempt_id')
    },
    async getInvestigationAttempt(attemptId) {
      const row = await run(
        db.from('investigation_attempts').select(COLUMNS.investigationAttempt).eq('user_id', userId).eq('id', attemptId).maybeSingle(),
        'investigationAttempts.get',
      )
      return one(row, mapInvestigationAttempt)
    },
    async listInvestigationAttempts({ caseId, limit }) {
      let query = db.from('investigation_attempts').select(COLUMNS.investigationAttempt).eq('user_id', userId)
      if (caseId) query = query.eq('case_id', caseId)
      const rows = await run(query.order('submitted_at', { ascending: false }).limit(limit), 'investigationAttempts.list')
      return many(rows, mapInvestigationAttempt)
    },

    // ---- toolkit ----
    async listToolkitProgress() {
      const rows = await run(db.from('toolkit_progress').select(COLUMNS.toolkitProgress).eq('user_id', userId), 'toolkitProgress.list')
      return many(rows, mapToolkitProgress)
    },
    async saveToolkitProgress(items, { keepExisting }) {
      await run(
        db.from('toolkit_progress').upsert(
          items.map((item) => ({ user_id: userId, item_id: item.itemId, checked: item.checked })),
          { onConflict: 'user_id,item_id', ignoreDuplicates: keepExisting },
        ),
        'toolkitProgress.save',
      )
    },

    // ---- certificates ----
    async getEligibility() {
      return mapEligibility(await run(db.rpc('get_certificate_eligibility'), 'rpc.get_certificate_eligibility'))
    },
    async issueCertificate(recipientName) {
      const data = await run(db.rpc('issue_certificate', { p_recipient_name: recipientName }), 'rpc.issue_certificate')
      return mapSubmission(data, 'certificate_id')
    },
    async listCertificates() {
      const rows = await run(
        db.from('certificates').select(COLUMNS.certificate).eq('user_id', userId).order('issued_at', { ascending: false }),
        'certificates.list',
      )
      return many(rows, mapCertificate)
    },
    async getCertificate(certificateId) {
      const row = await run(
        db.from('certificates').select(COLUMNS.certificate).eq('user_id', userId).eq('id', certificateId).maybeSingle(),
        'certificates.get',
      )
      return one(row, mapCertificate)
    },
  }
}

/** Operations allowed without signing in. */
export function createSupabasePublicRepository(db) {
  return {
    async verifyCertificate(certificateNumber) {
      const data = await run(db.rpc('verify_certificate', { p_certificate_number: certificateNumber }), 'rpc.verify_certificate')
      return mapVerification(data)
    },
  }
}
