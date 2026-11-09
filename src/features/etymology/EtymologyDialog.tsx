import EtymologyCard from './EtymologyCard'
import { getEtymologyEntry } from './repository'
import type { EtymologyEntry } from './types'
import type { Word } from '@/typings'
import { Dialog } from '@headlessui/react'
import { useEffect, useRef, useState } from 'react'

export default function EtymologyDialog({
  initialWord,
  initialEntry,
  word,
  completion = false,
  onClose,
}: {
  initialWord: string
  initialEntry?: EtymologyEntry
  word?: Word
  completion?: boolean
  onClose: () => void
}) {
  const [selectedWord, setSelectedWord] = useState(initialWord)
  const [entry, setEntry] = useState(initialEntry)
  const [loading, setLoading] = useState(!initialEntry)
  const [error, setError] = useState('')
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    let active = true
    if (selectedWord === initialWord && initialEntry) {
      setEntry(initialEntry)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    void getEtymologyEntry(selectedWord)
      .then((data) => {
        if (active) setEntry(data)
      })
      .catch(() => {
        if (active) {
          setEntry(undefined)
          setError('本地资料暂不可读，可稍后重试。')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedWord, initialWord, initialEntry])
  return (
    <Dialog open onClose={onClose} initialFocus={closeButton} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Dialog.Title className="font-semibold text-gray-700 dark:text-gray-200">词根词源解析</Dialog.Title>
              <button type="button" ref={closeButton} className="my-btn-primary" onClick={onClose}>
                {completion ? '继续练习' : '关闭词源'}
              </button>
            </div>
            {selectedWord !== initialWord && (
              <button className="mb-3 text-sm text-indigo-500 underline" onClick={() => setSelectedWord(initialWord)}>
                返回 {initialWord}
              </button>
            )}
            <div className="max-h-[65vh] overflow-y-auto pr-2">
              {loading ? (
                <p role="status">读取本地资料…</p>
              ) : entry ? (
                <EtymologyCard
                  key={entry.id}
                  entry={entry}
                  fromCorrect={completion && selectedWord === initialWord}
                  word={selectedWord === initialWord ? word : undefined}
                  onWord={setSelectedWord}
                  onNavigate={completion ? undefined : onClose}
                  openRootsInNewTab={completion}
                />
              ) : (
                <p role="status">
                  {selectedWord}：暂无可靠词源资料。{error}
                </p>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
