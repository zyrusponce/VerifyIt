/*
  ⚡ LAYER: Data Access (Supabase client wiring)
  🔒 SECURITY: Uses only the public anon key. Every user request gets its own client that carries
     the user's access token, so PostgREST applies Row Level Security as that user. Tokens are
     verified by Supabase Auth (auth.getUser), which checks signature, expiry, and revocation.
  🚨 ERROR HANDLING: Invalid/expired tokens → 401; Auth service unreachable → 503.
*/
import { createClient } from '@supabase/supabase-js'
import { serviceUnavailable, unauthorized } from '../utils/AppError.js'
import { createSupabaseRepository, createSupabasePublicRepository } from '../repositories/supabaseRepository.js'

const CLIENT_OPTIONS = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }

export function createSupabaseGateway(config) {
  const anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, CLIENT_OPTIONS)

  function clientForToken(token) {
    return createClient(config.supabaseUrl, config.supabaseAnonKey, {
      ...CLIENT_OPTIONS,
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
  }

  return {
    auth: createSupabaseAuthVerifier(anonClient),
    repositories: {
      forUser: (token, userId) => createSupabaseRepository(clientForToken(token), userId),
      public: () => createSupabasePublicRepository(anonClient),
    },
  }
}

/** Verifies an access token with Supabase Auth. Returns { id, email } for a valid token. */
export function createSupabaseAuthVerifier(client) {
  return {
    async verifyToken(token) {
      let result
      try {
        result = await client.auth.getUser(token)
      } catch (error) {
        throw serviceUnavailable('AUTH_UNAVAILABLE', 'Sign-in could not be checked right now. Please try again.', {
          cause: { context: 'auth.getUser', error },
        })
      }
      const error = result?.error
      const user = result?.data?.user
      if (error) {
        const status = Number(error.status ?? 0)
        if (error.name === 'AuthRetryableFetchError' || status === 0 || status >= 500) {
          throw serviceUnavailable('AUTH_UNAVAILABLE', 'Sign-in could not be checked right now. Please try again.', {
            cause: { context: 'auth.getUser', error },
          })
        }
        throw unauthorized('INVALID_TOKEN', 'Your session has expired. Please sign in again.', {
          cause: { context: 'auth.getUser', error },
        })
      }
      if (!user?.id) throw unauthorized('INVALID_TOKEN', 'Your session has expired. Please sign in again.')
      return { id: user.id, email: user.email ?? null }
    },
  }
}
