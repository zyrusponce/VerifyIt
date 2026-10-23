/*
  ⚡ LAYER: Service (certificates)
  🔒 SECURITY: Eligibility is computed in the database from persisted, server-validated records
     immediately before issuance (issue_certificate). The client never sends an eligibility flag.
     Issuance is idempotent and serialized per user. PDFs are generated only for the owner's active
     certificates. Public verification returns only what is printed on the certificate.
  🚨 ERROR HANDLING: Not eligible → 422 NOT_ELIGIBLE (with remaining requirements); no usable name →
     422 DISPLAY_NAME_REQUIRED / NAME_NOT_PRINTABLE; not found or not owned → 404; revoked → 410.
*/
import { REQUIRED_LESSON_IDS, getLesson } from '../data/lessons.js'
import { REQUIRED_CASE_IDS, getCase } from '../data/investigations.js'
import { AppError, gone, notFound, unprocessable } from '../utils/AppError.js'
import { personName } from '../validators/common.js'
import { getOrCreateProfile } from './profile.service.js'
import { CERTIFICATE_TEXT, canPrintName, renderCertificatePdf } from './pdf.service.js'

export const CERTIFICATE_TYPE = 'digital-literacy-completion'

export function verificationUrl(config, certificateNumber) {
  return `${config.publicAppUrl}/verify-certificate/${encodeURIComponent(certificateNumber)}`
}

export function toCertificateResponse(certificate, config) {
  return {
    id: certificate.id,
    certificateNumber: certificate.certificateNumber,
    certificateType: certificate.certificateType,
    title: CERTIFICATE_TEXT.title,
    program: CERTIFICATE_TEXT.program,
    recipientName: certificate.recipientName,
    issuedAt: certificate.issuedAt,
    status: certificate.status,
    revokedAt: certificate.revokedAt,
    verificationUrl: verificationUrl(config, certificate.certificateNumber),
  }
}

function remainingRequirements(eligibility) {
  return [
    ...eligibility.missingLessonIds.map((id) => ({
      type: 'lesson',
      id,
      title: getLesson(id)?.title ?? id,
      path: `/learn/${id}`,
    })),
    ...eligibility.missingCaseIds.map((id) => ({
      type: 'investigation',
      id,
      title: getCase(id)?.title ?? id,
      path: `/lab/${id}`,
    })),
  ]
}

const activeCertificate = (certificates) =>
  certificates.find((certificate) => certificate.status === 'active' && certificate.certificateType === CERTIFICATE_TYPE) ?? null

export async function getEligibility(repo, config, logger) {
  const [eligibility, certificates] = await Promise.all([repo.getEligibility(), repo.listCertificates()])
  if (eligibility.requiredLessons !== REQUIRED_LESSON_IDS.length || eligibility.requiredCases !== REQUIRED_CASE_IDS.length) {
    // The database catalog is older or newer than this server's catalog. Eligibility still follows the database.
    logger?.warn('certificate catalog mismatch: apply the latest *_catalog_sync.sql migration', {
      databaseRequiredLessons: eligibility.requiredLessons,
      serverRequiredLessons: REQUIRED_LESSON_IDS.length,
      databaseRequiredCases: eligibility.requiredCases,
      serverRequiredCases: REQUIRED_CASE_IDS.length,
    })
  }
  const existing = activeCertificate(certificates)
  return {
    eligible: eligibility.eligible,
    completedLessons: eligibility.completedLessons,
    requiredLessons: eligibility.requiredLessons,
    completedCases: eligibility.completedCases,
    requiredCases: eligibility.requiredCases,
    remainingRequirements: remainingRequirements(eligibility),
    existingCertificate: existing ? toCertificateResponse(existing, config) : null,
  }
}

export async function issueCertificate(repo, auth, config, { recipientName }, logger) {
  const existing = activeCertificate(await repo.listCertificates())
  if (existing) return { certificate: toCertificateResponse(existing, config), created: false }

  const candidate = recipientName ?? (await getOrCreateProfile(repo, auth)).displayName
  const parsed = personName.safeParse(candidate ?? '')
  if (!candidate || !parsed.success) {
    throw unprocessable('DISPLAY_NAME_REQUIRED', 'Add the name that should be printed on your certificate.')
  }
  const name = parsed.data
  if (!canPrintName(name)) {
    throw unprocessable(
      'NAME_NOT_PRINTABLE',
      'Some characters in this name cannot be printed on the certificate yet. Please use Latin, Greek, Cyrillic, or Vietnamese letters.',
    )
  }

  let issued
  try {
    issued = await repo.issueCertificate(name)
  } catch (error) {
    if (error?.code !== 'NOT_ELIGIBLE') throw error
    logger?.info('certificate issuance refused: requirements incomplete', { userId: auth.userId })
    const eligibility = await getEligibility(repo, config, logger)
    throw unprocessable('NOT_ELIGIBLE', 'Complete every lesson and investigation case before claiming your certificate.', {
      details: {
        completedLessons: eligibility.completedLessons,
        requiredLessons: eligibility.requiredLessons,
        completedCases: eligibility.completedCases,
        requiredCases: eligibility.requiredCases,
        remainingRequirements: eligibility.remainingRequirements,
      },
      cause: error,
    })
  }

  const certificate = await repo.getCertificate(issued.id)
  if (!certificate) {
    throw new AppError(502, 'CERTIFICATE_UNAVAILABLE', 'Your certificate was issued but could not be loaded. Please refresh.', {
      cause: { context: 'certificate missing after issue', certificateId: issued.id },
    })
  }
  return { certificate: toCertificateResponse(certificate, config), created: issued.created }
}

export async function listMyCertificates(repo, config) {
  return (await repo.listCertificates()).map((certificate) => toCertificateResponse(certificate, config))
}

export async function getCertificatePdf(repo, config, certificateId) {
  // RLS and the explicit user filter mean another user's id simply is not found.
  const certificate = await repo.getCertificate(certificateId)
  if (!certificate) throw notFound('CERTIFICATE_NOT_FOUND', 'This certificate was not found.')
  if (certificate.status !== 'active') throw gone('CERTIFICATE_REVOKED', 'This certificate has been revoked and can no longer be downloaded.')
  const buffer = await renderCertificatePdf({
    recipientName: certificate.recipientName,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
    verificationUrl: verificationUrl(config, certificate.certificateNumber),
    timeZone: config.certificateTimeZone,
  })
  return { buffer, filename: `VerifyIT-Certificate-${certificate.certificateNumber}.pdf` }
}

export async function verifyCertificate(publicRepo, certificateNumber) {
  const record = await publicRepo.verifyCertificate(certificateNumber)
  if (!record) {
    throw notFound('CERTIFICATE_NOT_FOUND', 'No VerifyIT certificate has this number.', {
      details: { valid: false, status: 'not_found', certificateNumber },
    })
  }
  if (record.status !== 'active') {
    return {
      valid: false,
      status: 'revoked',
      title: CERTIFICATE_TEXT.title,
      certificateNumber: record.certificateNumber,
      revokedAt: record.revokedAt,
    }
  }
  return {
    valid: true,
    status: 'valid',
    title: CERTIFICATE_TEXT.title,
    program: CERTIFICATE_TEXT.program,
    description: CERTIFICATE_TEXT.description,
    issuer: CERTIFICATE_TEXT.issuer,
    recipientName: record.recipientName,
    certificateNumber: record.certificateNumber,
    issuedAt: record.issuedAt,
  }
}
