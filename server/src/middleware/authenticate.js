/*
  ⚡ LAYER: Controller middleware (authentication)
  🔒 SECURITY: Requires "Authorization: Bearer <Supabase access token>". The token is verified by
     Supabase Auth before any protected work; the decoded claims are never trusted on their own.
     The verified user id becomes the only source of ownership for the request.
  🚨 ERROR HANDLING: Missing header → 401 AUTH_REQUIRED; malformed/invalid/expired → 401 INVALID_TOKEN;
     Auth service unreachable → 503 AUTH_UNAVAILABLE (thrown, forwarded to the error handler).
*/
import { unauthorized } from '../utils/AppError.js'

const BEARER = /^Bearer\s+([A-Za-z0-9._~+/-]+=*)$/
const MAX_TOKEN_LENGTH = 8192

export function createAuthenticate({ auth, repositories }) {
  return async function authenticate(req, _res, next) {
    const header = req.get('authorization')
    if (!header) throw unauthorized('AUTH_REQUIRED', 'Sign in to continue.')
    const token = BEARER.exec(header)?.[1]
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      throw unauthorized('INVALID_TOKEN', 'Your session has expired. Please sign in again.')
    }
    const user = await auth.verifyToken(token)
    req.auth = { userId: user.id, email: user.email ?? null }
    req.repo = repositories.forUser(token, user.id)
    next()
  }
}
