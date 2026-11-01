import { describe, expect, it } from 'vitest'
import { VERDICT_LABELS, deriveVerdict } from '../../src/services/sourceCheck.service.js'

const factCheck = (stance, overrides = {}) => ({ kind: 'fact_check', stance, claimIndex: 0, publisher: 'Rappler', site: 'rappler.com', rating: 'False', ...overrides })
const news = (stance, site, overrides = {}) => ({ kind: 'news', stance, claimIndex: 0, publisher: site, site, rating: null, ...overrides })
const unrelated = (kind = 'news') => ({ kind, stance: 'unrelated', claimIndex: null, publisher: 'x.com', site: 'x.com', rating: null })
const verdict = (results, context = {}) => deriveVerdict(results, { claimCount: 1, searchedNews: true, ...context })

describe('initial verdict', () => {
  it('is likely fake with medium confidence when one fact-checker rated a similar claim false', () => {
    const v = verdict([factCheck('contradicts')])
    expect(v).toEqual({ label: 'likely_fake', confidence: 'medium', reasons: ['Rappler rated a similar claim “False”.'] })
  })

  it('is likely fake with high confidence when two fact-checkers agree', () => {
    const v = verdict([factCheck('contradicts'), factCheck('contradicts', { publisher: 'AFP Fact Check', rating: 'Misleading' })])
    expect(v).toMatchObject({ label: 'likely_fake', confidence: 'high' })
    expect(v.reasons).toEqual(['Rappler rated a similar claim “False”.', 'AFP Fact Check rated a similar claim “Misleading”.'])
  })

  it('does not let news outlets repeating a claim outweigh a fact-checker', () => {
    const v = verdict([factCheck('contradicts'), news('supports', 'a.com'), news('supports', 'b.com'), news('supports', 'c.com')])
    expect(v).toMatchObject({ label: 'likely_fake', confidence: 'medium' })
    expect(v.reasons.at(-1)).toMatch(/a news report alone does not show that a claim is true/)
  })

  it('is mixed when a fact-check supports and another contradicts', () => {
    const v = verdict([factCheck('contradicts'), factCheck('supports', { publisher: 'VERA Files', rating: 'True' })])
    expect(v).toMatchObject({ label: 'mixed', confidence: 'low' })
    expect(v.reasons.at(-1)).toMatch(/different directions/)
  })

  it('is likely real with medium confidence when a fact-checker rated a similar claim true', () => {
    expect(verdict([factCheck('supports', { rating: 'True' })])).toMatchObject({ label: 'likely_real', confidence: 'medium' })
  })

  it('is likely real with high confidence for a true rating plus two reporting websites', () => {
    const v = verdict([factCheck('supports', { rating: 'True' }), news('supports', 'a.com'), news('supports', 'b.com')])
    expect(v).toMatchObject({ label: 'likely_real', confidence: 'high' })
  })

  it('is likely real with low confidence for two websites, medium for three', () => {
    expect(verdict([news('supports', 'a.com'), news('supports', 'b.com')])).toMatchObject({ label: 'likely_real', confidence: 'low' })
    expect(verdict([news('supports', 'a.com'), news('supports', 'b.com'), news('supports', 'c.com')])).toMatchObject({ label: 'likely_real', confidence: 'medium' })
  })

  it('counts a website once however many of its reports are found', () => {
    expect(verdict([news('supports', 'a.com'), news('supports', 'a.com'), news('supports', 'a.com')])).toMatchObject({ label: 'unverified' })
  })

  it('never calls content real from one news report', () => {
    const v = verdict([news('supports', 'a.com')])
    expect(v.label).toBe('unverified')
    expect(v.confidence).toBe('low')
  })

  it('caps confidence at low when only some of several claims were found reported', () => {
    const v = verdict([factCheck('supports', { rating: 'True' }), news('supports', 'a.com'), news('supports', 'b.com')], { claimCount: 3 })
    expect(v).toMatchObject({ label: 'likely_real', confidence: 'low' })
    expect(v.reasons.at(-1)).toBe('Only 1 of the 3 claims checked were found reported, so the rest are still unchecked.')
  })

  it('is likely fake with low confidence when two websites report it as false or denied', () => {
    const v = verdict([news('contradicts', 'a.com'), news('contradicts', 'b.com')])
    expect(v).toMatchObject({ label: 'likely_fake', confidence: 'low' })
    expect(v.reasons).toEqual(['2 news websites report it as false, denied, or corrected: a.com, b.com.'])
    expect(verdict([news('contradicts', 'a.com'), news('contradicts', 'b.com'), news('contradicts', 'c.com')]).confidence).toBe('medium')
  })

  it('is unverified for a single disputing website', () => {
    expect(verdict([news('contradicts', 'a.com')]).label).toBe('unverified')
  })

  it('is unverified with an honest note when nothing relevant was found', () => {
    expect(verdict([])).toEqual({
      label: 'unverified',
      confidence: 'low',
      reasons: [expect.stringMatching(/No fact-checker or news website we searched reports these claims.*deserves caution/)],
    })
    expect(verdict([unrelated(), unrelated('fact_check')]).label).toBe('unverified')
    expect(verdict([], { searchedNews: false }).reasons[0]).toMatch(/No published fact-check was found/)
  })

  it('only reasons from the results it was given, and caps the fact-checks it lists at three', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map((publisher) => factCheck('contradicts', { publisher }))
    const v = verdict(many)
    expect(v.reasons).toHaveLength(3)
    expect(v.reasons.join(' ')).not.toMatch(/D rated|E rated/)
  })

  it('names a fact-check without a rating plainly', () => {
    expect(verdict([factCheck('contradicts', { rating: null })]).reasons).toEqual(['Rappler published a fact-check about a similar claim.'])
  })

  it('always returns one of the known labels', () => {
    const stances = ['supports', 'contradicts', 'unrelated']
    for (const a of stances) for (const b of stances) for (const c of stances) {
      const v = verdict([factCheck(a), news(b, 'a.com'), news(c, 'b.com')])
      expect(VERDICT_LABELS).toContain(v.label)
      expect(['low', 'medium', 'high']).toContain(v.confidence)
      expect(v.reasons.length).toBeGreaterThan(0)
    }
  })
})
