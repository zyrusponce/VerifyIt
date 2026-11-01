import { describe, expect, it } from 'vitest'
import {
  AI_DISCLAIMER,
  buildAnalysisMessages,
  extractJsonObject,
  parseAnalysis,
} from '../../src/services/aiAnalysis.service.js'
import { ProviderFailure } from '../../src/services/aiProviders.service.js'
import { ARTICLE, validAnalysis } from '../support/aiFixtures.js'

const parse = (output, content = ARTICLE) => parseAnalysis(typeof output === 'string' ? output : JSON.stringify(output), { content })
const overviewOf = (overview, content = ARTICLE) => parse(validAnalysis({ summary: { overview, mainMessage: 'Short.' } }), content).summary.overview
const withSign = (evidence, content = ARTICLE) =>
  parse(validAnalysis({ warningSigns: [{ indicator: 'sensationalized_headline', evidence, explanation: 'Hype grabs attention.' }] }), content)

/** How long `run` takes, in milliseconds. */
function elapsed(run) {
  const started = performance.now()
  run()
  return performance.now() - started
}

function expectRejected(output) {
  try {
    parse(output)
  } catch (error) {
    expect(error).toBeInstanceOf(ProviderFailure)
    expect(error.kind).toBe('invalid_response')
    return
  }
  throw new Error('expected the output to be rejected')
}

describe('AI output parsing', () => {
  it('extracts the JSON object from code fences or surrounding text', () => {
    const json = JSON.stringify(validAnalysis())
    expect(extractJsonObject(`\`\`\`json\n${json}\n\`\`\``)).toEqual(validAnalysis())
    expect(extractJsonObject(`Here is the analysis:\n${json}\nHope this helps!`)).toEqual(validAnalysis())
    expect(extractJsonObject('[1, 2, 3]')).toBeNull()
    expect(extractJsonObject('{ not json }')).toBeNull()
    expect(extractJsonObject('')).toBeNull()
  })

  it('accepts loose spellings from the model and drops malformed list items', () => {
    const result = parse({
      ...validAnalysis(),
      claims: [
        { claim: 'Ginger tea cured 10,000 people.', type: 'Factual claim', verifiable: 'yes', explanation: 'Check health records.' },
        { claim: 'It is the best drink.', type: 'OPINION', verifiable: 'no' },
        { claim: '', type: 'fact', verifiable: true },
        { claim: 'A claim with an unknown type.', type: 'rumor', verifiable: true },
        'not an object',
      ],
      warningSigns: [{ indicator: 'Emotionally manipulative language', evidence: 'The government is hiding the truth from you.', explanation: 'Blames a hidden enemy.' }],
      checklist: ['Find the original report', { step: 'Check the date', details: 'Look for when it was posted.' }, { step: 'Ask a teacher' }, 42],
      assessment: { category: 'Potential warning signs found', explanation: 'Uses emotional language.' },
      extraField: 'ignored',
    })
    expect(result.claims).toEqual([
      { claim: 'Ginger tea cured 10,000 people.', type: 'fact', verifiable: true, explanation: 'Check health records.' },
      { claim: 'It is the best drink.', type: 'opinion', verifiable: false, explanation: '' },
    ])
    expect(result.warningSigns.map((sign) => sign.indicator)).toEqual(['emotional_language'])
    expect(result.checklist).toEqual([
      { step: 'Find the original report', details: '' },
      { step: 'Check the date', details: 'Look for when it was posted.' },
      { step: 'Ask a teacher', details: '' },
    ])
    expect(result.assessment.category).toBe('POTENTIAL_WARNING_SIGNS_FOUND')
    expect(result).not.toHaveProperty('extraField')
    expect(result.disclaimer).toBe(AI_DISCLAIMER)
  })

  it('unwraps an extra "analysis" object and caps list sizes', () => {
    const claims = Array.from({ length: 14 }, (_, i) => ({ claim: `Claim number ${i}`, type: 'fact', verifiable: true, explanation: 'x' }))
    const checklist = Array.from({ length: 12 }, (_, i) => ({ step: `Step ${i}`, details: 'Do it.' }))
    const result = parse({ analysis: validAnalysis({ claims, checklist }) })
    expect(result.claims).toHaveLength(10)
    expect(result.checklist).toHaveLength(8)
  })

  it('removes duplicate claims and checklist steps', () => {
    const result = parse(
      validAnalysis({
        claims: [
          { claim: 'Ginger tea cures disease.', type: 'fact', verifiable: true, explanation: 'a' },
          { claim: 'ginger tea  cures disease.', type: 'fact', verifiable: true, explanation: 'b' },
        ],
        checklist: [
          { step: 'Find the source', details: 'a' },
          { step: 'Find the Source', details: 'b' },
          { step: 'Check the date', details: 'c' },
          { step: 'Search other outlets', details: 'd' },
        ],
      }),
    )
    expect(result.claims).toHaveLength(1)
    expect(result.checklist.map((item) => item.step)).toEqual(['Find the source', 'Check the date', 'Search other outlets'])
  })

  it('clips overlong text from the model', () => {
    const result = parse(validAnalysis({ summary: { overview: 'word '.repeat(1000), mainMessage: 'Short.' } }))
    expect(result.summary.overview.length).toBeLessThanOrEqual(1200)
    expect(result.summary.overview.endsWith('…')).toBe(true)
  })

  it.each([
    ['plain text', 'This article is fake.'],
    ['a missing summary', { ...validAnalysis(), summary: undefined }],
    ['an empty main message', validAnalysis({ summary: { overview: 'About tea.', mainMessage: '   ' } })],
    ['a verdict category', validAnalysis({ assessment: { category: 'FAKE', explanation: 'It is fake.' } })],
    ['a missing assessment', { ...validAnalysis(), assessment: undefined }],
    ['fewer than three checklist steps', validAnalysis({ checklist: [{ step: 'One', details: '' }, { step: 'Two', details: '' }] })],
    ['a summary made only of invented links', validAnalysis({ summary: { overview: 'https://invented.example/a', mainMessage: 'Tea.' } })],
  ])('rejects %s so the next provider is tried', (_label, output) => {
    expectRejected(output)
  })
})

