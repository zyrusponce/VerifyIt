// Exercises the real SQL migrations (schema, RLS, privileges, scoring, eligibility, issuance)
// in an in-memory Postgres. No Supabase project or network access is needed.
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { asAnon, asUser, createTestDatabase, createUser, rpc } from './harness.js'
import { buildCatalogSyncSql } from '../../src/data/catalogSql.js'
import { latestCatalogMigration } from '../../scripts/generate-catalog-seed.js'
import { REQUIRED_LESSON_IDS } from '../../src/data/lessons.js'
import { REQUIRED_CASE_IDS, getCase, investigationCases } from '../../src/data/investigations.js'
import { MIXED_CATEGORY_ID, getCategory, getQuestion, quizCategories, topicCategories } from '../../src/data/quizzes.js'
import { TOOLKIT_ITEM_IDS } from '../../src/data/toolkit.js'

let db

beforeAll(async () => {
  db = await createTestDatabase()
})

// ---------- helpers ----------

const UPSERT_LESSON = `insert into public.lesson_progress (user_id, lesson_id, completed) values ($1, $2, $3)
  on conflict (user_id, lesson_id) do update
  set user_id = excluded.user_id, lesson_id = excluded.lesson_id, completed = excluded.completed`

async function completeLessons(userId, lessonIds = REQUIRED_LESSON_IDS) {
  await asUser(db, userId, async (tx) => {
    for (const lessonId of lessonIds) await tx.query(UPSERT_LESSON, [userId, lessonId, true])
  })
}

async function submitCase(userId, caseId, verdict, { confidence = null, clientAttemptId = null } = {}) {
  const row = await rpc(db, userId, 'select public.submit_investigation_attempt($1, $2, $3, $4) as result', [
    caseId,
    verdict,
    confidence,
    clientAttemptId,
  ])
  return row.result
}

async function submitAllCases(userId, caseIds = REQUIRED_CASE_IDS) {
  for (const caseId of caseIds) await submitCase(userId, caseId, 'insufficient')
}

function wrongAnswer(question) {
  return (question.answer + 1) % question.options.length
}

/** Answers every question of a topic category; the first `correctCount` answers are correct. */
function topicAnswers(categoryId, correctCount) {
  return getCategory(categoryId).questionIds.map((id, index) => {
    const question = getQuestion(id)
    return {
      question_id: id,
      selected_answer: index < correctCount ? question.answer : wrongAnswer(question),
      confidence_rating: (index % 5) + 1,
    }
  })
}

async function submitQuiz(userId, category, answers, clientAttemptId = null) {
  const row = await rpc(db, userId, 'select public.submit_quiz_attempt($1, $2::jsonb, $3) as result', [
    category,
    JSON.stringify(answers),
    clientAttemptId,
  ])
  return row.result
}

async function eligibility(userId) {
  return (await rpc(db, userId, 'select public.get_certificate_eligibility() as result')).result
}

async function issue(userId, name) {
  return (await rpc(db, userId, 'select public.issue_certificate($1) as result', [name])).result
}

async function verify(number) {
  return asAnon(db, async (tx) => (await tx.query('select public.verify_certificate($1) as result', [number])).rows[0].result)
}

// ---------- tests ----------

describe('catalog sync', () => {
  it('seeds every lesson, case, quiz category, question, and toolkit item from the server catalog', async () => {
    const count = async (table) => (await db.query(`select count(*)::int as n from ${table} where active`)).rows[0].n
    expect(await count('private.lessons')).toBe(REQUIRED_LESSON_IDS.length)
    expect(await count('private.investigation_cases')).toBe(investigationCases.length)
    expect(await count('private.quiz_categories')).toBe(quizCategories.length)
    expect(await count('private.quiz_questions')).toBe(topicCategories.reduce((sum, c) => sum + c.questionIds.length, 0))
    expect(await count('private.toolkit_items')).toBe(TOOLKIT_ITEM_IDS.length)
  })

  it('stores the same answer keys and verdicts as the server catalog', async () => {
    // Retired questions stay in the table (inactive) so old attempts keep their references.
    const { rows } = await db.query('select id, correct_option from private.quiz_questions where active')
    for (const row of rows) expect(row.correct_option).toBe(getQuestion(row.id).answer)
    const retired = await db.query('select id from private.quiz_questions where not active')
    for (const row of retired.rows) expect(getQuestion(row.id)).toBeNull()
    const cases = await db.query('select id, expected_verdict from private.investigation_cases')
    for (const row of cases.rows) expect(row.expected_verdict).toBe(getCase(row.id).expected)
  })

  it('has a catalog migration that matches the current catalog (run `npm run catalog:seed` if this fails)', () => {
    const latest = latestCatalogMigration()
    expect(latest).not.toBeNull()
    expect(fs.readFileSync(latest, 'utf8').replaceAll('\r\n', '\n')).toBe(buildCatalogSyncSql())
  })
})

