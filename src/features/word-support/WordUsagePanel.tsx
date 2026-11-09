import { getWordUsage } from './repository'
import type { UsageExample, UsagePhrase, UsageSource, WordUsage } from './types'
import { learningPreferencesAtom } from '@/features/learning-preferences/store'
import SaveUnfamiliarButton from '@/features/unfamiliar-words/SaveUnfamiliarButton'
import { currentDictIdAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

function SourceLabel({ source }: { source: UsageSource }) {
  const prefix = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''
  return (
    <details className="mt-1 text-xs text-gray-500">
      <summary className="cursor-pointer">
        {source.kind === 'user'
          ? '用户学习资料'
          : source.kind === 'original'
          ? '原创教学示例'
          : source.kind === 'builtin'
          ? '原词库资料'
          : 'Tatoeba 语料'}{' '}
        · 来源
      </summary>
      <a
        className="text-indigo-500 underline"
        href={source.url.startsWith('/') ? prefix + source.url : source.url}
        target="_blank"
        rel="noreferrer"
      >
        {source.name}
      </a>
      <p>{source.license}</p>
    </details>
  )
}
export default function WordUsagePanel({ word }: { word: string }) {
  const prefs = useAtomValue(learningPreferencesAtom)
  const dictId = useAtomValue(currentDictIdAtom)
  const [data, setData] = useState<WordUsage>()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setLoading(true)
    setData(undefined)
    void getWordUsage(word)
      .then((value) => {
        if (active) setData(value)
      })
      .catch(() => {
        /* Show an honest empty state. */
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [word])
  const prioritize = <T extends UsagePhrase | UsageExample>(items: T[]) => {
    const seen = new Set<string>()
    return [...items]
      .sort((a, b) => Number(b.context === dictId) - Number(a.context === dictId))
      .filter((item) => {
        const key = item.text.trim().toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
  }
  const phrases = prioritize(data?.phrases ?? [])
  const examples = prioritize(data?.examples ?? [])
  return (
    <div
      className="mb-4 space-y-3 border-b border-gray-100 pb-4 text-gray-700 dark:border-gray-700 dark:text-gray-200"
      data-testid="word-usage"
    >
      {prefs.showPhrases && (
        <section>
          <h3 className="font-semibold">常用搭配与相关短语</h3>
          {loading ? (
            <p className="text-sm text-gray-500">读取本地短语…</p>
          ) : data?.phrases.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {phrases.slice(0, 3).map((phrase, index) => (
                <li key={`${phrase.text}-${index}`}>
                  <strong data-lookup-text={phrase.text} data-lookup-translation={phrase.translation}>
                    {phrase.text}
                  </strong>{' '}
                  · {phrase.translation}
                  <SaveUnfamiliarButton compact word={{ name: phrase.text, trans: [phrase.translation], usphone: '', ukphone: '' }} />
                  <SourceLabel source={phrase.source} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">这个词暂未收录可靠的短语，可通过用法数据包补充。</p>
          )}
        </section>
      )}
      {prefs.showExamples && (
        <section>
          <h3 className="font-semibold">例句</h3>
          {loading ? (
            <p className="text-sm text-gray-500">读取本地例句…</p>
          ) : data?.examples.length ? (
            <ul className="mt-2 space-y-3 text-sm">
              {examples.slice(0, 2).map((example, index) => (
                <li key={index}>
                  <p>
                    {example.text.slice(0, example.targetStart)}
                    <mark className="rounded bg-indigo-100 px-0.5 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100">
                      {example.text.slice(example.targetStart, example.targetEnd)}
                    </mark>
                    {example.text.slice(example.targetEnd)}
                  </p>
                  {example.translation && <p className="mt-1 text-gray-500">{example.translation}</p>}
                  <SourceLabel source={example.source} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">这个词暂未收录例句，未自动生成或冒充语料原句。</p>
          )}
        </section>
      )}
    </div>
  )
}
