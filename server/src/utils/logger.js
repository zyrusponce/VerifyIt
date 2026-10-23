// Structured JSON logger. One line per event, with secrets redacted before anything is written.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 }
const SECRET_KEY = /authorization|token|password|secret|apikey|api_key|cookie|jwt/i

function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object') return value
  if (depth > 6) return '[truncated]'
  if (value instanceof Error) return serializeError(value, depth)
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, SECRET_KEY.test(key) ? '[redacted]' : redact(item, depth + 1)]),
  )
}

function serializeError(error, depth = 0) {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    status: error.status,
    stack: error.stack,
    cause: error.cause instanceof Error || typeof error.cause === 'object' ? redact(error.cause, depth + 1) : error.cause,
  }
}

export function createLogger({ level = 'info', write } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info
  const sink =
    write ??
    ((entryLevel, line) => {
      if (entryLevel === 'error' || entryLevel === 'warn') process.stderr.write(`${line}\n`)
      else process.stdout.write(`${line}\n`)
    })

  function log(entryLevel, message, context = {}) {
    if (LEVELS[entryLevel] < threshold) return
    const entry = { time: new Date().toISOString(), level: entryLevel, msg: message, ...redact(context) }
    sink(entryLevel, JSON.stringify(entry))
  }

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
  }
}
