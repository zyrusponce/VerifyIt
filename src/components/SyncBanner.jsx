import { useState } from 'react'
import { CloudUpload, LoaderCircle, RefreshCw } from 'lucide-react'
import Button from './Button'
import useProgress from '../hooks/useProgress'

function describePending(pending) {
  const parts = []
  if (pending.lessons.length) parts.push(`${pending.lessons.length} lesson${pending.lessons.length === 1 ? '' : 's'}`)
  if (pending.cases.length) parts.push(`${pending.cases.length} investigation case${pending.cases.length === 1 ? '' : 's'}`)
  if (pending.quizzes.length) parts.push(`${pending.quizzes.length} quiz attempt${pending.quizzes.length === 1 ? '' : 's'}`)
  if (pending.toolkit.length) parts.push('your checklist')
  return parts.join(', ')
}

/**
 * Shown to signed-in users when this browser holds progress their account does not have yet:
 * guest progress waiting to be imported, or account saves that failed and are queued for retry.
 */
export default function SyncBanner() {
  const { mode, guest, outbox } = useProgress()
  const [dismissed, setDismissed] = useState(false)
  const [retrying, setRetrying] = useState(false)

  if (mode !== 'account') return null
  const { pending, importState } = guest
  const showImport = !dismissed && (pending.total > 0 || importState.state !== 'idle')
  const showOutbox = outbox.pending.length > 0 || outbox.failed.length > 0
  if (!showImport && !showOutbox) return null

  async function retryOutbox() {
    setRetrying(true)
    try {
      await outbox.retry()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="border-b border-cyan-100 bg-cyan-50/70">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
        {showImport && (
          <div role="status" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-navy-900">
              <CloudUpload className="mt-0.5 size-4 shrink-0 text-cyan-700" aria-hidden="true" />
              <span>
                {importState.state === 'importing' && `Saving guest progress to your account… (${importState.done ?? 0} of ${importState.total ?? 0})`}
                {importState.state === 'done' &&
                  `Guest progress saved to your account.${importState.skipped?.length ? ` ${importState.skipped.length} item(s) were skipped because they no longer exist.` : ''}`}
                {importState.state === 'error' &&
                  `Some guest progress could not be saved yet: ${importState.error?.message ?? 'please try again.'} Nothing was lost; it is still in this browser.`}
                {importState.state === 'idle' && (
                  <>
                    This browser has guest progress that is not in your account yet: <strong>{describePending(pending)}</strong>. Save it to your
                    account? The server re-checks every item.
                  </>
                )}
              </span>
            </p>
            <div className="flex shrink-0 gap-2">
              {(importState.state === 'idle' || importState.state === 'error') && pending.total > 0 && (
                <Button size="sm" onClick={guest.importToAccount} icon={CloudUpload} iconPosition="left">
                  {importState.state === 'error' ? 'Try again' : 'Save to my account'}
                </Button>
              )}
              {importState.state === 'importing' && <LoaderCircle className="size-5 text-cyan-700 motion-safe:animate-spin" aria-hidden="true" />}
              {importState.state !== 'importing' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    guest.dismissImport()
                    setDismissed(true)
                  }}
                >
                  {importState.state === 'done' ? 'Close' : 'Not now'}
                </Button>
              )}
            </div>
          </div>
        )}
        {showOutbox && (
          <div role="status" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-amber-900">
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                {outbox.pending.length > 0 &&
                  `${outbox.pending.length} change${outbox.pending.length === 1 ? ' has' : 's have'} not reached your account yet. They are kept on this device. `}
                {outbox.failed.length > 0 && `${outbox.failed.length} change${outbox.failed.length === 1 ? ' was' : 's were'} rejected by the server.`}
              </span>
            </p>
            <div className="flex shrink-0 gap-2">
              {outbox.pending.length > 0 && (
                <Button size="sm" variant="secondary" onClick={retryOutbox} disabled={retrying} icon={RefreshCw} iconPosition="left">
                  {retrying ? 'Retrying…' : 'Retry now'}
                </Button>
              )}
              {outbox.failed.length > 0 && (
                <Button size="sm" variant="ghost" onClick={outbox.discardFailed}>
                  Dismiss rejected
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
