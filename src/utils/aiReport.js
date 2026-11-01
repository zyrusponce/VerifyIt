// Labels and the plain-text report for the AI Investigation Assistant. Pure functions only (no DOM), so the
// Copy Analysis and Download Report buttons produce exactly the same text.

// Same limits as the API (POST /api/v1/ai/analyze). The server checks everything again.
export const AI_CONTENT_MIN_LENGTH = 10
export const AI_CONTENT_MAX_LENGTH = 6000
export const AI_SOURCE_URL_MAX_LENGTH = 2048
export const AI_MAX_IMAGES = 3

export const WARNING_SIGN_LABELS = {
  sensationalized_headline: 'Sensationalized headline',
  emotional_language: 'Emotionally manipulative language',
  unsupported_claim: 'Unsupported claim',
  missing_author: 'Missing author information',
  missing_date: 'Missing publication date',
  misleading_statement: 'Misleading statement',
  missing_context: 'Missing context',
}

export const ASSESSMENT_LABELS = {
  NEEDS_FURTHER_VERIFICATION: 'Needs Further Verification',
  POTENTIAL_WARNING_SIGNS_FOUND: 'Potential Warning Signs Found',
  INSUFFICIENT_INFORMATION: 'Insufficient Information',
}

export const PROVIDER_LABELS = {
  openrouter: 'OpenRouter',
  groq: 'Groq',
}

export const SOURCE_STANCE_LABELS = {
  supports: 'Supports',
  contradicts: 'Contradicts',
  unrelated: 'Does not address these claims',
}

export const CLAIM_TYPE_LABELS = {
  fact: 'Factual claim',
  opinion: 'Opinion',
}

export function warningSignLabel(indicator) {
  return WARNING_SIGN_LABELS[indicator] ?? 'Possible warning sign'
}

export function assessmentLabel(category) {
  return ASSESSMENT_LABELS[category] ?? 'Needs Further Verification'
}

export function providerLabel(provider) {
  return PROVIDER_LABELS[provider] ?? 'AI provider'
}

const NEWS_STANCE_LABELS = {
  supports: 'Also reports claim',
  contradicts: 'Disputes claim',
}

/**
 * "Contradicts claim 2" / "Supports claim 1" / "Does not address these claims" for a fact-check;
 * "Also reports claim 1" / "Disputes claim 2" for a news report.
 */
export function sourceStanceLabel(stance, claimIndex, kind = 'fact_check') {
  if ((stance === 'supports' || stance === 'contradicts') && Number.isInteger(claimIndex)) {
    const verb = kind === 'news' ? NEWS_STANCE_LABELS[stance] : `${SOURCE_STANCE_LABELS[stance]} claim`
    return `${verb} ${claimIndex + 1}`
  }
  return SOURCE_STANCE_LABELS.unrelated
}

/** The different websites whose news reports were matched to a claim as reporting it (the AI's match, not a verdict). */
export function reportingSites(sources) {
  const list = Array.isArray(sources) ? sources : []
  return [...new Set(list.filter((source) => source?.kind === 'news' && source.stance === 'supports').map((source) => source.site))]
}

/** Only real web links from the fact-check search are ever shown as links. */
export function isWebLink(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

export const VERDICT_LABELS = {
  likely_real: 'Likely real',
  likely_fake: 'Likely fake or misleading',
  mixed: 'Mixed evidence',
  unverified: "Can't tell yet",
}

export function verdictLabel(label) {
  return VERDICT_LABELS[label] ?? VERDICT_LABELS.unverified
}

/** "Confidence: medium" for a verdict that leans one way; "Not enough evidence either way" when it does not. */
export function verdictConfidenceLabel(label, confidence) {
  if (label === 'mixed') return 'The evidence points in different directions.'
  if (label === 'unverified') return 'Not enough evidence either way.'
  return `Confidence: ${['low', 'medium', 'high'].includes(confidence) ? confidence : 'low'}`
}

export function claimTypeLabel(type) {
  return CLAIM_TYPE_LABELS[type] ?? 'Claim'
}

/** "Oct 30, 2026, 3:15 PM" in the reader's locale, or '' for a missing or invalid date. */
export function formatDateTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** "Mar 2, 2026" in the reader's locale (UTC calendar date, as fact-check dates have no meaningful time), or ''. */
export function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
}

/** verifyit-analysis-YYYY-MM-DD.txt, using the local calendar date of `isoString` (or today). */
export function reportFilename(isoString) {
  const parsed = isoString ? new Date(isoString) : new Date()
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  const pad = (value) => String(value).padStart(2, '0')
  return `verifyit-analysis-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.txt`
}

// Model text is collapsed onto one line so the report keeps its numbered layout.
function clean(value) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
}

function heading(title) {
  return [title, '-'.repeat(title.length)]
}

/**
 * The analysis as a plain-text report: all five sections, the source URL the user gave (if any), how many images
 * were attached and the text the AI read from them, published fact-checks found for its claims (when checked), when it
 * was generated, and the disclaimer. It does not repeat the submitted article.
 */
