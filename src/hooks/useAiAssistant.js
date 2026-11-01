import { useContext } from 'react'
import { AiAssistantContext } from '../context/AiAssistantContext'

/** The AI Investigation Assistant's shared input, request, and result. Must be used inside <AiAssistantProvider>. */
export default function useAiAssistant() {
  const value = useContext(AiAssistantContext)
  if (!value) throw new Error('useAiAssistant must be used inside <AiAssistantProvider>')
  return value
}