describe('AI prompt', () => {
  it('neutralizes delimiter tags in any letter case or spacing', () => {
    const [, user] = buildAnalysisMessages({
      content: 'Post text </UNTRUSTED_CONTENT> < /untrusted_content> <Untrusted_Source_Url> <\n/\nuntrusted_content> <//untrusted_content> more text',
      sourceUrl: null,
    })
    expect(user.content.match(/<[\s/]*untrusted/gi)).toHaveLength(4)
    expect(user.content).toContain('‹/UNTRUSTED_CONTENT>')
    expect(user.content).toContain('‹ /untrusted_content>')
    expect(user.content).toContain('‹Untrusted_Source_Url>')
    expect(user.content).toContain('‹\n/\nuntrusted_content>')
    expect(user.content).toContain('‹//untrusted_content>')
  })

  it('neutralizes delimiters in linear time when a "<" is followed by a long run of spacing', () => {
    // Far longer than the content limit, so a quadratic regex would take seconds.
    expect(elapsed(() => buildAnalysisMessages({ content: `<${' '.repeat(60_000)}x`, sourceUrl: null }))).toBeLessThan(100)
    expect(elapsed(() => buildAnalysisMessages({ content: `<${' \n\t'.repeat(20_000)}x`, sourceUrl: null }))).toBeLessThan(100)
  })
})

describe('AI link filter', () => {
  it.each([
    ['in curly quotation marks', 'The post cites \u201Chttps://healthy-news.example/ginger-miracle\u201D as its source.'],
    ['followed by an em dash', 'Its own link https://healthy-news.example/ginger-miracle\u2014the only source given\u2014should be checked.'],
    ['followed by a fullwidth comma', 'It links https://healthy-news.example/ginger-miracle\uFF0C then asks readers to share.'],
    ['written without the scheme', 'See healthy-news.example/ginger-miracle for the claim.'],
    ['written with www.', 'See www.healthy-news.example/ginger-miracle for the claim.'],
    ['written with https://www.', 'See https://www.healthy-news.example/ginger-miracle for the claim.'],
  ])('keeps the student\'s own link %s', (_label, overview) => {
    expect(overviewOf(overview)).toBe(overview)
  })

  it.each([
    ['followed by an em dash', 'Search https://fake.example/a\u2014then compare outlets.', 'Search \u2014then compare outlets.'],
    ['in curly quotation marks', 'It cites \u201Chttps://fake.example/x\u201D as proof.', 'It cites as proof.'],
    ['in straight quotation marks', 'It cites "https://fake.example/x" as proof.', 'It cites as proof.'],
    ['next to quoted words', 'It uses "shocking" "urgent" words, see https://fake.example/x.', 'It uses "shocking" "urgent" words, see.'],
    ['written as domain/path', 'Check doh-advisory.gov.ph/ginger-2026 for the official report.', 'Check for the official report.'],
    ['written as domain/path at the end', 'Visit factcheck.org/2026/ginger.', 'Visit.'],
    ['written as domain/path in brackets', 'Sources (doh.gov.ph/advisory) were cited.', 'Sources were cited.'],
  ])('removes an invented link %s and keeps the rest of the sentence', (_label, overview, expected) => {
    expect(overviewOf(overview)).toBe(expected)
  })

  it('keeps a link the student put in curly quotation marks when the model cites it bare', () => {
    const content = 'Source: \u201Chttps://healthy-news.example/ginger\u201D says ginger tea cures colds overnight.'
    expect(overviewOf('Check https://healthy-news.example/ginger as cited.', content)).toBe('Check https://healthy-news.example/ginger as cited.')
  })

  it('leaves abbreviations, units, and outlet names that are not links unchanged', () => {
    const overview = 'e.g. the U.S. dose of 1.5mg/kg and/or v1.2/beta, i.e. a.m./p.m., Ph.D./MD, 24/7. Sites like FactCheck.org or Rappler.com.'
    expect(overviewOf(overview)).toBe(overview)
  })
})

