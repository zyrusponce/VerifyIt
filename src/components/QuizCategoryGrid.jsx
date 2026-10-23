import QuizCategoryCard from './QuizCategoryCard'
import { hasSessionInProgress } from '../utils/quiz'

/**
 * Responsive grid of category cards: one column on phones, two on tablets, three on desktop.
 * The Mixed Challenge is shown as a wide featured card after the single-topic categories.
 */
export default function QuizCategoryGrid({ categories, records = {}, ownerId = null }) {
  const topics = categories.filter((category) => !category.isMixed)
  const mixed = categories.find((category) => category.isMixed)
  const completedTopics = topics.filter((category) => records[category.id]?.completed).length

  return (
    <div className="space-y-6">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((category, i) => (
          <li key={category.id} className="motion-safe:animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <QuizCategoryCard
              category={category}
              record={records[category.id]}
              inProgress={hasSessionInProgress(category.id, ownerId)}
            />
          </li>
        ))}
      </ul>

      {mixed && (
        <QuizCategoryCard
          category={mixed}
          record={records[mixed.id]}
          inProgress={hasSessionInProgress(mixed.id, ownerId)}
          featured
          footnote={
            completedTopics < topics.length
              ? `Recommended after the topic quizzes. You have completed ${completedTopics} of ${topics.length}.`
              : 'You have completed every topic quiz. You are ready for the full challenge.'
          }
        />
      )}
    </div>
  )
}
