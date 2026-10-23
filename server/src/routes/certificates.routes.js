/*
  ⚡ LAYER: Controller → certificates.service → Data Access (eligibility/issue/verify RPCs, RLS)
  🔒 SECURITY: Eligibility, issuance, listing, and PDFs require a verified bearer token and act only
     on the caller's records. Verification is public, rate-limited, and returns printed fields only.
  🚨 ERROR HANDLING: 400 malformed number/name; 401 auth; 404 unknown or not-owned certificate;
     410 revoked (PDF); 422 not eligible or no printable name; 201 newly issued, 200 existing.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { certificateSchemas } from '../validators/schemas.js'
import {
  getCertificatePdf,
  getEligibility,
  issueCertificate,
  listMyCertificates,
  verifyCertificate,
} from '../services/certificates.service.js'

export function createCertificatesRouter({ authenticate, limiters, config, logger, repositories }) {
  const router = Router()

  router.get('/certificates/eligibility', authenticate, async (req, res) => {
    res.status(200).json({ data: await getEligibility(req.repo, config, logger) })
  })

  router.post('/certificates/issue', limiters.certificateIssue, authenticate, validate(certificateSchemas.issue), async (req, res) => {
    const { certificate, created } = await issueCertificate(req.repo, req.auth, config, req.valid.body, logger)
    if (created) logger.info('certificate issued', { userId: req.auth.userId, certificateId: certificate.id })
    res.status(created ? 201 : 200).json({ data: certificate })
  })

  router.get('/certificates/my', authenticate, async (req, res) => {
    res.status(200).json({ data: await listMyCertificates(req.repo, config) })
  })

  router.get(
    '/certificates/verify/:certificateNumber',
    limiters.verification,
    validate(certificateSchemas.verify),
    async (req, res) => {
      res.set('Cache-Control', 'no-store')
      res.status(200).json({ data: await verifyCertificate(repositories.public(), req.valid.params.certificateNumber) })
    },
  )

  router.get('/certificates/:id/pdf', limiters.certificatePdf, authenticate, validate(certificateSchemas.pdf), async (req, res) => {
    const { buffer, filename } = await getCertificatePdf(req.repo, config, req.valid.params.id)
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'private, no-store',
    })
    res.status(200).end(buffer)
  })

  return router
}
