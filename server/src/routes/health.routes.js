/*
  ⚡ LAYER: Controller
  🔒 SECURITY: Public. Returns only a status flag: no versions, hosts, configuration, or dependencies.
  🚨 ERROR HANDLING: None needed; the route cannot fail beyond the process being down.
*/
import { Router } from 'express'

export function createHealthRouter() {
  const router = Router()
  router.get('/health', (_req, res) => {
    res.status(200).json({ data: { status: 'ok' } })
  })
  return router
}
