/*
  ⚡ LAYER: Controller → toolkit.service → Data Access (toolkit_progress, RLS)
  🔒 SECURITY: Bearer token required. Bulk updates accept only catalog item ids and booleans.
  🚨 ERROR HANDLING: 400 malformed/duplicate items; 401 auth; 422 unknown items.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { toolkitSchemas } from '../validators/schemas.js'
import { getProgress, saveProgress } from '../services/toolkit.service.js'

export function createToolkitRouter({ authenticate, limiters }) {
  const router = Router()

  router.get('/toolkit/progress', authenticate, async (req, res) => {
    res.status(200).json({ data: await getProgress(req.repo) })
  })

  router.put('/toolkit/progress', limiters.submissions, authenticate, validate(toolkitSchemas.save), async (req, res) => {
    res.status(200).json({ data: await saveProgress(req.repo, req.valid.body) })
  })

  return router
}
