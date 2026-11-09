import { saveUnfamiliarWord } from './repository'
import { normalizeWord } from '@/features/etymology/types'
import { currentDictIdAtom } from '@/store'
import type { Word } from '@/typings'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

export default function SaveUnfamiliarButton({ word, compact = false }: { word: Word; compact?: boolean }) {
  const dict = useAtomValue(currentDictIdAtom)
  const saved = useLiveQuery(() => db.unfamiliarWords.get(normalizeWord(word.name)), [word.name])
  const savedHere = Boolean(saved && (dict === 'unfamiliar' || saved.sourceDicts.includes(dict)))
  const [error, setError] = useState('')
  return (
    <span className="inline-flex flex-col items-start gap-1 text-xs">
      <button
        type="button"
        className={`rounded border border-indigo-200 px-2 py-1 text-indigo-500 hover:bg-indigo-50 dark:border-gray-600 dark:hover:bg-gray-700 ${
          compact ? 'ml-2' : ''
        }`}
        aria-label={`${savedHere ? '已收藏' : '收藏'} ${word.name} 到不熟词本`}
        disabled={savedHere}
        onClick={() => {
          void saveUnfamiliarWord(word, dict)
            .then(() => setError(''))
            .catch(() => setError('保存失败，请重试'))
        }}
      >
        {savedHere ? '★ 已在不熟词本' : saved ? '☆ 收藏并记录此词库来源' : '☆ 收藏到不熟词本'}
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  )
}
