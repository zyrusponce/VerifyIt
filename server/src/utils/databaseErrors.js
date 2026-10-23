import { AppError } from './AppError.js'

// Domain errors raised by the SQL functions in supabase/migrations (RAISE EXCEPTION '<CODE>').
const DOMAIN_ERRORS = {
  AUTH_REQUIRED: [401, 'Sign in to continue.'],
  NOT_ELIGIBLE: [422, 'You have not completed every requirement for the certificate yet.'],
  INVALID_RECIPIENT_NAME: [400, 'Enter a name between 2 and 80 characters.'],
  INVALID_ANSWERS: [400, 'The submitted answers are malformed.'],
  INVALID_CONFIDENCE: [400, 'Confidence ratings must be whole numbers from 1 to 5.'],
  INVALID_SELECTED_ANSWER: [400, 'An answer refers to an option that does not exist.'],
  INVALID_VERDICT: [400, 'That assessment is not one of the allowed options.'],
  DUPLICATE_QUESTION: [400, 'Each question can be answered only once per attempt.'],
  INVALID_QUESTION_SET: [422, 'The answers do not match the questions in this quiz.'],
  UNKNOWN_CATEGORY: [422, 'This quiz category is not available.'],
  UNKNOWN_QUESTION: [422, 'A submitted question is not part of the quiz catalog.'],
  UNKNOWN_CASE: [422, 'This investigation case is not available.'],
  CLIENT_ATTEMPT_ID_CONFLICT: [409, 'This attempt id was already used for a different submission.'],
}

// Postgres SQLSTATE and PostgREST codes that have a clear HTTP meaning.
const SQLSTATE_ERRORS = {
  23505: [409, 'CONFLICT', 'This record already exists.'],
  23503: [422, 'UNKNOWN_REFERENCE', 'The request refers to an item that does not exist.'],
  23514: [400, 'CONSTRAINT_VIOLATION', 'The request contains a value that is not allowed.'],
  '22P02': [400, 'INVALID_VALUE', 'The request contains a value in the wrong format.'],
  42501: [403, 'FORBIDDEN', 'You do not have permission to do that.'],
  PGRST301: [401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.'],
  PGRST303: [401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.'],
  // Missing function/table: the SQL migrations have not been applied to this Supabase project.
  PGRST202: [503, 'DATABASE_NOT_READY', 'The VerifyIT database is not set up yet. Please try again later.'],
  PGRST205: [503, 'DATABASE_NOT_READY', 'The VerifyIT database is not set up yet. Please try again later.'],
  '42P01': [503, 'DATABASE_NOT_READY', 'The VerifyIT database is not set up yet. Please try again later.'],
  42883: [503, 'DATABASE_NOT_READY', 'The VerifyIT database is not set up yet. Please try again later.'],
}

function isNetworkFailure(error) {
  const text = `${error?.message ?? ''} ${error?.details ?? ''}`
  return /fetch failed|network|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|socket hang up/i.test(text)
}

/**
 * Converts an error from Supabase (PostgREST) or Postgres into an AppError with an explicit status.
 * `context` names the operation so logs show what failed; it is never sent to the client.
 */
export function toAppError(error, context) {
  if (error instanceof AppError) return error
  const message = String(error?.message ?? '')
  const domain = DOMAIN_ERRORS[message.trim()]
  if (domain) return new AppError(domain[0], message.trim(), domain[1], { cause: { context, error } })

  const mapped = SQLSTATE_ERRORS[error?.code]
  if (mapped) return new AppError(mapped[0], mapped[1], mapped[2], { cause: { context, error } })

  if (isNetworkFailure(error)) {
    return new AppError(503, 'DATABASE_UNAVAILABLE', 'The database is temporarily unavailable. Please try again.', {
      cause: { context, error },
    })
  }
  return new AppError(502, 'DATABASE_ERROR', 'The database could not complete the request. Please try again.', {
    cause: { context, error },
  })
}
