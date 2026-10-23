/*
  Server catalog of Investigation Lab cases, including the trusted expected verdicts.
  Case content comes from the shared frontend file (src/data/investigations.js);
  expected verdicts and explanations come from the server-only investigationVerdicts.js.
  A case counts toward the certificate unless it sets `requiredForCertificate: false`.
*/
import { assessmentOptions, investigations as caseContent } from '../../../src/data/investigations.js'
import { investigationVerdicts } from './investigationVerdicts.js'
import { CatalogError, assertUniqueIds } from './catalogChecks.js'

export const VERDICTS = assessmentOptions.map((option) => option.id)
export const verdictLabel = Object.fromEntries(assessmentOptions.map((option) => [option.id, option.label]))

assertUniqueIds('investigation case', caseContent)

export const investigationCases = caseContent.map((item, index) => {
  const verdict = investigationVerdicts[item.id]
  if (!verdict) throw new CatalogError(`case "${item.id}" has no expected verdict`)
  if (!VERDICTS.includes(verdict.expected)) throw new CatalogError(`case "${item.id}" has an unknown verdict "${verdict.expected}"`)
  if (typeof verdict.explanation !== 'string' || verdict.explanation.trim() === '') {
    throw new CatalogError(`case "${item.id}" has no explanation`)
  }
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    difficulty: item.difficulty,
    topic: item.topic,
    sortOrder: index + 1,
    requiredForCertificate: item.requiredForCertificate !== false,
    expected: verdict.expected,
    explanation: verdict.explanation,
  }
})

for (const id of Object.keys(investigationVerdicts)) {
  if (!investigationCases.some((item) => item.id === id)) throw new CatalogError(`verdict "${id}" does not match any case`)
}

const caseById = new Map(investigationCases.map((item) => [item.id, item]))

export const REQUIRED_CASE_IDS = investigationCases.filter((item) => item.requiredForCertificate).map((item) => item.id)

/** Full case including its expected verdict. Server use only. */
export function getCase(id) {
  return caseById.get(id) ?? null
}

/** Case metadata that is safe to show before submission. */
export function toPublicCase({ expected: _expected, explanation: _explanation, ...publicFields }) {
  return publicFields
}
