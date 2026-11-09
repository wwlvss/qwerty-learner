import EtymologyCard from './EtymologyCard'
import { getEtymologyEntry } from './repository'
import type { EtymologyEntry } from './types'
import type { Word } from '@/typings'
import { useEffect, useState } from 'react'

export interface EtymologyContentProps {
  initialWord: string
  initialEntry?: EtymologyEntry
  word?: Word
  completion?: boolean
  compact?: boolean
  onNavigate?: () => void
}

export default function EtymologyContent({
  initialWord,
  initialEntry,
  word,
  completion = false,
  compact = false,
  onNavigate,
}: EtymologyContentProps) {
  const [selectedWord, setSelectedWord] = useState(initialWord)
  const [entry, setEntry] = useState(initialEntry)
  const [loading, setLoading] = useState(!initialEntry)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (selectedWord === initialWord && initialEntry) {
      setEntry(initialEntry)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    let timer: ReturnType<typeof setTimeout> | undefined
    void Promise.race([
      getEtymologyEntry(selectedWord),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => resolve(undefined), 1500)
      }),
    ])
      .then((data) => {
        if (active) {
          const reliable = !completion || data?.verificationStatus === 'verified'
          setEntry(reliable ? data : undefined)
          if (data && !reliable) setError('现有资料待核实，可在词根库查看。')
        }
      })
      .catch(() => {
        if (active) {
          setEntry(undefined)
          setError('本地资料暂不可读，可稍后重试。')
        }
      })
      .finally(() => {
        if (timer) clearTimeout(timer)
        if (active) setLoading(false)
      })
    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [selectedWord, initialWord, initialEntry, completion])
  return (
    <>
      {selectedWord !== initialWord && (
        <button type="button" className="mb-3 text-sm text-indigo-500 underline" onClick={() => setSelectedWord(initialWord)}>
          返回 {initialWord}
        </button>
      )}
      {loading ? (
        <p role="status">读取本地资料…</p>
      ) : entry ? (
        <EtymologyCard
          key={entry.id}
          entry={entry}
          fromCorrect={completion && selectedWord === initialWord}
          word={selectedWord === initialWord ? word : undefined}
          onWord={setSelectedWord}
          onNavigate={completion ? undefined : onNavigate}
          openRootsInNewTab={completion}
          compact={compact}
        />
      ) : (
        <p role="status">
          {selectedWord}：暂无可靠词源资料。{error}
        </p>
      )}
    </>
  )
}
