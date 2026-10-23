/*
  Per-user queue of account saves that could not reach the server (offline, timeout, server error).
  Nothing is dropped on a network failure: operations stay here until the API confirms them.
  Every operation is idempotent on the server (lesson upserts, quiz attempts with a clientAttemptId,
  toolkit upserts), so sending one twice never creates duplicates.
*/
import { api, newClientId } from './api'

const EVENT = 'verifyit-outbox'
const keyFor = (userId) => `verifyit:outbox:${userId}`

export function readOutbox(userId) {
  if (!userId) return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(keyFor(userId)) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Unreadable storage: behave as an empty queue rather than crash.
    return []
  }
}

function writeOutbox(userId, ops) {
  try {
    if (ops.length) window.localStorage.setItem(keyFor(userId), JSON.stringify(ops))
    else window.localStorage.removeItem(keyFor(userId))
  } catch {
    // Storage full or blocked. The caller still shows the unsaved state to the user.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { userId } }))
}

export function onOutboxChange(listener) {
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}

/**
 * Adds an operation, merging it with an older one for the same target:
 *   { type: 'lesson', lessonId } | { type: 'quiz', category, body } | { type: 'toolkit', items }
 */
export function enqueue(userId, op) {
  const ops = readOutbox(userId)
  const entry = { ...op, id: newClientId(), createdAt: new Date().toISOString() }
  let others
  if (op.type === 'lesson') {
    others = ops.filter((item) => !(item.type === 'lesson' && item.lessonId === op.lessonId))
  } else if (op.type === 'quiz') {
    others = ops.filter((item) => !(item.type === 'quiz' && item.body?.clientAttemptId === op.body.clientAttemptId))
  } else if (op.type === 'toolkit') {
    // One toolkit operation holds the latest value of every unsaved checklist item.
    const merged = new Map((ops.find((item) => item.type === 'toolkit')?.items ?? []).map((item) => [item.itemId, item]))
    op.items.forEach((item) => merged.set(item.itemId, item))
    entry.items = [...merged.values()]
    others = ops.filter((item) => item.type !== 'toolkit')
  } else {
    return
  }
  writeOutbox(userId, [...others, entry])
}

function send(op) {
  if (op.type === 'lesson') return api.put(`/lessons/progress/${encodeURIComponent(op.lessonId)}`, { completed: true }, { auth: true })
  if (op.type === 'quiz') return api.post(`/quizzes/${encodeURIComponent(op.category)}/attempts`, op.body, { auth: true })
  if (op.type === 'toolkit') return api.put('/toolkit/progress', { items: op.items }, { auth: true })
  return Promise.resolve()
}

const inFlight = new Map()

/**
 * Sends queued operations in order. Stops at the first retryable failure (keeping the rest).
 * Operations the server permanently rejects are kept but marked `failed` so the user can see them.
 */
export function flushOutbox(userId) {
  if (!userId) return Promise.resolve({ sent: 0, remaining: 0, failed: 0 })
  if (inFlight.has(userId)) return inFlight.get(userId)

  const run = (async () => {
    let sent = 0
    let lastError = null
    for (const op of readOutbox(userId)) {
      if (op.failed) continue
      try {
        await send(op)
        writeOutbox(userId, readOutbox(userId).filter((item) => item.id !== op.id))
        sent += 1
      } catch (error) {
        lastError = error
        if (error?.isRetryable || error?.status === 401) break
        writeOutbox(
          userId,
          readOutbox(userId).map((item) => (item.id === op.id ? { ...item, failed: { message: error?.message ?? 'Rejected by the server.' } } : item)),
        )
      }
    }
    const left = readOutbox(userId)
    return { sent, remaining: left.filter((op) => !op.failed).length, failed: left.filter((op) => op.failed).length, error: lastError }
  })().finally(() => inFlight.delete(userId))

  inFlight.set(userId, run)
  return run
}

export function discardFailed(userId) {
  writeOutbox(userId, readOutbox(userId).filter((op) => !op.failed))
}
