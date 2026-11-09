import { ensureEtymologyData } from './repository'
import { useCallback, useEffect, useRef, useState } from 'react'

// Every completed English word waits here for an explicit next-word action.
// Looking up etymology must never advance the typing queue, even when data is missing.
export function useEtymologyFeedback(word: string, enabled: boolean, onContinue: () => void) {
  const [feedback, setFeedback] = useState<{ completion: true }>()
  const advance = useRef(onContinue)
  advance.current = onContinue
  const inFlight = useRef(false)
  useEffect(() => {
    inFlight.current = false
    setFeedback(undefined)
    if (enabled)
      void ensureEtymologyData().catch(() => {
        /* Reading can still show an unavailable-data message. */
      })
  }, [word, enabled])
  const next = useCallback(() => {
    if (!inFlight.current) return
    inFlight.current = false
    setFeedback(undefined)
    advance.current()
  }, [])
  const complete = useCallback(() => {
    if (inFlight.current) return
    if (!enabled) {
      advance.current()
      return
    }
    inFlight.current = true
    setFeedback({ completion: true })
  }, [enabled])
  return { active: Boolean(feedback), feedback, complete, next }
}
