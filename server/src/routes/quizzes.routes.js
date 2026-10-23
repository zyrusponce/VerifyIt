/*
  ⚡ LAYER: Controller → quizzes.service → Data Access (submit_quiz_attempt RPC, quiz_attempts, RLS)
  🔒 SECURITY: Question lists never include answers. The answer check is public but rate-limited and
     reveals a single answer only after it is submitted. Attempts require a verified bearer token; the
     client sends only question ids, chosen options, and confidence. Scores are computed in the database.
  🚨 ERROR HANDLING: 400 malformed input/duplicates; 401 auth; 404 unknown category or attempt;
     422 unknown question or incomplete set; 201 new attempt, 200 repeated clientAttemptId.
*/
import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { quizSchemas } from '../validators/schemas.js'
import { checkAnswer, getAttempt, getQuestions, listAttempts, listCategories, submitAttempt } from '../services/quizzes.service.js'

export function createQuizzesRouter({ authenticate, limiters }) {
  const router = Router()

  router.get('/quizzes/categories', (_req, res) => {
    res.status(200).json({ data: listCategories() })
  })

  router.get('/quizzes/attempts', authenticate, validate(quizSchemas.listAttempts), async (req, res) => {
    res.status(200).json({ data: await listAttempts(req.repo, req.valid.query) })
  })

  router.get('/quizzes/attempts/:attemptId', authenticate, validate(quizSchemas.getAttempt), async (req, res) => {
    res.status(200).json({ data: await getAttempt(req.repo, req.valid.params.attemptId) })
  })

  router.get('/quizzes/:category/questions', validate(quizSchemas.questions), (req, res) => {
    res.status(200).json({ data: getQuestions(req.valid.params.category) })
  })

  router.post('/quizzes/:category/check', limiters.answerCheck, validate(quizSchemas.check), (req, res) => {
    res.status(200).json({ data: checkAnswer(req.valid.params.category, req.valid.body) })
  })

  router.post('/quizzes/:category/attempts', limiters.submissions, authenticate, validate(quizSchemas.submit), async (req, res) => {
    const { attempt, created } = await submitAttempt(req.repo, req.valid.params.category, req.valid.body)
    res.status(created ? 201 : 200).json({ data: attempt })
  })

  return router
}