describe('profiles', () => {
  it('creates a profile with the sign-up display name', async () => {
    const userId = await createUser(db, { displayName: '  Ada   Lovelace ' })
    const profile = await asUser(db, userId, async (tx) => (await tx.query('select * from public.profiles')).rows)
    expect(profile).toHaveLength(1)
    expect(profile[0].display_name).toBe('Ada Lovelace')
  })

  it('creates the profile without a name when the sign-up name is unusable', async () => {
    const userId = await createUser(db, { displayName: 'x' })
    const { rows } = await db.query('select display_name from public.profiles where id = $1', [userId])
    expect(rows[0].display_name).toBeNull()
  })

  it('lets users rename themselves but not other users', async () => {
    const alice = await createUser(db, { displayName: 'Alice' })
    const bob = await createUser(db, { displayName: 'Bob' })
    await asUser(db, alice, (tx) => tx.query('update public.profiles set display_name = $1 where id = $2', ['Alice Cruz', alice]))
    const hijack = await asUser(db, alice, (tx) => tx.query('update public.profiles set display_name = $1 where id = $2', ['Hacked', bob]))
    expect(hijack.affectedRows).toBe(0)
    const { rows } = await db.query('select id, display_name from public.profiles where id in ($1, $2) order by display_name', [alice, bob])
    expect(rows.map((r) => r.display_name)).toEqual(['Alice Cruz', 'Bob'])
  })

  it('rejects display names that are blank, too long, or untrimmed', async () => {
    const userId = await createUser(db)
    for (const bad of ['', ' padded ', 'a'.repeat(81), 'tab\there']) {
      await expect(
        asUser(db, userId, (tx) => tx.query('update public.profiles set display_name = $1 where id = $2', [bad, userId])),
      ).rejects.toThrow(/profiles_display_name_valid/)
    }
  })
})

