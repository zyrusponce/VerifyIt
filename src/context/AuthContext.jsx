import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { api, onSessionExpired } from '../lib/api'

export const AuthContext = createContext(null)

// Supabase Auth error messages are technical; map the common ones to plain language.
function friendlyAuthError(error) {
  const message = error?.message ?? ''
  if (/invalid login credentials/i.test(message)) return 'The email or password is incorrect.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email address first. Check your inbox for the confirmation link.'
  if (/already registered|already exists/i.test(message)) return 'An account with this email already exists. Try signing in instead.'
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a few minutes and try again.'
  if (/password should be|weak password/i.test(message)) return 'Choose a stronger password (at least 8 characters, mixing letters and numbers).'
  if (/fetch|network/i.test(message)) return 'Could not reach the sign-in service. Check your connection and try again.'
  return message || 'Something went wrong. Please try again.'
}

/**
 * status: 'unconfigured' (no Supabase settings, guest-only), 'loading' (restoring a session),
 *         'signedOut', or 'signedIn'.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'unconfigured')
  const [profile, setProfile] = useState(null)
  const [profileStatus, setProfileStatus] = useState('idle')
  const [profileError, setProfileError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [isRecovery, setIsRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setNotice('Your previous session could not be restored. Please sign in again.')
        setSession(data?.session ?? null)
        setStatus(data?.session ? 'signedIn' : 'signedOut')
      })
      .catch(() => {
        if (!active) return
        setNotice('Your previous session could not be restored. Please sign in again.')
        setStatus('signedOut')
      })

    // Only synchronous state updates here: Supabase recommends not awaiting its own calls in this callback.
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setStatus(nextSession ? 'signedIn' : 'signedOut')
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      if (event === 'SIGNED_OUT') setIsRecovery(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  const loadProfile = useCallback(async () => {
    setProfileStatus('loading')
    setProfileError(null)
    try {
      setProfile(await api.get('/me', { auth: true }))
      setProfileStatus('ready')
    } catch (error) {
      setProfileError(error)
      setProfileStatus('error')
    }
  }, [])

  useEffect(() => {
    setProfile(null)
    if (userId) loadProfile()
    else setProfileStatus('idle')
  }, [userId, loadProfile])

  // The API rejected our token (revoked or expired beyond refresh): sign out on this device.
  useEffect(
    () =>
      onSessionExpired(() => {
        setNotice('Your session expired. Please sign in again.')
        supabase?.auth.signOut({ scope: 'local' }).catch(() => {
          // The local session is cleared even if the network call fails.
        })
      }),
    [],
  )

  const value = useMemo(() => {
    async function run(action) {
      if (!supabase) return { ok: false, error: 'Accounts are not available on this site yet.' }
      try {
        const { data, error } = await action()
        if (error) return { ok: false, error: friendlyAuthError(error) }
        return { ok: true, data }
      } catch (error) {
        return { ok: false, error: friendlyAuthError(error) }
      }
    }

    return {
      status,
      isConfigured: isSupabaseConfigured,
      session,
      user: session?.user ?? null,
      profile,
      profileStatus,
      profileError,
      notice,
      clearNotice: () => setNotice(null),
      isRecovery,
      reloadProfile: loadProfile,

      async signIn({ email, password }) {
        const result = await run(() => supabase.auth.signInWithPassword({ email, password }))
        if (result.ok) setNotice(null)
        return result
      },

      async signUp({ email, password, displayName }) {
        const result = await run(() =>
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: displayName ? { display_name: displayName } : {},
              emailRedirectTo: `${window.location.origin}/account`,
            },
          }),
        )
        // With email confirmation enabled there is no session until the link is opened.
        return result.ok ? { ...result, needsConfirmation: !result.data?.session } : result
      },

      async signOut() {
        return run(() => supabase.auth.signOut())
      },

      async requestPasswordReset(email) {
        return run(() => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }))
      },

      async updatePassword(password) {
        const result = await run(() => supabase.auth.updateUser({ password }))
        if (result.ok) setIsRecovery(false)
        return result
      },

      async updateDisplayName(displayName) {
        try {
          const updated = await api.patch('/me', { displayName }, { auth: true })
          setProfile(updated)
          setProfileStatus('ready')
          return { ok: true, data: updated }
        } catch (error) {
          return { ok: false, error: error.message }
        }
      },
    }
  }, [status, session, profile, profileStatus, profileError, notice, isRecovery, loadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
