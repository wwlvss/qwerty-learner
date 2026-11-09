import type { FarmVocabulary } from './types'
import { getFarmMaterials } from '@/features/word-support/repository'
import { useEffect, useState } from 'react'

export default function FarmWordNotes({ word }: { word: string }) {
  const [entry, setEntry] = useState<FarmVocabulary>()
  useEffect(() => {
    let active = true
    setEntry(undefined)
    void getFarmMaterials()
      .then((data) => {
        if (active) setEntry(data.vocabulary.find((item) => item.name.toLowerCase() === word.toLowerCase()))
      })
      .catch(() => {
        /* Keep the existing word usable if optional farm notes cannot load. */
      })
    return () => {
      active = false
    }
  }, [word])
  if (!entry) return null
  return (
    <details className="my-3 rounded-lg border border-gray-100 p-3 text-sm dark:border-gray-700">
      <summary className="cursor-pointer text-indigo-500">农场资料笔记 · {entry.category}</summary>
      <div className="mt-3 space-y-3">
        {entry.partOfSpeech && <p>原资料词性：{entry.partOfSpeech}</p>}
        <p data-lookup-text={entry.example} data-lookup-translation={entry.translation}>
          {entry.example}
        </p>
        <p>{entry.translation}</p>
        {entry.memoryHint && <p>记忆提示：{entry.memoryHint}</p>}
        {entry.morphologyNote && <p>原资料构词提示（未按历史词源核实）：{entry.morphologyNote}</p>}
        {entry.pronunciationHint && <p>原资料近似发音提示：{entry.pronunciationHint}（不是标准音标）</p>}
        {entry.spelling && <p>字母拼写：{entry.spelling}</p>}
      </div>
    </details>
  )
}
