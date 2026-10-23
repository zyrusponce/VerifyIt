/*
  ⚡ LAYER: Service (learning modules)
  🔒 SECURITY: Only lesson ids from the server catalog can be completed; the database also enforces
     this with a foreign key to the private catalog. Progress is read and written as the verified user.
  🚨 ERROR HANDLING: Unknown lesson → 404 LESSON_NOT_FOUND. Repository errors propagate as mapped AppErrors.
*/
import { REQUIRED_LESSON_IDS, getLesson, lessons } from '../data/lessons.js'
import { notFound } from '../utils/AppError.js'

export function listLessons() {
  return lessons.map(({ id, number, title, description, difficulty, readingTime, requiredForCertificate }) => ({
    id,
    number,
    title,
    description,
    difficulty,
    readingTime,
    requiredForCertificate,
  }))
}

export function summarizeLessonProgress(records) {
  const byId = new Map(records.map((record) => [record.lessonId, record]))
  const items = lessons.map((lesson) => {
    const record = byId.get(lesson.id)
    return {
      lessonId: lesson.id,
      title: lesson.title,
      completed: record?.completed === true,
      completedAt: record?.completed ? record.completedAt : null,
    }
  })
  return {
    items,
    completed: items.filter((item) => item.completed && REQUIRED_LESSON_IDS.includes(item.lessonId)).length,
    required: REQUIRED_LESSON_IDS.length,
  }
}

export async function getLessonProgress(repo) {
  return summarizeLessonProgress(await repo.listLessonProgress())
}

/** Marks a known lesson complete. Idempotent: completing it again keeps the first completion time. */
export async function completeLesson(repo, lessonId) {
  const lesson = getLesson(lessonId)
  if (!lesson) throw notFound('LESSON_NOT_FOUND', 'This lesson does not exist.')

  const existing = await repo.getLessonProgress(lessonId)
  if (existing?.completed) return { progress: { ...existing, title: lesson.title }, created: false }

  const progress = await repo.completeLesson(lessonId)
  return { progress: { ...progress, title: lesson.title }, created: !existing }
}
