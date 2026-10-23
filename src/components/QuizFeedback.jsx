import { CircleCheck, CircleX, ExternalLink, Film, ImageIcon } from 'lucide-react'

/** Shown after an answer is submitted: correct/incorrect, explanation, media sources, and source link. */
export default function QuizFeedback({ question, isCorrect }) {
  const isVideo = Boolean(question.video || question.videos?.length)
  const SourcesIcon = isVideo ? Film : ImageIcon

  return (
    <div
      role="status"
      className={`rounded-md border p-5 motion-safe:animate-fade-up ${
        isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
      }`}
    >
      <p className={`flex items-center gap-2 font-display text-lg font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
        {isCorrect ? <CircleCheck className="size-5" aria-hidden="true" /> : <CircleX className="size-5" aria-hidden="true" />}
        {isCorrect ? 'Correct' : 'Not quite'}
      </p>
      {!isCorrect && (
        <p className="mt-2 text-sm font-medium text-slate-700">
          Correct answer: <span className="text-emerald-800">{question.options[question.answer]}</span>
        </p>
      )}
      <p className="mt-2 leading-relaxed text-slate-700">{question.explanation}</p>


      {question.credits?.length > 0 && (
        <div className="mt-4 rounded-md bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <SourcesIcon className="size-4 text-cyan-600" aria-hidden="true" />
            {isVideo ? 'Video sources' : 'Image sources'}
          </p>
          <ul className="mt-2 space-y-2">
            {question.credits.map((credit) => (
              <li key={credit.url}>
                <a
                  href={credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1.5 text-sm text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900 hover:decoration-navy-500"
                >
                  <span>{credit.label}</span>
                  <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.source && (
        <a
          href={question.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:text-navy-900 hover:decoration-navy-500"
        >
          Learn more: {question.source.label}
          <ExternalLink className="size-3.5" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  )
}
