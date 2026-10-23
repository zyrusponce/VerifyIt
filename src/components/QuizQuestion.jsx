import { CircleCheck, CircleX, Film, ImageIcon, Info, ZoomIn } from 'lucide-react'
import Alert from './Alert'
import Badge, { difficultyTone } from './Badge'
import Button from './Button'
import FictionalNotice from './FictionalNotice'
import QuizFeedback from './QuizFeedback'

function optionClass({ submitted, isSelected, isCorrect }) {
  if (submitted && isCorrect) return 'border-emerald-300 bg-emerald-50 text-emerald-900'
  if (submitted && isSelected) return 'border-rose-300 bg-rose-50 text-rose-900'
  if (submitted) return 'border-slate-200 bg-white text-slate-500'
  if (isSelected) return 'border-navy-900 bg-navy-50 text-navy-900 ring-1 ring-navy-900'
  return 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:bg-slate-50'
}

/**
 * A quiz video clip. Nothing plays until the learner presses play, and the text description is linked for
 * screen-reader users (the clips have no captions of their own).
 */
function QuizVideo({ item, className = '' }) {
  const descriptionId = `video-desc-${item.src.replace(/[^a-z0-9]/gi, '-')}`
  return (
    <>
      <video
        key={item.src}
        src={item.src}
        poster={item.poster}
        controls
        playsInline
        preload="metadata"
        aria-describedby={descriptionId}
        className={`block w-full bg-black ${className}`}
      >
        Your browser cannot play this video.
      </video>
      <span id={descriptionId} className="sr-only">
        {item.description}
      </span>
    </>
  )
}

