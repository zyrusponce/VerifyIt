/*
  ⚡ LAYER: Controller → lessons.service → Data Access (lesson_progress, RLS)
  🔒 SECURITY: Lesson metadata is public. Progress routes require a verified bearer token; only
     catalog lesson ids are accepted (slug validation + catalog lookup + database foreign key).
  🚨 ERROR HANDLING: 400 malformed id/body; 401 auth; 404 unknown lesson; 201 first completion,
     200 when the lesson was already recorded.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { lessonSchemas } from '../validators/schemas.js'
import { completeLesson, getLessonProgress, listLessons } from '../services/lessons.service.js'

export function createLessonsRouter({ authenticate, limiters }) {
  const router = Router()

  router.get('/lessons', (_req, res) => {
    res.status(200).json({ data: listLessons() })
  })

  router.get('/lessons/progress', authenticate, async (req, res) => {
    res.status(200).json({ data: await getLessonProgress(req.repo) })
  })

  router.put('/lessons/progress/:lessonId', limiters.submissions, authenticate, validate(lessonSchemas.complete), async (req, res) => {
    const { progress, created } = await completeLesson(req.repo, req.valid.params.lessonId)
    res.status(created ? 201 : 200).json({ data: progress })
  })

  return router
}
