import { ensureEtymologyData, getEtymologyEntry, shouldShowEtymology } from './repository'
import type { EtymologyEntry } from './types'
import { useCallback, useEffect, useRef, useState } from 'react'

// Reusable completion boundary for future cloze exercises. Does not score or schedule reviews.
export function useEtymologyFeedback(word: string, enabled: boolean, onContinue: () => void) {
  const [active, setActive] = useState(false)
  const [feedback, setFeedback] = useState<{ entry?: EtymologyEntry; completion: boolean }>()
  const [notice, setNotice] = useState('')
  const advance = useRef(onContinue)
  advance.current = onContinue
  const inFlight = useRef(false)
  const generation = useRef(0)
  useEffect(() => {
    generation.current += 1
    inFlight.current = false
    setFeedback(undefined)
    setActive(false)
    if (enabled)
      void ensureEtymologyData().catch(() => {
        /* Local data remains independently readable. */
      })
    return () => {
      generation.current += 1
    }
  }, [word, enabled])
  const close = useCallback(() => {
    const shouldAdvance = feedback?.completion
    setFeedback(undefined)
    setActive(false)
    if (shouldAdvance && inFlight.current) {
      inFlight.current = false
      advance.current()
    }
  }, [feedback])
  const complete = useCallback(async () => {
    if (inFlight.current) return
    if (!enabled) {
      advance.current()
      return
    }
    inFlight.current = true
    setNotice('')
    setActive(true)
    const current = generation.current
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([
        (async () => {
          if (!(await shouldShowEtymology(word))) return { skip: true }
          return { entry: await getEtymologyEntry(word) }
        })(),
        new Promise<{ entry?: EtymologyEntry }>((resolve) => {
          timer = setTimeout(() => resolve({}), 1500)
        }),
      ])
      if (current !== generation.current) return
      if ('entry' in result && result.entry?.verificationStatus === 'verified') {
        setFeedback({ entry: result.entry, completion: true })
        return
      }
      if (!('skip' in result)) setNotice(`${word}：暂无可靠词源资料，可通过“查看词源”检查待核实内容。`)
    } catch {
      if (current === generation.current) setNotice('暂无可靠词源资料；已继续原有练习。')
    } finally {
      if (timer) clearTimeout(timer)
    }
    if (current === generation.current) {
      inFlight.current = false
      setActive(false)
      advance.current()
    }
  }, [enabled, word])
  const open = useCallback(() => {
    if (inFlight.current) return
    setActive(true)
    setFeedback({ completion: false })
  }, [])
  return { active, feedback, notice, complete, close, open }
}