describe('row level security', () => {
  it('never returns another user\'s progress, attempts, or certificates', async () => {
    const alice = await createUser(db, { displayName: 'Alice Reyes' })
    const bob = await createUser(db, { displayName: 'Bob Santos' })
    await completeLessons(alice)
    await submitAllCases(alice)
    await submitQuiz(alice, 'deepfakes', topicAnswers('deepfakes', 5))
    await issue(alice, 'Alice Reyes')

    const seenByBob = await asUser(db, bob, async (tx) => {
      const tables = ['profiles', 'lesson_progress', 'quiz_attempts', 'quiz_answer_results', 'investigation_attempts', 'toolkit_progress', 'certificates']
      const result = {}
      for (const table of tables) result[table] = (await tx.query(`select * from public.${table}`)).rows
      return result
    })
    expect(seenByBob.profiles.map((p) => p.id)).toEqual([bob])
    for (const table of ['lesson_progress', 'quiz_attempts', 'quiz_answer_results', 'investigation_attempts', 'certificates']) {
      expect(seenByBob[table], table).toEqual([])
    }
  })

  it('prevents inserting progress for another user', async () => {
    const alice = await createUser(db)
    const bob = await createUser(db)
    await expect(asUser(db, alice, (tx) => tx.query(UPSERT_LESSON, [bob, REQUIRED_LESSON_IDS[0], true]))).rejects.toThrow(
      /row-level security/,
    )
    await expect(
      asUser(db, alice, (tx) =>
        tx.query('insert into public.toolkit_progress (user_id, item_id, checked) values ($1, $2, true)', [bob, TOOLKIT_ITEM_IDS[0]]),
      ),
    ).rejects.toThrow(/row-level security/)
  })

  it('prevents updating another user\'s rows', async () => {
    const alice = await createUser(db)
    const bob = await createUser(db)
    await completeLessons(bob, [REQUIRED_LESSON_IDS[0]])
    const result = await asUser(db, alice, (tx) => tx.query('update public.lesson_progress set completed = false'))
    expect(result.affectedRows).toBe(0)
    const { rows } = await db.query('select completed from public.lesson_progress where user_id = $1', [bob])
    expect(rows[0].completed).toBe(true)
  })

  it('blocks direct writes to attempts and certificates, even for your own user id', async () => {
    const alice = await createUser(db)
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("insert into public.quiz_attempts (user_id, category, score, total_questions) values ($1, 'deepfakes', 10, 10)", [alice]),
      ),
    ).rejects.toThrow(/permission denied/)
    await expect(
      asUser(db, alice, (tx) =>
        tx.query("insert into public.investigation_attempts (user_id, case_id, selected_verdict, is_correct) values ($1, $2, 'misleading', true)", [
          alice,
          REQUIRED_CASE_IDS[0],
        ]),
      ),
    ).rejects.toThrow(/permission denied/)
    await expect(
      asUser(db, alice, (tx) =>
        tx.query(
          "insert into public.certificates (user_id, certificate_number, recipient_name) values ($1, 'VIT-0000-0000-0000-0000', 'Alice')",
          [alice],
        ),
      ),
    ).rejects.toThrow(/permission denied/)
    await expect(asUser(db, alice, (tx) => tx.query('update public.quiz_attempts set score = 99'))).rejects.toThrow(/permission denied/)
  })

  it('hides the answer keys and catalog from API roles', async () => {
    const alice = await createUser(db)
    await expect(asUser(db, alice, (tx) => tx.query('select * from private.quiz_questions'))).rejects.toThrow(/permission denied/)
    await expect(asAnon(db, (tx) => tx.query('select * from private.investigation_cases'))).rejects.toThrow(/permission denied/)
  })

  it('gives anonymous callers no access to user data or protected functions', async () => {
    await expect(asAnon(db, (tx) => tx.query('select * from public.certificates'))).rejects.toThrow(/permission denied/)
    await expect(asAnon(db, (tx) => tx.query('select * from public.profiles'))).rejects.toThrow(/permission denied/)
    await expect(asAnon(db, (tx) => tx.query("select public.issue_certificate('Someone')"))).rejects.toThrow(/permission denied/)
    await expect(asAnon(db, (tx) => tx.query("select public.submit_quiz_attempt('deepfakes', '[]'::jsonb)"))).rejects.toThrow(
      /permission denied/,
    )
  })
})

describe('lesson progress', () => {
  it('sets completion timestamps in the database and keeps the first completion time', async () => {
    const userId = await createUser(db)
    const lessonId = REQUIRED_LESSON_IDS[0]
    await completeLessons(userId, [lessonId])
    const first = (await db.query('select completed_at from public.lesson_progress where user_id = $1', [userId])).rows[0]
    expect(first.completed_at).toBeInstanceOf(Date)
    await completeLessons(userId, [lessonId])
    const second = (await db.query('select count(*)::int as n, min(completed_at) as at from public.lesson_progress where user_id = $1', [userId]))
      .rows[0]
    expect(second.n).toBe(1)
    expect(second.at.getTime()).toBe(first.completed_at.getTime())
  })

  it('rejects unknown lesson ids', async () => {
    const userId = await createUser(db)
    await expect(asUser(db, userId, (tx) => tx.query(UPSERT_LESSON, [userId, 'not-a-lesson', true]))).rejects.toThrow(/foreign key/)
  })
})

