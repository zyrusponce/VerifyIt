// Checks the supabase-js adapter with a recording mock client: correct tables, RPC names and arguments,
// and an explicit user filter on every user-owned query. (The SQL itself is covered by tests/db.)
import { describe, expect, it } from 'vitest'
import { createSupabaseAuthVerifier } from '../../src/config/supabase.js'
import { createSupabasePublicRepository, createSupabaseRepository } from '../../src/repositories/supabaseRepository.js'
import { AppError } from '../../src/utils/AppError.js'

const USER_ID = '6f1c2b4e-7f5d-4a3e-9b2a-0c1d2e3f4a5b'

function recordingClient(respond = () => ({ data: [], error: null })) {
  const calls = []
  function chain(entry) {
    const proxy = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === 'then') {
            return (resolve, reject) => Promise.resolve().then(() => respond(entry)).then(resolve, reject)
          }
          return (...args) => {
            entry.ops.push([prop, ...args])
            return proxy
          }
        },
      },
    )
    return proxy
  }
  return {
    calls,
    from(table) {
      const entry = { table, ops: [] }
      calls.push(entry)
      return chain(entry)
    },
    rpc(name, args) {
      const entry = { rpc: name, args, ops: [] }
      calls.push(entry)
      return chain(entry)
    },
  }
}

const hasOp = (entry, ...op) => entry.ops.some((recorded) => JSON.stringify(recorded) === JSON.stringify(op))

describe('Supabase repository', () => {
  it('filters every user-owned read by the verified user id', async () => {
    const client = recordingClient((entry) => ({ data: entry.ops.some(([op]) => op === 'maybeSingle') ? null : [], error: null }))
    const repo = createSupabaseRepository(client, USER_ID)
    await repo.getProfile()
    await repo.listLessonProgress()
    await repo.getLessonProgress('responsible-sharing')
    await repo.listQuizAttempts({ limit: 5 })
    await repo.getQuizAttempt('a')
    await repo.listInvestigationAttempts({ limit: 5 })
    await repo.getInvestigationAttempt('a')
    await repo.listToolkitProgress()
    await repo.listCertificates()
    await repo.getCertificate('a')
    await repo.listRatedQuizAnswers({ limit: 10 })

    for (const entry of client.calls) {
      const filtered =
        hasOp(entry, 'eq', 'user_id', USER_ID) || hasOp(entry, 'eq', 'id', USER_ID) || hasOp(entry, 'eq', 'quiz_attempts.user_id', USER_ID)
      expect(filtered, `${entry.table} ${JSON.stringify(entry.ops)}`).toBe(true)
    }
  })

  it('writes progress for the verified user with idempotent upserts', async () => {
    const client = recordingClient(() => ({ data: { lesson_id: 'responsible-sharing', completed: true, completed_at: '2026-01-01T00:00:00Z' }, error: null }))
    const repo = createSupabaseRepository(client, USER_ID)
    await repo.completeLesson('responsible-sharing')
    await repo.saveToolkitProgress([{ itemId: 'pause', checked: true }], { keepExisting: true })
    const [lesson, toolkit] = client.calls
    expect(lesson.ops[0]).toEqual(['upsert', { user_id: USER_ID, lesson_id: 'responsible-sharing', completed: true }, { onConflict: 'user_id,lesson_id' }])
    expect(toolkit.ops[0]).toEqual([
      'upsert',
      [{ user_id: USER_ID, item_id: 'pause', checked: true }],
      { onConflict: 'user_id,item_id', ignoreDuplicates: true },
    ])
  })

  it('sends quiz answers to the scoring function without any score', async () => {
    const client = recordingClient(() => ({ data: { attempt_id: 'att-1', created: true }, error: null }))
    const repo = createSupabaseRepository(client, USER_ID)
    const result = await repo.submitQuizAttempt({
      category: 'deepfakes',
      clientAttemptId: 'c-1',
      answers: [{ questionId: 'df-01', selectedAnswer: 1, confidenceRating: 4 }, { questionId: 'df-02', selectedAnswer: 0 }],
    })
    expect(result).toEqual({ id: 'att-1', created: true })
    expect(client.calls[0]).toMatchObject({
      rpc: 'submit_quiz_attempt',
      args: {
        p_category: 'deepfakes',
        p_client_attempt_id: 'c-1',
        p_answers: [
          { question_id: 'df-01', selected_answer: 1, confidence_rating: 4 },
          { question_id: 'df-02', selected_answer: 0, confidence_rating: null },
        ],
      },
    })
  })

  it('calls the certificate functions by name', async () => {
    const client = recordingClient((entry) =>
      entry.rpc === 'issue_certificate' ? { data: { certificate_id: 'cert-1', created: false }, error: null } : { data: null, error: null },
    )
    const repo = createSupabaseRepository(client, USER_ID)
    expect(await repo.issueCertificate('Jose Rizal')).toEqual({ id: 'cert-1', created: false })
    expect(client.calls[0]).toMatchObject({ rpc: 'issue_certificate', args: { p_recipient_name: 'Jose Rizal' } })
    const publicRepo = createSupabasePublicRepository(client)
    expect(await publicRepo.verifyCertificate('VIT-0000-0000-0000-0000')).toBeNull()
    expect(client.calls[1]).toMatchObject({ rpc: 'verify_certificate', args: { p_certificate_number: 'VIT-0000-0000-0000-0000' } })
  })

  it('turns database errors and network failures into explicit AppErrors', async () => {
    const domain = createSupabaseRepository(recordingClient(() => ({ data: null, error: { code: 'P0001', message: 'NOT_ELIGIBLE' } })), USER_ID)
    await expect(domain.issueCertificate('Jose Rizal')).rejects.toMatchObject({ status: 422, code: 'NOT_ELIGIBLE' })
    const offline = createSupabaseRepository(
      recordingClient(() => {
        throw new TypeError('fetch failed')
      }),
      USER_ID,
    )
    await expect(offline.listLessonProgress()).rejects.toMatchObject({ status: 503, code: 'DATABASE_UNAVAILABLE' })
  })
})

describe('Supabase token verification', () => {
  const verifierWith = (getUser) => createSupabaseAuthVerifier({ auth: { getUser } })

  it('returns the verified user', async () => {
    const verifier = verifierWith(async () => ({ data: { user: { id: USER_ID, email: 'a@b.test' } }, error: null }))
    expect(await verifier.verifyToken('token')).toEqual({ id: USER_ID, email: 'a@b.test' })
  })

  it.each([
    ['an invalid token', async () => ({ data: { user: null }, error: { name: 'AuthApiError', status: 401, message: 'invalid JWT' } }), 401],
    ['a missing user', async () => ({ data: { user: null }, error: null }), 401],
    ['an unreachable auth server', async () => ({ data: { user: null }, error: { name: 'AuthRetryableFetchError', status: 0 } }), 503],
    ['an auth server error', async () => ({ data: { user: null }, error: { name: 'AuthApiError', status: 500 } }), 503],
    [
      'a thrown network error',
      async () => {
        throw new TypeError('fetch failed')
      },
      503,
    ],
  ])('rejects %s', async (_label, getUser, status) => {
    const error = await verifierWith(getUser)
      .verifyToken('token')
      .catch((caught) => caught)
    expect(error).toBeInstanceOf(AppError)
    expect(error.status).toBe(status)
  })
})
