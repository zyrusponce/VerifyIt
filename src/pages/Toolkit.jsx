import { CircleCheck, ExternalLink, ListChecks, LoaderCircle, RotateCcw, ShieldAlert } from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import ChecklistItem from '../components/ChecklistItem'
import PageHeader from '../components/PageHeader'
import ProgressBar from '../components/ProgressBar'
import SaveStatus from '../components/SaveStatus'
import useProgress from '../hooks/useProgress'
import { checklistItems } from '../data/checklist'
import { verificationTools } from '../data/references'

const redFlags = [
  'Urgent language like "share before it gets deleted"',
  'No author, date, or original source',
  'A new or anonymous account',
  'Shocking claims no reliable outlet reports',
  'Photos without credit or location details',
]

export default function Toolkit() {
  const { checklist: checked, setChecklistItem, resetChecklist, mode, accountStatus, toolkitSave, outbox } = useProgress()
  const loadingAccount = mode === 'account' && accountStatus === 'loading'

  const checkedCount = checklistItems.filter((item) => checked[item.id]).length
  const total = checklistItems.length
  const complete = checkedCount === total

  function toggle(id) {
    setChecklistItem(id, !checked[id])
  }

  const saveState = mode === 'account' ? { saving: 'saving', saved: 'account', error: toolkitSave.error?.isRetryable ? 'pending' : 'failed' }[toolkitSave.state] : null

  return (
    <>
      <PageHeader watermark="Check"
        eyebrow="Verification Toolkit"
        icon={ListChecks}
        title="Before You Share checklist"
        description={`Use this checklist whenever a post seems surprising, emotional, or important. Tick off each step as you check it. ${
          mode === 'account' ? 'Your progress is saved to your account.' : 'Your progress is saved in this browser.'
        }`}
      />

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="min-w-0">
          <h2 className="sr-only">Checklist</h2>
          <ul className="space-y-3">
            {checklistItems.map((item, index) => (
              <ChecklistItem
                key={item.id}
                id={item.id}
                number={index + 1}
                title={item.title}
                explanation={item.explanation}
                tip={item.tip}
                checked={Boolean(checked[item.id])}
                onToggle={() => toggle(item.id)}
              />
            ))}
          </ul>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Checklist progress and tools">
          <Card>
            <ProgressBar
              value={checkedCount}
              max={total}
              label="Checklist progress"
              showValue
              valueText={`${checkedCount} of ${total}`}
              tone={complete ? 'green' : 'cyan'}
            />
            <p role="status" className="mt-4 text-sm leading-relaxed text-slate-600">
              {loadingAccount ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                  Loading your saved checklist…
                </span>
              ) : complete ? (
                <span className="flex items-start gap-2 font-medium text-emerald-800">
                  <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  All steps checked. If the claim held up, you can share it with confidence.
                </span>
              ) : checkedCount === 0 ? (
                'Start with the first step and work your way down.'
              ) : (
                `${total - checkedCount} step${total - checkedCount === 1 ? '' : 's'} left. If any step raises doubts, pause before sharing.`
              )}
            </p>
            {saveState && <SaveStatus state={saveState} error={toolkitSave.error} onRetry={outbox.retry} className="mt-3" />}
            <Button
              variant="secondary"
              onClick={resetChecklist}
              disabled={checkedCount === 0}
              icon={RotateCcw}
              iconPosition="left"
              className="mt-5 w-full"
            >
              Reset Checklist
            </Button>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 font-sans text-sm font-bold text-navy-900">
              <ShieldAlert className="size-4 text-orange-500" aria-hidden="true" />
              Red flags at a glance
            </h2>
            <ul className="mt-3 space-y-2">
              {redFlags.map((flag) => (
                <li key={flag} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" aria-hidden="true" />
                  {flag}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="font-sans text-sm font-bold text-navy-900">Free verification tools</h2>
            <p className="mt-1 text-xs text-slate-500">External websites, opened in a new tab.</p>
            <ul className="mt-4 space-y-3">
              {verificationTools.map((tool) => (
                <li key={tool.name}>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-md border border-slate-200 p-3 transition-colors hover:border-navy-300 hover:bg-paper"
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-navy-900">
                      {tool.name}
                      <ExternalLink className="size-3.5 text-slate-400 group-hover:text-navy-700" aria-hidden="true" />
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{tool.description}</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </section>
    </>
  )
}
