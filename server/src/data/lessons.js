/*
  Server catalog of learning modules.
  Lesson content is shared with the frontend (src/data/lessons.js) so ids can never drift apart.
  A lesson counts toward the certificate unless it sets `requiredForCertificate: false`.
*/
import { lessons as lessonContent } from '../../../src/data/lessons.js'
import { assertUniqueIds } from './catalogChecks.js'

assertUniqueIds('lesson', lessonContent)

export const lessons = lessonContent.map((lesson, index) => ({
  id: lesson.id,
  number: lesson.number ?? index + 1,
  title: lesson.title,
  description: lesson.description,
  difficulty: lesson.difficulty,
  readingTime: lesson.readingTime,
  sortOrder: index + 1,
  requiredForCertificate: lesson.requiredForCertificate !== false,
}))

const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]))

export const REQUIRED_LESSON_IDS = lessons.filter((lesson) => lesson.requiredForCertificate).map((lesson) => lesson.id)

export function getLesson(id) {
  return lessonById.get(id) ?? null
}