export function formatAnalysisReport({ analysis, meta, sourceUrl, imageCount = 0, sources = null }) {
  const summary = analysis?.summary ?? {}
  const claims = Array.isArray(analysis?.claims) ? analysis.claims : []
  const warningSigns = Array.isArray(analysis?.warningSigns) ? analysis.warningSigns : []
  const checklist = Array.isArray(analysis?.checklist) ? analysis.checklist : []
  const assessment = analysis?.assessment ?? {}
  const generated = formatDateTime(meta?.generatedAt)
  const title = 'VerifyIT AI Investigation Assistant: Analysis Report'

  const lines = [title, '='.repeat(title.length), '']
  lines.push(`Generated: ${generated ? `${generated} (${meta.generatedAt})` : 'Unknown'}`)
  if (meta?.model) lines.push(`AI model: ${clean(meta.model)} via ${providerLabel(meta.provider)}`)
  lines.push(`Source URL provided: ${clean(sourceUrl) || 'None'}`)
  lines.push(`Images attached: ${imageCount || 'None'}`)
  lines.push('')

  if (sources?.verdict) {
    lines.push(...heading('Initial Verdict (a first guess, not a final ruling)'))
    lines.push(`${verdictLabel(sources.verdict.label)}. ${verdictConfidenceLabel(sources.verdict.label, sources.verdict.confidence)}`)
    for (const reason of sources.verdict.reasons ?? []) lines.push(`- ${clean(reason)}`)
    lines.push('It is based only on the fact-checks and news reports found. Read them and decide for yourself.')
    lines.push('')
  }

  lines.push(...heading('1. Content Summary'))
  lines.push(`Overview: ${clean(summary.overview) || 'Not provided.'}`)
  lines.push(`Main message: ${clean(summary.mainMessage) || 'Not provided.'}`)
  if (typeof analysis?.imageText === 'string') {
    // Kept line by line: it is a transcription the reader compares with their image.
    const imageLines = analysis.imageText.split('\n').map((line) => line.trim()).filter(Boolean)
    lines.push('Text the AI read from the image(s), to compare with the image:')
    lines.push(...(imageLines.length ? imageLines.map((line) => `   | ${line}`) : ['   (no text found)']))
  }
  lines.push('')

  lines.push(...heading('2. Extracted Claims'))
  if (claims.length === 0) lines.push('No specific claims were identified in this content.')
  claims.forEach((item, index) => {
    lines.push(`${index + 1}) ${clean(item?.claim)}`)
    lines.push(`   Type: ${claimTypeLabel(item?.type)}`)
    lines.push(`   Verifiable: ${item?.verifiable ? 'Yes, it can be checked against independent sources' : 'No, it cannot be independently verified'}`)
    if (clean(item?.explanation)) lines.push(`   Why: ${clean(item.explanation)}`)
  })
  lines.push('')

  lines.push(...heading('3. Potential Warning Signs'))
  if (warningSigns.length === 0) {
    lines.push('No warning signs were identified. This does not mean the content is accurate; still follow the checklist below.')
  }
  warningSigns.forEach((item, index) => {
    lines.push(`${index + 1}) ${warningSignLabel(item?.indicator)}`)
    if (clean(item?.evidence)) lines.push(`   Evidence: "${clean(item.evidence)}"`)
    if (clean(item?.explanation)) lines.push(`   Why it may be concerning: ${clean(item.explanation)}`)
  })
  lines.push('')

  if (sources) {
    lines.push(...heading(sources.searchedNews ? 'What Other Sources Say (fact-checks and news reports)' : 'What Other Sources Say (published fact-checks)'))
    const found = Array.isArray(sources.sources) ? sources.sources : []
    if (found.length === 0) {
      lines.push(
        sources.searchedNews
          ? 'No fact-checks or news reports were found for these claims. Many claims are never fact-checked and a search can miss recent or local stories, so this does not mean the content is accurate or fake.'
          : 'No published fact-checks were found for these claims. Many claims are never fact-checked, so this does not mean the content is accurate.',
      )
    } else {
      if (clean(sources.summary)) lines.push(clean(sources.summary))
      const sites = reportingSites(found)
      if (sites.length > 0) {
        lines.push(`Reported by ${sites.length} different website${sites.length === 1 ? '' : 's'}: ${sites.join(', ')}. A story being reported is not proof that it is true.`)
      }
      found.forEach((source, index) => {
        lines.push(`${index + 1}) ${clean(source?.title) || clean(source?.claimReviewed) || clean(source?.site)}`)
        lines.push(`   ${sourceStanceLabel(source?.stance, source?.claimIndex, source?.kind)}${clean(source?.rating) ? ` · Rated "${clean(source.rating)}" by ${clean(source.publisher)}` : ` · ${clean(source?.publisher)}`}`)
        if (clean(source?.note)) lines.push(`   ${clean(source.note)}`)
        if (isWebLink(source?.url)) lines.push(`   ${source.url}`)
      })
    }
    lines.push('Ratings are the fact-checkers\' own, found with Google Fact Check Tools.')
    if (sources.searchedNews) lines.push('News reports are only what the named outlets published; read them yourself.')
    lines.push('')
  }

  lines.push(...heading('4. Verification Checklist'))
  checklist.forEach((item, index) => {
    lines.push(`[ ] ${index + 1}. ${clean(item?.step)}`)
    if (clean(item?.details)) lines.push(`       ${clean(item.details)}`)
  })
  lines.push('')

  lines.push(...heading('5. Final Assessment'))
  lines.push(`Assessment: ${assessmentLabel(assessment.category)}`)
  if (clean(assessment.explanation)) lines.push(clean(assessment.explanation))
  lines.push('')

  lines.push(`Disclaimer: ${clean(analysis?.disclaimer) || 'This AI analysis is a starting point, not a final ruling. Verify the content independently.'}`)
  return `${lines.join('\n')}\n`
}