describe('submit_quiz_attempt', () => {
  it('scores answers against the private answer key', async () => {
    const userId = await createUser(db)
    const { attempt_id: attemptId, created } = await submitQuiz(userId, 'source-credibility', topicAnswers('source-credibility', 7))
    expect(created).toBe(true)
    const attempt = (await db.query('select * from public.quiz_attempts where id = $1', [attemptId])).rows[0]
    expect(attempt).toMatchObject({ user_id: userId, category: 'source-credibility', score: 7, total_questions: 10 })
    const answers = (await db.query('select * from public.quiz_answer_results where attempt_id = $1 order by position', [attemptId])).rows
    expect(answers).toHaveLength(10)
    expect(answers.filter((a) => a.is_correct)).toHaveLength(7)
    expect(answers[0].confidence_rating).toBe(1)
  })

  it('returns the original attempt when the same client attempt id is submitted again', async () => {
    const userId = await createUser(db)
    const clientAttemptId = randomUUID()
    const first = await submitQuiz(userId, 'deepfakes', topicAnswers('deepfakes', 3), clientAttemptId)
    const retry = await submitQuiz(userId, 'deepfakes', topicAnswers('deepfakes', 10), clientAttemptId)
    expect(retry).toEqual({ attempt_id: first.attempt_id, created: false })
    const { rows } = await db.query('select score from public.quiz_attempts where user_id = $1', [userId])
    expect(rows).toEqual([{ score: 3 }])
  })

  it('accepts a valid Mixed Challenge draw and rejects an unbalanced one', async () => {
    const userId = await createUser(db)
    const perCategory = getCategory(MIXED_CATEGORY_ID).questionsPerCategory
    const draw = topicCategories.flatMap((category) =>
      category.questionIds.slice(0, perCategory).map((id) => ({ question_id: id, selected_answer: getQuestion(id).answer })),
    )
    const result = await submitQuiz(userId, MIXED_CATEGORY_ID, draw)
    const attempt = (await db.query('select score, total_questions from public.quiz_attempts where id = $1', [result.attempt_id])).rows[0]
    expect(attempt).toEqual({ score: draw.length, total_questions: draw.length })

    const unbalanced = [...draw.slice(1), { question_id: topicCategories[1].questionIds[perCategory], selected_answer: 0 }]
    await expect(submitQuiz(userId, MIXED_CATEGORY_ID, unbalanced)).rejects.toThrow(/INVALID_QUESTION_SET/)
  })

  it.each([
    ['an unknown category', 'not-a-category', () => topicAnswers('deepfakes', 1), /UNKNOWN_CATEGORY/],
    ['an incomplete answer set', 'deepfakes', () => topicAnswers('deepfakes', 1).slice(1), /INVALID_QUESTION_SET/],
    [
      'a question from another category',
      'deepfakes',
      () => [...topicAnswers('deepfakes', 1).slice(1), { question_id: topicCategories[0].questionIds[0], selected_answer: 0 }],
      /INVALID_QUESTION_SET/,
    ],
    ['an unknown question', 'deepfakes', () => [{ question_id: 'nope-01', selected_answer: 0 }], /UNKNOWN_QUESTION/],
    [
      'a duplicated question',
      'deepfakes',
      () => {
        const answers = topicAnswers('deepfakes', 1)
        answers[1] = { ...answers[0] }
        return answers
      },
      /DUPLICATE_QUESTION/,
    ],
    [
      'a confidence rating outside 1-5',
      'deepfakes',
      () => topicAnswers('deepfakes', 1).map((a, i) => (i === 0 ? { ...a, confidence_rating: 6 } : a)),
      /INVALID_CONFIDENCE/,
    ],
    [
      'an answer index outside the options',
      'deepfakes',
      () => topicAnswers('deepfakes', 1).map((a, i) => (i === 0 ? { ...a, selected_answer: 7 } : a)),
      /INVALID_SELECTED_ANSWER/,
    ],
    [
      'a non-integer answer',
      'deepfakes',
      () => topicAnswers('deepfakes', 1).map((a, i) => (i === 0 ? { ...a, selected_answer: 1.5 } : a)),
      /INVALID_ANSWERS/,
    ],
    ['an empty answer list', 'deepfakes', () => [], /INVALID_ANSWERS/],
  ])('rejects %s', async (_label, category, buildAnswers, error) => {
    const userId = await createUser(db)
    await expect(submitQuiz(userId, category, buildAnswers())).rejects.toThrow(error)
  })
})

