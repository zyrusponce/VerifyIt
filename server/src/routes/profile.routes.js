/*
  ⚡ LAYER: Controller → profile.service → Data Access (profiles, RLS)
  🔒 SECURITY: Bearer token required (Supabase Auth). Body is a strict schema: only displayName is
     accepted, so a client-supplied user id is rejected rather than trusted.
  🚨 ERROR HANDLING: 400 invalid name; 401 missing/invalid token; 502/503 database failures.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { profileSchemas } from '../validators/schemas.js'
import { getOrCreateProfile, updateDisplayName } from '../services/profile.service.js'

export function createProfileRouter({ authenticate }) {
  const router = Router()

  router.get('/me', authenticate, async (req, res) => {
    res.status(200).json({ data: await getOrCreateProfile(req.repo, req.auth) })
  })

  router.patch('/me', authenticate, validate(profileSchemas.update), async (req, res) => {
    res.status(200).json({ data: await updateDisplayName(req.repo, req.auth, req.valid.body.displayName) })
  })

  return router
}
