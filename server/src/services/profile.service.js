/*
  ⚡ LAYER: Service (profiles)
  🔒 SECURITY: Operates only on the verified user's own profile through the user-scoped repository.
     Ownership comes from the token, never from the request body.
  🚨 ERROR HANDLING: A profile that still cannot be read after creating it → 502 PROFILE_UNAVAILABLE.
*/
import { AppError } from '../utils/AppError.js'

function toResponse(profile, email) {
  return {
    id: profile.id,
    email,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

const unavailable = () =>
  new AppError(502, 'PROFILE_UNAVAILABLE', 'Your profile could not be loaded. Please try again.', {
    cause: { context: 'profile missing after create' },
  })

/** Returns the user's profile, creating it if the sign-up trigger did not (for example, older accounts). */
export async function getOrCreateProfile(repo, auth) {
  let profile = await repo.getProfile()
  if (!profile) {
    await repo.createProfile()
    profile = await repo.getProfile()
  }
  if (!profile) throw unavailable()
  return toResponse(profile, auth.email)
}

export async function updateDisplayName(repo, auth, displayName) {
  let profile = await repo.updateDisplayName(displayName)
  if (!profile) {
    await repo.createProfile()
    profile = await repo.updateDisplayName(displayName)
  }
  if (!profile) throw unavailable()
  return toResponse(profile, auth.email)
}
