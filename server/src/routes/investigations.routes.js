/*
  ⚡ LAYER: Controller → investigations.service → Data Access (submit_investigation_attempt RPC, RLS)
  🔒 SECURITY: Case list is public and never includes expected verdicts. The guest check is public,
     rate-limited, and stores nothing. Attempts require a verified bearer token; correctness is decided
     in the database from the private expected verdict.
  🚨 ERROR HANDLING: 400 invalid verdict/confidence; 401 auth; 404 unknown case; 201 new attempt,
     200 repeated clientAttemptId; 409 clientAttemptId reused for another case.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { investigationSchemas } from '../validators/schemas.js'
import { checkVerdict, getProgress, listAttempts, listCases, submitAttempt } from '../services/investigations.service.js'

export function createInvestigationsRouter({ authenticate, limiters }) {
  const router = Router()

  router.get('/investigations/cases', (_req, res) => {
    res.status(200).json({ data: listCases() })
  })

  router.get('/investigations/progress', authenticate, async (req, res) => {
    res.status(200).json({ data: await getProgress(req.repo) })
  })

  router.get('/investigations/attempts', authenticate, validate(investigationSchemas.listAttempts), async (req, res) => {
    res.status(200).json({ data: await listAttempts(req.repo, req.valid.query) })
  })

  router.post('/investigations/:caseId/check', limiters.answerCheck, validate(investigationSchemas.check), (req, res) => {
    res.status(200).json({ data: checkVerdict(req.valid.params.caseId, req.valid.body) })
  })

  router.post(
    '/investigations/:caseId/attempts',
    limiters.submissions,
    authenticate,
    validate(investigationSchemas.submit),
    async (req, res) => {
      const { created, ...result } = await submitAttempt(req.repo, req.valid.params.caseId, req.valid.body)
      res.status(created ? 201 : 200).json({ data: result })
    },
  )

  return router
}