describe('submit_investigation_attempt', () => {
  it('decides correctness from the private expected verdict', async () => {
    const userId = await createUser(db)
    const item = getCase(REQUIRED_CASE_IDS[0])
    const wrong = ['supported', 'misleading', 'insufficient'].find((v) => v !== item.expected)
    await submitCase(userId, item.id, item.expected, { confidence: 4 })
    await submitCase(userId, item.id, wrong)
    const { rows } = await db.query(
      'select selected_verdict, is_correct, confidence_rating from public.investigation_attempts where user_id = $1 order by submitted_at, is_correct desc',
      [userId],
    )
    expect(rows).toEqual([
      { selected_verdict: item.expected, is_correct: true, confidence_rating: 4 },
      { selected_verdict: wrong, is_correct: false, confidence_rating: null },
    ])
  })

  it('rejects unknown cases, verdicts, and confidence values', async () => {
    const userId = await createUser(db)
    await expect(submitCase(userId, 'not-a-case', 'misleading')).rejects.toThrow(/UNKNOWN_CASE/)
    await expect(submitCase(userId, REQUIRED_CASE_IDS[0], 'fake')).rejects.toThrow(/INVALID_VERDICT/)
    await expect(submitCase(userId, REQUIRED_CASE_IDS[0], 'misleading', { confidence: 0 })).rejects.toThrow(/INVALID_CONFIDENCE/)
  })

  it('is idempotent per client attempt id', async () => {
    const userId = await createUser(db)
    const clientAttemptId = randomUUID()
    const first = await submitCase(userId, REQUIRED_CASE_IDS[0], 'misleading', { clientAttemptId })
    const again = await submitCase(userId, REQUIRED_CASE_IDS[0], 'misleading', { clientAttemptId })
    expect(again).toEqual({ attempt_id: first.attempt_id, created: false })
    await expect(submitCase(userId, REQUIRED_CASE_IDS[1], 'misleading', { clientAttemptId })).rejects.toThrow(/CLIENT_ATTEMPT_ID_CONFLICT/)
  })
})

describe('certificate eligibility', () => {
  it('is not eligible with no progress', async () => {
    const userId = await createUser(db)
    expect(await eligibility(userId)).toEqual({
      eligible: false,
      completed_lessons: 0,
      required_lessons: REQUIRED_LESSON_IDS.length,
      completed_cases: 0,
      required_cases: REQUIRED_CASE_IDS.length,
      missing_lesson_ids: REQUIRED_LESSON_IDS,
      missing_case_ids: REQUIRED_CASE_IDS,
    })
  })

  it('is not eligible with every lesson but missing cases', async () => {
    const userId = await createUser(db)
    await completeLessons(userId)
    await submitAllCases(userId, REQUIRED_CASE_IDS.slice(1))
    const result = await eligibility(userId)
    expect(result.eligible).toBe(false)
    expect(result.missing_case_ids).toEqual([REQUIRED_CASE_IDS[0]])
  })

  it('is not eligible with every case but missing lessons', async () => {
    const userId = await createUser(db)
    await completeLessons(userId, REQUIRED_LESSON_IDS.slice(0, -1))
    await submitAllCases(userId)
    const result = await eligibility(userId)
    expect(result.eligible).toBe(false)
    expect(result.missing_lesson_ids).toEqual([REQUIRED_LESSON_IDS.at(-1)])
  })

  it('does not count a lesson that was marked incomplete again', async () => {
    const userId = await createUser(db)
    await completeLessons(userId)
    await submitAllCases(userId)
    await asUser(db, userId, (tx) => tx.query(UPSERT_LESSON, [userId, REQUIRED_LESSON_IDS[0], false]))
    expect((await eligibility(userId)).eligible).toBe(false)
  })

  it('is eligible after every lesson and one submission per case, right or wrong', async () => {
    const userId = await createUser(db)
    await completeLessons(userId)
    await submitAllCases(userId)
    expect(await eligibility(userId)).toMatchObject({
      eligible: true,
      completed_lessons: REQUIRED_LESSON_IDS.length,
      completed_cases: REQUIRED_CASE_IDS.length,
      missing_lesson_ids: [],
      missing_case_ids: [],
    })
  })
})