/** One multiple-choice question with optional scenario, image(s), video(s), and feedback. */
export default function QuizQuestion({
  question,
  number,
  categoryLabel,
  selected,
  onSelect,
  submitted,
  onSubmit,
  checking = false,
  checkError = null,
}) {
  const isCorrect = submitted && selected === question.answer
  const canSubmit = selected !== null && selected !== undefined
  const { scenario, image, images, video, videos } = question

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {categoryLabel && <Badge tone="navy">{categoryLabel}</Badge>}
        <Badge tone={difficultyTone[question.difficulty] ?? 'slate'}>{question.difficulty}</Badge>
      </div>

      {videos?.length > 0 && (
        <figure className="rounded-md border border-slate-200 bg-paper p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((item) => (
              <div key={item.src} className="overflow-hidden rounded-md border border-slate-200 bg-black">
                <p className="keep-palette flex items-center gap-1.5 bg-navy-900 px-3 py-1.5 text-xs font-bold text-white">
                  <Film className="size-3.5 text-cyan-300" aria-hidden="true" />
                  {item.label}
                </p>
                <QuizVideo item={{ ...item, description: `${item.label}: ${item.description}` }} className="aspect-video object-contain" />
              </div>
            ))}
          </div>
          {question.videosNote && (
            <figcaption className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
              <Film className="mt-0.5 size-3.5 shrink-0 text-cyan-600" aria-hidden="true" />
              {question.videosNote}
            </figcaption>
          )}
        </figure>
      )}

      {video && (
        <figure className="overflow-hidden rounded-md border border-slate-200 bg-paper">
          {/* Tall (phone-shaped) clips are capped so the question stays on screen. */}
          <QuizVideo item={video} className="h-auto max-h-[30rem] object-contain" />
          <figcaption className="flex items-start gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
            <Film className="mt-0.5 size-3.5 shrink-0 text-cyan-600" aria-hidden="true" />
            {video.caption}
          </figcaption>
        </figure>
      )}

      {images?.length > 0 && (
        <figure className="rounded-md border border-slate-200 bg-paper p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((item) => (
              <a
                key={item.src}
                href={item.src}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-md border border-slate-200 bg-white"
              >
                <img src={item.src} alt={item.alt} className="block aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
                <span className="absolute left-2 top-2 rounded-full bg-navy-900/90 px-2.5 py-1 text-xs font-bold text-white" aria-hidden="true">
                  {item.label}
                </span>
                <span
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-navy-900 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
                  aria-hidden="true"
                >
                  <ZoomIn className="size-3.5" />
                  View full size
                </span>
                <span className="sr-only">(opens {item.label} full size in a new tab)</span>
              </a>
            ))}
          </div>
          {question.imagesNote && (
            <figcaption className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
              <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-600" aria-hidden="true" />
              {question.imagesNote}
            </figcaption>
          )}
        </figure>
      )}

      {image && (
        <figure className="overflow-hidden rounded-md border border-slate-200 bg-paper">
          <a href={image.src} target="_blank" rel="noopener noreferrer" className="group relative block bg-slate-900">
            {/* Tall images are capped so the question stays on screen; "View full size" shows every detail. */}
            <img src={image.src} alt={image.alt} className="block h-auto max-h-[32rem] w-full object-contain" loading="lazy" decoding="async" />
            <span
              className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-navy-900 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
              aria-hidden="true"
            >
              <ZoomIn className="size-3.5" />
              View full size
            </span>
            <span className="sr-only">(opens the image full size in a new tab)</span>
          </a>
          <figcaption className="flex items-start gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-600">
            <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-600" aria-hidden="true" />
            {image.caption}
          </figcaption>
        </figure>
      )}

      {scenario && (
        <div className="rounded-md border border-slate-200 bg-paper p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy-900">
              {scenario.account} <span className="font-normal text-slate-500">{scenario.handle}</span>
            </p>
            <FictionalNotice>Fictional</FictionalNotice>
          </div>
          {scenario.meta && <p className="mt-0.5 text-xs text-slate-500">{scenario.meta}</p>}
          <p className="mt-3 font-display text-lg font-bold leading-snug text-navy-900 sm:text-xl">{scenario.text}</p>
          {scenario.detail && (
            <p className="mt-3 flex gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">
              <Info className="mt-0.5 size-4 shrink-0 text-cyan-600" aria-hidden="true" />
              <span>{scenario.detail}</span>
            </p>
          )}
        </div>
      )}

      <fieldset>
        <legend className="font-display text-xl font-bold text-navy-900 sm:text-2xl">
          <span className="sr-only">Question {number}: </span>
          {question.prompt}
        </legend>
        <div className="mt-4 grid gap-3">
          {question.options.map((option, index) => {
            const id = `${question.id}-option-${index}`
            const isSelected = selected === index
            const isAnswer = index === question.answer
            return (
              <div key={id}>
                <input
                  id={id}
                  type="radio"
                  name={question.id}
                  value={index}
                  checked={isSelected}
                  onChange={() => onSelect(index)}
                  disabled={submitted || checking}
                  className="peer sr-only"
                />
                <label
                  htmlFor={id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3.5 text-sm font-medium transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-600 peer-disabled:cursor-default sm:text-base ${optionClass({ submitted, isSelected, isCorrect: isAnswer })}`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold ${
                      isSelected && !submitted ? 'bg-navy-900 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                    }`}
                    aria-hidden="true"
                  >
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {submitted && isAnswer && <CircleCheck className="size-5 shrink-0 text-emerald-600" aria-label="Correct answer" role="img" />}
                  {submitted && isSelected && !isAnswer && <CircleX className="size-5 shrink-0 text-rose-600" aria-label="Your answer" role="img" />}
                </label>
              </div>
            )
          })}
        </div>
      </fieldset>

      {!submitted && checkError && (
        <Alert tone="error" title="Your answer could not be checked">
          {checkError.message} Your choice is kept, so you can try again.
        </Alert>
      )}

      {!submitted && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onSubmit} disabled={!canSubmit || checking} size="lg">
            {checking ? 'Checking…' : checkError ? 'Try again' : 'Submit answer'}
          </Button>
          {!canSubmit && (
            <p className="text-sm text-slate-500">Choose an answer to continue.</p>
          )}
        </div>
      )}

      {submitted && <QuizFeedback question={question} isCorrect={isCorrect} />}
    </div>
  )
}