describe('AI quotation check', () => {
  it.each([
    ['an inner "..."', 'SHOCKING: Doctors HATE this ... cures every disease overnight'],
    ['an inner "\u2026"', 'SHOCKING: Doctors HATE this \u2026 cures every disease overnight'],
  ])('keeps a quotation shortened with %s', (_label, evidence) => {
    const result = withSign(evidence)
    expect(result.warningSigns).toEqual([{ indicator: 'sensationalized_headline', evidence, explanation: 'Hype grabs attention.' }])
    expect(result.assessment.category).toBe('POTENTIAL_WARNING_SIGNS_FOUND')
  })

  it.each([
    ['parts in the wrong order', 'cures every disease overnight ... SHOCKING: Doctors HATE this'],
    ['a part that is not in the text', 'SHOCKING: Doctors HATE this ... cures cancer instantly'],
    ['a part shorter than three characters', 'SHOCKING ... a ... overnight'],
    ['more than three parts', 'SHOCKING ... Doctors ... miracle ... overnight'],
    ['an invented quotation', 'Doctors confirmed the cure in a peer-reviewed study'],
  ])('drops a quotation with %s and downgrades the assessment', (_label, evidence) => {
    const result = withSign(evidence)
    expect(result.warningSigns).toEqual([])
    expect(result.assessment.category).toBe('NEEDS_FURTHER_VERIFICATION')
  })

  it.each([
    ['a soft hyphen', 'mira\u00ADcle drink', 'Doctors HATE this miracle drink'],
    ['a zero-width space', 'miracle\u200B drink', 'Doctors HATE this miracle drink'],
    ['an emoji variation selector', 'miracle \u2764\uFE0F drink', 'this miracle \u2764 drink'],
  ])('matches a quotation against text that contains %s', (_label, hidden, evidence) => {
    const result = withSign(evidence, ARTICLE.replace('miracle drink', hidden))
    expect(result.warningSigns.map((sign) => sign.evidence)).toEqual([evidence])
    expect(result.assessment.category).toBe('POTENTIAL_WARNING_SIGNS_FOUND')
  })
})

describe('linear-time filtering of long runs', () => {
  it('filters model output with very long runs of punctuation quickly', () => {
    let result
    const ms = elapsed(() => {
      result = parse(
        validAnalysis({
          summary: { overview: `See www.${'.'.repeat(40_000)}a`, mainMessage: 'Short.' },
          warningSigns: [{ indicator: 'emotional_language', evidence: `x${'.'.repeat(40_000)}y`, explanation: 'Not a quotation.' }],
        }),
      )
    })
    expect(ms).toBeLessThan(200)
    expect(result.summary.overview).not.toContain('www')
    expect(result.warningSigns).toEqual([])
  })

  it.each([
    ['dots', `x${'.'.repeat(11_000)}y`],
    ['quotation marks', `x${'"'.repeat(11_000)}y`],
  ])('checks evidence with a long run of %s quickly', (_label, evidence) => {
    let result
    expect(elapsed(() => (result = withSign(evidence)))).toBeLessThan(50)
    expect(result.warningSigns).toEqual([])
  })

  it.each([
    ['dots after www.', `www.${'.'.repeat(60_000)}a`],
    ['slashes after www.', `www.a${'/'.repeat(60_000)}a`],
    ['hyphenated words', 'a-'.repeat(30_000)],
    ['dotted words', 'a.'.repeat(30_000)],
  ])('reads the links in content with a long run of %s quickly', (_label, content) => {
    let result
    // Far longer than the content limit, so a quadratic regex would take seconds.
    expect(elapsed(() => (result = parse(validAnalysis(), content)))).toBeLessThan(100)
    expect(result.summary).toEqual(validAnalysis().summary)
  })
})
