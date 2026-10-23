import { describe, expect, it } from 'vitest'
import { clientKey } from '../../src/middleware/rateLimits.js'

describe('rate limit client key', () => {
  it('uses the Cloudflare connecting address when present', () => {
    expect(clientKey({ headers: { 'cf-connecting-ip': '203.0.113.7' }, ip: '10.0.0.1' })).toBe('203.0.113.7')
  })

  it('falls back to req.ip, then to one shared bucket, instead of crashing when the address is missing', () => {
    expect(clientKey({ headers: {}, ip: '198.51.100.4' })).toBe('198.51.100.4')
    expect(clientKey({ headers: {}, ip: undefined })).toBe('unknown-client')
    expect(clientKey({ headers: { 'cf-connecting-ip': '  ' } })).toBe('unknown-client')
    expect(clientKey({})).toBe('unknown-client')
  })
})
