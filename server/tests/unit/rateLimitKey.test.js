import { describe, expect, it } from 'vitest'
import { clientKey, userKey } from '../../src/middleware/rateLimits.js'

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

  it('keys per-user limits on the verified user id, falling back to the client address', () => {
    expect(userKey({ auth: { userId: 'u-1' }, headers: { 'cf-connecting-ip': '203.0.113.7' } })).toBe('user:u-1')
    expect(userKey({ headers: { 'cf-connecting-ip': '203.0.113.7' } })).toBe('203.0.113.7')
    expect(userKey({ auth: { userId: '' }, headers: {}, ip: '198.51.100.4' })).toBe('198.51.100.4')
  })
})

describe('IPv6 clients', () => {
  it('counts one IPv6 network as one client, so rotating addresses inside it does not avoid the limit', () => {
    const first = clientKey({ headers: { 'cf-connecting-ip': '2001:db8:1234:5678::1' } })
    const second = clientKey({ headers: { 'cf-connecting-ip': '2001:db8:1234:5678:aaaa:bbbb:cccc:dddd' } })
    expect(first).toBe(second)
    expect(clientKey({ ip: '2001:db8:1234:5678::1', headers: {} })).toBe(first)
    expect(first).not.toBe(clientKey({ headers: { 'cf-connecting-ip': '2001:db8:9999:5678::1' } }))
  })
})
