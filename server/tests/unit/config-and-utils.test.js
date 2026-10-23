import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from '../../src/config/env.js'
import { createLogger } from '../../src/utils/logger.js'
import { toAppError } from '../../src/utils/databaseErrors.js'
import { canPrintName } from '../../src/services/pdf.service.js'
import { TEST_ENV } from '../support/testApp.js'

const fakeJwt = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`

describe('environment validation', () => {
  it('loads a valid configuration', () => {
    const config = loadConfig({ ...TEST_ENV, FRONTEND_URL: 'http://localhost:5173, https://verifyit.example/' })
    expect(config.corsOrigins).toEqual(['http://localhost:5173', 'https://verifyit.example'])
    expect(config.port).toBe(4000)
  })

  it('names every missing variable without echoing values', () => {
    try {
      loadConfig({ NODE_ENV: 'development', SUPABASE_ANON_KEY: 'short' })
      throw new Error('expected loadConfig to fail')
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError)
      for (const name of ['FRONTEND_URL', 'PUBLIC_APP_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY']) expect(error.message).toContain(name)
      expect(error.message).not.toContain('short')
    }
  })

  it.each([
    ['a legacy service_role JWT', fakeJwt({ role: 'service_role' })],
    ['a new-style secret key', 'sb_secret_abcdefghijklmnopqrstuvwxyz'],
  ])('refuses to start with %s', (_label, key) => {
    expect(() => loadConfig({ ...TEST_ENV, SUPABASE_ANON_KEY: key })).toThrow(/service-role/)
  })

  it('accepts an anon JWT or publishable key', () => {
    expect(() => loadConfig({ ...TEST_ENV, SUPABASE_ANON_KEY: fakeJwt({ role: 'anon' }) })).not.toThrow()
    expect(() => loadConfig({ ...TEST_ENV, SUPABASE_ANON_KEY: 'sb_publishable_abcdefghijklmnop' })).not.toThrow()
  })

  it('rejects localhost certificate URLs and origins in production', () => {
    expect(() => loadConfig({ ...TEST_ENV, NODE_ENV: 'production' })).toThrow(/FRONTEND_URL/)
    expect(() =>
      loadConfig({ ...TEST_ENV, NODE_ENV: 'production', FRONTEND_URL: 'https://verifyit.example', PUBLIC_APP_URL: 'http://localhost:5173' }),
    ).toThrow(/PUBLIC_APP_URL/)
    expect(() =>
      loadConfig({ ...TEST_ENV, NODE_ENV: 'production', FRONTEND_URL: 'https://verifyit.example', PUBLIC_APP_URL: 'https://verifyit.example' }),
    ).not.toThrow()
  })

  it('rejects invalid time zones and ports', () => {
    expect(() => loadConfig({ ...TEST_ENV, CERTIFICATE_TIMEZONE: 'Mars/Olympus' })).toThrow(/CERTIFICATE_TIMEZONE/)
    expect(() => loadConfig({ ...TEST_ENV, PORT: '99999' })).toThrow(/PORT/)
  })
})

describe('structured logger', () => {
  it('redacts secrets at any depth', () => {
    const lines = []
    const logger = createLogger({ level: 'debug', write: (_level, line) => lines.push(JSON.parse(line)) })
    logger.info('test', { headers: { Authorization: 'Bearer abc' }, nested: { access_token: 'xyz', password: 'p' }, userId: 'u1' })
    expect(lines[0]).toMatchObject({
      level: 'info',
      msg: 'test',
      headers: { Authorization: '[redacted]' },
      nested: { access_token: '[redacted]', password: '[redacted]' },
      userId: 'u1',
    })
  })

  it('respects the level threshold', () => {
    const lines = []
    const logger = createLogger({ level: 'warn', write: (_level, line) => lines.push(line) })
    logger.info('hidden')
    logger.error('shown', { error: new Error('boom') })
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0]).error).toMatchObject({ name: 'Error', message: 'boom' })
  })
})

describe('database error mapping', () => {
  it.each([
    [{ code: 'P0001', message: 'NOT_ELIGIBLE' }, 422, 'NOT_ELIGIBLE'],
    [{ code: 'P0001', message: 'INVALID_QUESTION_SET' }, 422, 'INVALID_QUESTION_SET'],
    [{ code: 'P0001', message: 'DUPLICATE_QUESTION' }, 400, 'DUPLICATE_QUESTION'],
    [{ code: '42501', message: 'AUTH_REQUIRED' }, 401, 'AUTH_REQUIRED'],
    [{ code: '42501', message: 'permission denied for table quiz_attempts' }, 403, 'FORBIDDEN'],
    [{ code: '23503', message: 'insert violates foreign key' }, 422, 'UNKNOWN_REFERENCE'],
    [{ code: '23505', message: 'duplicate key' }, 409, 'CONFLICT'],
    [{ code: 'PGRST301', message: 'JWT expired' }, 401, 'INVALID_TOKEN'],
    [{ code: 'PGRST202', message: 'Could not find the function public.verify_certificate' }, 503, 'DATABASE_NOT_READY'],
    [{ code: 'PGRST205', message: "Could not find the table 'public.profiles'" }, 503, 'DATABASE_NOT_READY'],
    [{ message: 'TypeError: fetch failed' }, 503, 'DATABASE_UNAVAILABLE'],
    [{ code: 'XX000', message: 'internal' }, 502, 'DATABASE_ERROR'],
  ])('maps %j to %i %s', (error, status, code) => {
    const mapped = toAppError(error, 'test')
    expect(mapped.status).toBe(status)
    expect(mapped.code).toBe(code)
    expect(mapped.message).not.toContain('internal')
  })
})

describe('certificate name coverage', () => {
  it('prints Latin (including ñ), Vietnamese, Greek, and Cyrillic names, but not unsupported scripts', () => {
    expect(canPrintName('José Rizal Peñaflorida')).toBe(true)
    expect(canPrintName('Nguyễn Thị Minh Khai')).toBe(true)
    expect(canPrintName('Αλέξανδρος Παπαδόπουλος')).toBe(true)
    expect(canPrintName('Анна Иванова')).toBe(true)
    expect(canPrintName('李小龍')).toBe(false)
  })
})
