import { recordEntryView } from './repository'
import type { EtymologyEntry, Source } from './types'
import { relationLabels } from './types'
import { currentDictInfoAtom } from '@/store'
import type { Word } from '@/typings'
import { db } from '@/utils/db'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAtomValue } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'

export function Sources({ sources }: { sources: Source[] }) {
  return (
    <details className="mt-3 text-xs text-gray-500 dark:text-gray-400">
      <summary className="cursor-pointer">资料来源、证据与许可</summary>
      {sources.map((source, i) => (
        <div key={`${source.url}-${i}`} className="mt-2 space-y-1 break-words">
          <a className="text-indigo-500 underline" href={source.url} target="_blank" rel="noreferrer">
            {source.name} · {source.originalEntry}
          </a>
          <p>
            {source.license} · {source.verificationStatus === 'verified' ? '资料已核实' : '待核实'}
          </p>
          <blockquote className="border-l-2 pl-2">{source.evidence}</blockquote>
        </div>
      ))}
    </details>
  )
}

export default function EtymologyCard({
  entry,
  word,
  onWord,
  onNavigate,
  fromCorrect = false,
  openRootsInNewTab = false,
  compact = false,
}: {
  entry: EtymologyEntry
  word?: Word
  onWord: (word: string) => void
  onNavigate?: () => void
  fromCorrect?: boolean
  openRootsInNewTab?: boolean
  compact?: boolean
}) {
  const dict = useAtomValue(currentDictInfoAtom)
  const { data: words } = useSWR(word ? null : dict.url, wordListFetcher)
  const baseWord = word ?? words?.find((w) => w.name.toLowerCase() === entry.normalizedWord)
  const related = useLiveQuery(async () => {
    const own = await db.rootWordRelations.where('normalizedWord').equals(entry.normalizedWord).toArray()
    const rootIds = Array.from(new Set(own.filter((r) => r.relationType !== 'related_meaning').map((r) => r.rootId)))
    const roots = await db.roots.bulkGet(rootIds)
    const relations = (await Promise.all(rootIds.map((id) => db.rootWordRelations.where('rootId').equals(id).toArray()))).flat()
    return { roots: roots.filter((r) => r !== undefined), relations: relations.filter((r) => r.normalizedWord !== entry.normalizedWord) }
  }, [entry.id])
  const viewed = useRef('')
  const [storageError, setStorageError] = useState('')
  useEffect(() => {
    if (viewed.current === entry.id) return
    viewed.current = entry.id
    void recordEntryView(entry, fromCorrect).catch(() => setStorageError('查看记录保存失败；仍可阅读和继续练习。'))
  }, [entry, fromCorrect])
  const partLabels = { prefix: '前缀', root: '词根', suffix: '后缀', stem: '词干', inflection: '屈折变化' }
  const parts = []
  let cursor = 0
  for (const part of entry.morphologicalAnalysis) {
    if (part.start > cursor) parts.push(<span key={`gap-${cursor}`}>{entry.normalizedWord.slice(cursor, part.start)}</span>)
    parts.push(
      <mark
        key={part.start}
        className="mx-0.5 rounded bg-indigo-100 px-1 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100"
        title={`${partLabels[part.kind]}：${part.meaning}`}
      >
        {part.text}
      </mark>,
    )
    cursor = part.end
  }
  parts.push(<span key="tail">{entry.normalizedWord.slice(cursor)}</span>)
  return (
    <article className="space-y-3 text-left text-gray-700 dark:text-gray-200" data-testid="etymology-card">
      <div>
        <h2 className="text-xl font-bold">{entry.normalizedWord} · 词根词源</h2>
        {!compact && <p className="text-sm">{baseWord?.trans.join('；') || '当前词库未收录释义'}</p>}
        {!compact && baseWord && (
          <p className="text-xs text-gray-500">
            {baseWord.usphone && `美 [${baseWord.usphone}] `}
            {baseWord.ukphone && `英 [${baseWord.ukphone}]`}
          </p>
        )}
        {!compact && <p className="text-xs text-gray-500">英文释义和词性：当前基础词库未提供，暂不推测。</p>}
        <span className="text-xs text-amber-700 dark:text-amber-300">
          {entry.verificationStatus === 'verified' ? '有来源支持' : '待核实 · 不作为确定事实'} · 资料可信度{' '}
          {Math.round(entry.confidence * 100)}%
        </span>
      </div>
      <section>
        <h3 className="font-semibold">构词拆解 Morphology</h3>
        <div className="my-2 font-mono text-2xl">{parts}</div>
        <ul className="space-y-1 text-sm">
          {entry.morphologicalAnalysis.map((part) => (
            <li key={part.start}>
              {part.rootId ? (
                <Link
                  className="text-indigo-500 underline"
                  to={`/roots/${encodeURIComponent(part.rootId)}`}
                  onClick={onNavigate}
                  target={openRootsInNewTab ? '_blank' : undefined}
                  rel="noreferrer"
                >
                  {part.text}
                </Link>
              ) : (
                <strong>{part.text}</strong>
              )}{' '}
              · {partLabels[part.kind]}：{part.meaning}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-gray-500">{entry.morphologyNote}</p>
      </section>
      <section>
        <h3 className="font-semibold">历史词源 Etymology</h3>
        <p className="text-sm">
          {entry.originLanguage} · {entry.originalForm} · {entry.originalMeaning}
        </p>
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer text-indigo-500">展开历史演变</summary>
          <ol className="list-inside list-decimal space-y-1 py-2">
            {entry.historicalEvolution.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p>{entry.etymologyExplanation}</p>
        </details>
      </section>
      <details open={compact ? undefined : true}>
        <summary className="cursor-pointer text-sm text-indigo-500">同源词、词根与关系详情</summary>
        <section>
          <h3 className="font-semibold">词源关系网络</h3>
          {openRootsInNewTab && <p className="text-xs text-gray-500">词根详情在新标签页打开，当前答题保持不变；阅读后返回并继续练习。</p>}
          <div className="flex flex-wrap gap-2">
            {related?.roots.map(
              (root) =>
                root && (
                  <Link
                    key={root.id}
                    onClick={onNavigate}
                    target={openRootsInNewTab ? '_blank' : undefined}
                    rel="noreferrer"
                    to={`/roots/${encodeURIComponent(root.id)}`}
                    className="rounded bg-indigo-50 px-2 py-1 text-sm text-indigo-600 dark:bg-gray-700"
                  >
                    {root.root} · {root.meaning}
                  </Link>
                ),
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">A/B 可有历史交集，这里按主要关系展示；C 类不作为同源证据。</p>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-sm">
            {related?.relations.map((rel) => (
              <li key={rel.id}>
                <button type="button" onClick={() => onWord(rel.normalizedWord)} className="font-semibold text-indigo-500 underline">
                  {rel.normalizedWord}
                </button>
                <span className="ml-2 text-xs">
                  {relationLabels[rel.relationType]} · {rel.verificationStatus === 'verified' ? '已核实' : '待核实'}
                </span>
                <p>{words?.find((w) => w.name.toLowerCase() === rel.normalizedWord)?.trans.join('；') || rel.explanation}</p>
                <p className="text-xs text-gray-500">{rel.explanation}</p>
                <Sources sources={rel.sources} />
              </li>
            ))}
          </ul>
        </section>
      </details>
      <section className="rounded bg-stone-50 p-3 text-sm dark:bg-gray-700">
        <h3 className="font-semibold">辅助记忆（与词源事实分开）</h3>
        <p>{entry.memoryTip}</p>
      </section>
      <Sources sources={entry.sources} />
      {storageError && (
        <p role="alert" className="text-sm text-red-500">
          {storageError}
        </p>
      )}
      <p className="text-xs text-gray-500">阅读仅记录词根学习历史，不代表掌握，也不会更新单词或 FSRS 复习次数。</p>
    </article>
  )
}
