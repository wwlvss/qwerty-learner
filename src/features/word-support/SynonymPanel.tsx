import { getSynonymGroups } from './repository'
import type { SynonymGroup } from './repository'
import SaveUnfamiliarButton from '@/features/unfamiliar-words/SaveUnfamiliarButton'
import { useEffect, useState } from 'react'

export default function SynonymPanel({ word }: { word: string }) {
  const [groups, setGroups] = useState<SynonymGroup[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setGroups([])
    setLoading(true)
    void getSynonymGroups(word)
      .then((value) => {
        if (active) setGroups(value)
      })
      .catch(() => {
        /* Keep an honest empty state. */
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [word])
  return (
    <section data-testid="word-synonyms" className="my-4 space-y-3 border-t border-gray-100 pt-4 text-sm dark:border-gray-700">
      <h3 className="font-semibold">近义词与近义表达</h3>
      {loading ? (
        <p className="text-gray-500">读取本地近义表达…</p>
      ) : !groups.length ? (
        <p className="text-gray-500">当前词暂未收录近义辨析，可在不熟词本中记录待核对的易混词。</p>
      ) : (
        groups.map((group, index) => (
          <div key={index} className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
            <p className="text-xs text-indigo-500">语境：{group.context}</p>
            <ul className="space-y-2">
              {group.terms
                .filter((term) => term.word.toLowerCase() !== word.toLowerCase())
                .map((term) => (
                  <li key={term.word}>
                    <strong data-lookup-text={term.word} data-lookup-translation={term.meaning}>
                      {term.word}
                    </strong>{' '}
                    · {term.meaning}
                    <SaveUnfamiliarButton compact word={{ name: term.word, trans: [term.meaning], usphone: '', ukphone: '' }} />
                  </li>
                ))}
            </ul>
            <p>{group.distinction}</p>
          </div>
        ))
      )}
      <p className="text-xs text-gray-400">原创教学辨析 · 同义或近义须结合语境，不代表总能替换</p>
    </section>
  )
}