describe('issue_certificate and verify_certificate', () => {
  async function eligibleUser(displayName = 'Maria Clara Santos') {
    const userId = await createUser(db, { displayName })
    await completeLessons(userId)
    await submitAllCases(userId)
    return userId
  }

  it('refuses ineligible users', async () => {
    const userId = await createUser(db)
    await completeLessons(userId)
    await expect(issue(userId, 'Juan Dela Cruz')).rejects.toThrow(/NOT_ELIGIBLE/)
    expect((await db.query('select count(*)::int as n from public.certificates where user_id = $1', [userId])).rows[0].n).toBe(0)
  })

  it('requires a valid recipient name', async () => {
    const userId = await eligibleUser()
    for (const bad of [null, '', ' ', 'x', 'a'.repeat(81)]) {
      await expect(issue(userId, bad)).rejects.toThrow(/INVALID_RECIPIENT_NAME/)
    }
  })

  it('issues one certificate and returns the same one on repeated requests', async () => {
    const userId = await eligibleUser()
    const first = await issue(userId, '  Maria   Clara Santos ')
    expect(first.created).toBe(true)
    const second = await issue(userId, 'A Different Name')
    expect(second).toEqual({ certificate_id: first.certificate_id, created: false })
    const { rows } = await db.query('select * from public.certificates where user_id = $1', [userId])
    expect(rows).toHaveLength(1)
    expect(rows[0].recipient_name).toBe('Maria Clara Santos')
    expect(rows[0].status).toBe('active')
    expect(rows[0].certificate_number).toMatch(/^VIT-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/)
  })

  it('enforces one active certificate per user in the schema itself', async () => {
    const userId = await eligibleUser()
    await issue(userId, 'Maria Clara Santos')
    await expect(
      db.query("insert into public.certificates (user_id, certificate_number, recipient_name) values ($1, 'VIT-AAAA-BBBB-CCCC-DDDD', 'Copy Cat')", [
        userId,
      ]),
    ).rejects.toThrow(/certificates_one_active_per_type/)
  })

  it('generates distinct, non-sequential certificate numbers', async () => {
    const numbers = []
    for (let i = 0; i < 4; i += 1) {
      const userId = await eligibleUser(`Student Number ${i}`)
      const { certificate_id: id } = await issue(userId, `Student Number ${i}`)
      numbers.push((await db.query('select certificate_number from public.certificates where id = $1', [id])).rows[0].certificate_number)
    }
    expect(new Set(numbers).size).toBe(numbers.length)
  })

  it('verifies a valid certificate publicly without exposing private data', async () => {
    const userId = await eligibleUser()
    const { certificate_id: id } = await issue(userId, 'Maria Clara Santos')
    const { certificate_number: number } = (await db.query('select certificate_number from public.certificates where id = $1', [id])).rows[0]
    const result = await verify(number.toLowerCase())
    expect(Object.keys(result).sort()).toEqual(['certificate_number', 'certificate_type', 'issued_at', 'recipient_name', 'revoked_at', 'status'])
    expect(result).toMatchObject({ certificate_number: number, status: 'active', recipient_name: 'Maria Clara Santos', revoked_at: null })
    expect(JSON.stringify(result)).not.toContain(userId)
  })

  it('reports revoked certificates as revoked and hides the name', async () => {
    const userId = await eligibleUser()
    const { certificate_id: id } = await issue(userId, 'Maria Clara Santos')
    await db.query("update public.certificates set status = 'revoked', revoked_at = now() where id = $1", [id])
    const { certificate_number: number } = (await db.query('select certificate_number from public.certificates where id = $1', [id])).rows[0]
    const result = await verify(number)
    expect(result.status).toBe('revoked')
    expect(result.recipient_name).toBeNull()
  })

  it('returns null for unknown certificate numbers', async () => {
    expect(await verify('VIT-0000-0000-0000-0000')).toBeNull()
  })
})
