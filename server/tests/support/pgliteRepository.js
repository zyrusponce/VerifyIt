// Test implementation of the repository interface (see src/repositories/supabaseRepository.js) that runs
// SQL against the real migrations in PGlite as the signed-in user, so RLS and the SQL functions apply
// exactly as they would through PostgREST.
import { asAnon, asUser } from '../db/harness.js'
import { toAppError } from '../../src/utils/databaseErrors.js'
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
} from '../../src/repositories/mappers.js'

export function createPgliteRepositories(db) {
  return {
    forUser: (_token, userId) => createPgliteRepository(db, userId),
    public: () => ({
      async verifyCertificate(certificateNumber) {
        try {
          const { rows } = await asAnon(db, (tx) => tx.query('select public.verify_certificate($1) as result', [certificateNumber]))
          return mapVerification(rows[0].result)
        } catch (error) {
          throw toAppError(error, 'rpc.verify_certificate')
        }
      },
    }),
  }
}

function createPgliteRepository(db, userId) {
  async function query(sql, params, context) {
    try {
      return (await asUser(db, userId, (tx) => tx.query(sql, params))).rows
    } catch (error) {
      throw toAppError(error, context)
    }
  }
  const first = (rows, mapper) => (rows[0] ? mapper(rows[0]) : null)

  return {
    userId,

    async getProfile() {
      return first(await query(`select ${COLUMNS.profile} from public.profiles where id = $1`, [userId], 'profiles.get'), mapProfile)
    },
    async createProfile() {
      await query('insert into public.profiles (id, display_name) values ($1, null) on conflict (id) do nothing', [userId], 'profiles.create')
    },
    async updateDisplayName(displayName) {
      return first(
        await query(`update public.profiles set display_name = $2 where id = $1 returning ${COLUMNS.profile}`, [userId, displayName], 'profiles.update'),
        mapProfile,
      )
    },

    async listLessonProgress() {
      return (await query(`select ${COLUMNS.lessonProgress} from public.lesson_progress where user_id = $1`, [userId], 'lessonProgress.list')).map(
        mapLessonProgress,
      )
    },
    async getLessonProgress(lessonId) {
      return first(
        await query(`select ${COLUMNS.lessonProgress} from public.lesson_progress where user_id = $1 and lesson_id = $2`, [userId, lessonId], 'lessonProgress.get'),
        mapLessonProgress,
      )
    },
    async completeLesson(lessonId) {
      // Same statement PostgREST generates for upsert(..., { onConflict: 'user_id,lesson_id' }).
      const rows = await query(
        `insert into public.lesson_progress (user_id, lesson_id, completed) values ($1, $2, true)
         on conflict (user_id, lesson_id) do update
         set user_id = excluded.user_id, lesson_id = excluded.lesson_id, completed = excluded.completed
         returning ${COLUMNS.lessonProgress}`,
        [userId, lessonId],
        'lessonProgress.complete',
      )
      return mapLessonProgress(rows[0])
    },

    async submitQuizAttempt({ category, answers, clientAttemptId }) {
      const payload = answers.map((answer) => ({
        question_id: answer.questionId,
        selected_answer: answer.selectedAnswer,
        confidence_rating: answer.confidenceRating ?? null,
      }))
      const rows = await query(
        'select public.submit_quiz_attempt($1, $2::jsonb, $3) as result',
        [category, JSON.stringify(payload), clientAttemptId ?? null],
        'rpc.submit_quiz_attempt',
      )
      return mapSubmission(rows[0].result, 'attempt_id')
    },
    async listQuizAttempts({ category, limit }) {
      const rows = category
        ? await query(
            `select ${COLUMNS.quizAttempt} from public.quiz_attempts where user_id = $1 and category = $2 order by completed_at desc limit $3`,
            [userId, category, limit],
            'quizAttempts.list',
          )
        : await query(
            `select ${COLUMNS.quizAttempt} from public.quiz_attempts where user_id = $1 order by completed_at desc limit $2`,
            [userId, limit],
            'quizAttempts.list',
          )
      return rows.map(mapQuizAttempt)
    },
    async getQuizAttempt(attemptId) {
      return first(
        await query(`select ${COLUMNS.quizAttempt} from public.quiz_attempts where user_id = $1 and id = $2`, [userId, attemptId], 'quizAttempts.get'),
        mapQuizAttempt,
      )
    },
    async listQuizAnswers(attemptId) {
      return (
        await query(`select ${COLUMNS.quizAnswer} from public.quiz_answer_results where attempt_id = $1 order by position`, [attemptId], 'quizAnswers.list')
      ).map(mapQuizAnswer)
    },
    async listRatedQuizAnswers({ limit }) {
      return (
        await query(
          `select r.is_correct, r.confidence_rating from public.quiz_answer_results r
           join public.quiz_attempts a on a.id = r.attempt_id
           where a.user_id = $1 and r.confidence_rating is not null limit $2`,
          [userId, limit],
          'quizAnswers.listRated',
        )
      ).map(mapRatedAnswer)
    },

    async submitInvestigationAttempt({ caseId, verdict, confidenceRating, clientAttemptId }) {
      const rows = await query(
        'select public.submit_investigation_attempt($1, $2, $3, $4) as result',
        [caseId, verdict, confidenceRating ?? null, clientAttemptId ?? null],
        'rpc.submit_investigation_attempt',
      )
      return mapSubmission(rows[0].result, 'attempt_id')
    },
    async getInvestigationAttempt(attemptId) {
      return first(
        await query(
          `select ${COLUMNS.investigationAttempt} from public.investigation_attempts where user_id = $1 and id = $2`,
          [userId, attemptId],
          'investigationAttempts.get',
        ),
        mapInvestigationAttempt,
      )
    },
    async listInvestigationAttempts({ caseId, limit }) {
      const rows = caseId
        ? await query(
            `select ${COLUMNS.investigationAttempt} from public.investigation_attempts where user_id = $1 and case_id = $2 order by submitted_at desc limit $3`,
            [userId, caseId, limit],
            'investigationAttempts.list',
          )
        : await query(
            `select ${COLUMNS.investigationAttempt} from public.investigation_attempts where user_id = $1 order by submitted_at desc limit $2`,
            [userId, limit],
            'investigationAttempts.list',
          )
      return rows.map(mapInvestigationAttempt)
    },

    async listToolkitProgress() {
      return (await query(`select ${COLUMNS.toolkitProgress} from public.toolkit_progress where user_id = $1`, [userId], 'toolkitProgress.list')).map(
        mapToolkitProgress,
      )
    },
    async saveToolkitProgress(items, { keepExisting }) {
      const conflict = keepExisting
        ? 'do nothing'
        : 'do update set user_id = excluded.user_id, item_id = excluded.item_id, checked = excluded.checked'
      for (const item of items) {
        await query(
          `insert into public.toolkit_progress (user_id, item_id, checked) values ($1, $2, $3) on conflict (user_id, item_id) ${conflict}`,
          [userId, item.itemId, item.checked],
          'toolkitProgress.save',
        )
      }
    },

    async getEligibility() {
      const rows = await query('select public.get_certificate_eligibility() as result', [], 'rpc.get_certificate_eligibility')
      return mapEligibility(rows[0].result)
    },
    async issueCertificate(recipientName) {
      const rows = await query('select public.issue_certificate($1) as result', [recipientName], 'rpc.issue_certificate')
      return mapSubmission(rows[0].result, 'certificate_id')
    },
    async listCertificates() {
      return (
        await query(`select ${COLUMNS.certificate} from public.certificates where user_id = $1 order by issued_at desc`, [userId], 'certificates.list')
      ).map(mapCertificate)
    },
    async getCertificate(certificateId) {
      return first(
        await query(`select ${COLUMNS.certificate} from public.certificates where user_id = $1 and id = $2`, [userId, certificateId], 'certificates.get'),
        mapCertificate,
      )
    },
  }
}
