import { useLocation, useNavigate, useParams } from 'react-router-dom'
import QuizEngine from '../components/QuizEngine'
import useProgress from '../hooks/useProgress'
import NotFound from './NotFound'
import { allQuestions, getQuizCategory } from '../data/quizCategories'

/** /quiz/:categoryId — one category quiz, run by the shared QuizEngine. */
export default function QuizCategory() {
  const { categoryId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const category = getQuizCategory(categoryId)
  const { userId } = useProgress()

  if (!category) return <NotFound />

  return (
    <QuizEngine
      // A new key per category resets the engine when moving between category URLs.
      // Signing in or out switches to that person's own saved session.
      key={`${category.id}:${userId ?? 'guest'}`}
      category={category}
      questions={category.isMixed ? allQuestions : category.questions}
      autoStart={Boolean(location.state?.autoStart)}
      // Clear the flag so refreshing the page does not restart the quiz.
      onAutoStarted={() => navigate(location.pathname, { replace: true, state: null })}
    />
  )
}
