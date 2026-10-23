import ProgressBar from './ProgressBar'

/**
 * Progress bar plus one marker per question showing which are answered, correct, or current.
 * `questions` and `responses` come from the quiz engine.
 */
export default function QuizProgress({ questions, responses, index }) {
  const answered = questions.filter((q) => responses[q.id]?.submitted)
  const correct = answered.filter((q) => responses[q.id].selected === q.answer).length

  return (
    <div>
      <ProgressBar
        value={answered.length}
        max={questions.length}
        label={`Question ${index + 1} of ${questions.length}`}
        showValue
        valueText={`${answered.length} answered · ${correct} correct`}
      />
      <ol className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
        {questions.map((q, i) => {
          const response = responses[q.id]
          const tone = !response?.submitted
            ? 'bg-slate-200'
            : response.selected === q.answer
              ? 'bg-emerald-500'
              : 'bg-rose-400'
          return (
            <li
              key={q.id}
              className={`h-1.5 w-5 rounded-full transition-colors sm:w-6 ${tone} ${i === index ? 'ring-2 ring-navy-900 ring-offset-1' : ''}`}
            />
          )
        })}
      </ol>
    </div>
  )
}
