// Guards the catalog: ids stay in sync with the frontend, and answer keys never reach the frontend bundle.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { REQUIRED_LESSON_IDS } from '../../src/data/lessons.js'
import { REQUIRED_CASE_IDS } from '../../src/data/investigations.js'
import { allQuestions, getQuestion } from '../../src/data/quizzes.js'
import { lessons as frontendLessons } from '../../../src/data/lessons.js'
import { investigations as frontendCases } from '../../../src/data/investigations.js'
import { allQuestions as frontendQuestions } from '../../../src/data/quizCategories.js'

const frontendSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../src')

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? listFiles(full) : [full]
  })
}

describe('catalog', () => {
  it('requires every existing lesson and investigation case for the certificate', () => {
    expect(REQUIRED_LESSON_IDS).toEqual(frontendLessons.map((lesson) => lesson.id))
    expect(REQUIRED_CASE_IDS).toEqual(frontendCases.map((item) => item.id))
    expect(REQUIRED_LESSON_IDS).toHaveLength(8)
    expect(REQUIRED_CASE_IDS).toHaveLength(6)
  })

  it('has an answer key for every frontend question, and no extra keys', () => {
    expect(allQuestions.map((q) => q.id).sort()).toEqual(frontendQuestions.map((q) => q.id).sort())
    for (const question of frontendQuestions) expect(getQuestion(question.id)?.answer).toBeTypeOf('number')
  })

  it('keeps answer keys and expected verdicts out of the frontend', () => {
    for (const question of frontendQuestions) {
      expect(question).not.toHaveProperty('answer')
      expect(question).not.toHaveProperty('explanation')
    }
    for (const item of frontendCases) {
      expect(item).not.toHaveProperty('expected')
      expect(item).not.toHaveProperty('explanation')
    }
    for (const file of listFiles(frontendSrc)) {
      const text = fs.readFileSync(file, 'utf8')
      // Comments may point to the server files; imports of them must never exist.
      expect(text, file).not.toMatch(/(?:from|import\()\s*['"][^'"]*(?:quizAnswerKeys|investigationVerdicts|server\/)/)
    }
  })
})
