/*
  Server catalog of quiz categories and questions, including the trusted answer keys.
  Question text and options come from the shared frontend files (src/data/quizzes/);
  correct answers and explanations come from the server-only quizAnswerKeys.js.
*/
import { MIXED_CATEGORY_ID, quizCategories as categoryContent } from '../../../src/data/quizCategories.js'
import { quizAnswerKeys } from './quizAnswerKeys.js'
import { CatalogError, assertUniqueIds } from './catalogChecks.js'

export { MIXED_CATEGORY_ID }

assertUniqueIds('quiz category', categoryContent)

const questionById = new Map()

const categories = categoryContent.map((category, index) => {
  const isMixed = Boolean(category.isMixed)
  if (isMixed && !(category.questionsPerCategory > 0)) {
    throw new CatalogError(`mixed category "${category.id}" needs a positive questionsPerCategory`)
  }

  const questions = isMixed ? [] : (category.questions ?? [])
  assertUniqueIds('quiz question', questions)
  for (const question of questions) {
    if (questionById.has(question.id)) throw new CatalogError(`question id "${question.id}" is used twice`)
    if (question.categoryId !== category.id) {
      throw new CatalogError(`question "${question.id}" has categoryId "${question.categoryId}" but is listed under "${category.id}"`)
    }
    const key = quizAnswerKeys[question.id]
    const optionCount = question.options?.length ?? 0
    if (optionCount < 2 || optionCount > 10) throw new CatalogError(`question "${question.id}" must have 2-10 options`)
    if (!key) throw new CatalogError(`question "${question.id}" has no answer key`)
    if (!Number.isInteger(key.answer) || key.answer < 0 || key.answer >= optionCount) {
      throw new CatalogError(`answer key for "${question.id}" is out of range`)
    }
    if (typeof key.explanation !== 'string' || key.explanation.trim() === '') {
      throw new CatalogError(`answer key for "${question.id}" has no explanation`)
    }
    const credits = key.credits ?? []
    if (!Array.isArray(credits) || credits.some((credit) => !credit?.label || !String(credit?.url ?? '').startsWith('https://'))) {
      throw new CatalogError(`answer key for "${question.id}" has invalid credits (each needs a label and an https url)`)
    }
    questionById.set(question.id, { ...question, answer: key.answer, explanation: key.explanation, credits })
  }

  return {
    id: category.id,
    title: category.title,
    description: category.description,
    difficulty: category.difficulty,
    topics: category.topics ?? [],
    isMixed,
    questionsPerCategory: isMixed ? category.questionsPerCategory : null,
    questionIds: questions.map((question) => question.id),
    sortOrder: index + 1,
  }
})

for (const id of Object.keys(quizAnswerKeys)) {
  if (!questionById.has(id)) throw new CatalogError(`answer key "${id}" does not match any question`)
}

const categoryById = new Map(categories.map((category) => [category.id, category]))

export const quizCategories = categories
export const topicCategories = categories.filter((category) => !category.isMixed)
export const allQuestions = [...questionById.values()]

export function getCategory(id) {
  return categoryById.get(id) ?? null
}

/** Full question including its answer key. Server use only. */
export function getQuestion(id) {
  return questionById.get(id) ?? null
}

/** Number of questions in one attempt of this category. */
export function questionCount(category) {
  return category.isMixed ? topicCategories.length * category.questionsPerCategory : category.questionIds.length
}

/** A question as it may be shown before answering: no answer index, no explanation. */
export function toPublicQuestion(question) {
  const { answer: _answer, explanation: _explanation, credits: _credits, ...publicFields } = question
  return publicFields
}

/** The questions a category can present, without answers. The Mixed Challenge returns its whole pool. */
export function publicQuestionsFor(category) {
  const ids = category.isMixed ? topicCategories.flatMap((topic) => topic.questionIds) : category.questionIds
  return ids.map((id) => toPublicQuestion(questionById.get(id)))
}
