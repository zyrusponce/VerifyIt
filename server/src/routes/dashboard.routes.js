/*
  ⚡ LAYER: Controller → dashboard.service → Data Access (user-scoped reads + eligibility RPC)
  🔒 SECURITY: Bearer token required; aggregates only the caller's own records.
  🚨 ERROR HANDLING: 401 auth; 502/503 when any underlying query fails (no partial dashboards).
*/
import { Router } from 'express'
import { buildDashboard } from '../services/dashboard.service.js'

export function createDashboardRouter({ authenticate, config, logger }) {
  const router = Router()

  router.get('/dashboard', authenticate, async (req, res) => {
    res.status(200).json({ data: await buildDashboard(req.repo, config, logger) })
  })

  return router
}
