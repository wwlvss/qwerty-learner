import { getDictionaryMeanings } from './repository'
import type { DictionaryMeaning } from './repository'
import { idDictionaryMap } from '@/resources/dictionary'
import type { Word } from '@/typings'
import { useEffect, useState } from 'react'

export default function WordDefinitionsPanel({ word }: { word: Word }) {
  const [entries, setEntries] = useState<DictionaryMeaning[]>([])
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    setEntries([])
    setFailed(false)
    void getDictionaryMeanings(word.name)
      .then((value) => {
        if (active) setEntries(value)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [word.name])
  const rows = entries.map((entry) => ({ ...entry, text: entry.text.trim() }))
  for (const meaning of word.trans)
    if (!rows.some((row) => row.text === meaning.trim())) rows.unshift({ text: meaning.trim(), sources: [] })
  const render = (entry: DictionaryMeaning, index: number) => (
    <li key={`${entry.text}-${index}`} className="space-y-1 border-b border-gray-100 py-2 last:border-0 dark:border-gray-700">
      <p>{entry.text}</p>
      {entry.sources.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">
            来源：{idDictionaryMap[entry.sources[0]]?.name ?? entry.sources[0]}
            {entry.sources.length > 1 ? ` 等 ${entry.sources.length} 个词库` : ''}
          </summary>
          <p>{entry.sources.map((source) => idDictionaryMap[source]?.name ?? source).join('、')}</p>
          <p>沿用原词库释义及资料说明。</p>
        </details>
      )}
    </li>
  )
  return (
    <section data-testid="word-definitions" className="min-w-0 space-y-3 text-sm text-gray-700 dark:text-gray-200">
      <h3 className="font-semibold">词典释义</h3>
      {word.contextTrans?.length ? (
        <div className="rounded-lg bg-indigo-50 p-3 dark:bg-indigo-950">
          <p className="mb-1 text-xs text-indigo-500">当前场景重点</p>
          <p>{word.contextTrans.join('；')}</p>
        </div>
      ) : null}
      <p className="text-xs text-gray-500">其他意思按原词库保留，可展开查看全部释义和来源。</p>
      <ul>{rows.slice(0, 4).map(render)}</ul>
      {rows.length > 4 && (
        <details>
          <summary className="cursor-pointer text-indigo-500">查看其余 {rows.length - 4} 条释义</summary>
          <ul>{rows.slice(4).map(render)}</ul>
        </details>
      )}
      {failed && <p className="text-xs text-gray-500">补充释义暂时无法读取，已保留当前词条中的释义。</p>}
    </section>
  )
}
