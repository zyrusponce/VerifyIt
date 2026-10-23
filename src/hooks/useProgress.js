import { useContext } from 'react'
import { ProgressContext } from '../context/ProgressContext'

/**
 * All learning progress (lessons, investigations, quizzes, checklist) plus a ready-to-display summary.
 * Guests read and write this browser's localStorage; signed-in users read and write their account
 * through the API. Must be used inside <ProgressProvider>.
 */
export default function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>')
  return value
}
