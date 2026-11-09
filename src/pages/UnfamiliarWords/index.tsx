import Header from '@/components/Header'
import { downloadAnkiTsv } from '@/features/anki/export'
import { downloadJson, readJsonFile } from '@/features/etymology/packages'
import { importUnfamiliarPackage, saveUnfamiliarWord } from '@/features/unfamiliar-words/repository'
import type { UnfamiliarKind, UnfamiliarWord } from '@/features/unfamiliar-words/types'
import WordUsagePanel from '@/features/word-support/WordUsagePanel'
import { lookupBuiltInWord } from '@/features/word-support/repository'
import { idDictionaryMap } from '@/resources/dictionary'
import { currentChapterAtom, currentDictIdAtom, reviewModeInfoAtom } from '@/store'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const kinds = { unfamiliar: '不熟单词', confusable: '易混词', phrase: '短语' }
function SavedWord({ word }: { word: UnfamiliarWord }) {
  const [note, setNote] = useState(word.note)
  const [kind, setKind] = useState(word.kind)
  const [reading, setReading] = useState(false)
  const [message, setMessage] = useState('')
  return (
    <article aria-label={`${word.name}收藏词条`} className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{word.name}</h2>
        <button
          className="text-sm text-gray-500 underline"
          onClick={() => {
            void db.unfamiliarWords.delete(word.id).catch(() => setMessage('移除失败，请重试'))
          }}
        >
          移出 {word.name}
        </button>
      </div>
      <p>{word.trans.join('；') || '暂未填写释义'}</p>
      <p className="text-xs text-gray-500">
        来源：{word.sourceDicts.map((id) => idDictionaryMap[id]?.name ?? (id === 'manual' ? '手动添加' : id)).join('、') || '导入词条'}
      </p>
      <label className="block text-sm">
        分类{' '}
        <select
          aria-label={`${word.name}分类`}
          value={kind}
          className="rounded border bg-white p-1 dark:bg-gray-700"
          onChange={(e) => setKind(e.target.value as UnfamiliarKind)}
        >
          {Object.entries(kinds).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        易混词、近义词或学习备注
        <textarea
          aria-label={`${word.name}备注`}
          value={note}
          maxLength={2000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="例如：affect / effect 的区别；容易忘记的用法"
          className="mt-2 block w-full rounded border p-2 dark:bg-gray-700"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          className="my-btn-primary"
          onClick={() => {
            void db.unfamiliarWords
              .update(word.id, { kind, note, updatedAt: Date.now() })
              .then(() => setMessage('备注已保存'))
              .catch(() => setMessage('保存失败，请重试'))
          }}
        >
          保存 {word.name} 备注
        </button>
        <button className="text-sm text-indigo-500 underline" onClick={() => setReading(!reading)}>
          {reading ? '收起' : '查看'} {word.name} 短语和例句
        </button>
        <span role="status" className="text-sm">
          {message}
        </span>
      </div>
      {reading && <WordUsagePanel word={word.name} />}
    </article>
  )
}

export default function UnfamiliarWords() {
  const words = useLiveQuery(() => db.unfamiliarWords.orderBy('addedAt').toArray())
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [name, setName] = useState('')
  const [meaning, setMeaning] = useState('')
  const [kind, setKind] = useState<UnfamiliarKind>('unfamiliar')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [chapter, chooseChapter] = useState(0)
  const [limit, setLimit] = useState(20)
  const setId = useSetAtom(currentDictIdAtom)
  const setChapter = useSetAtom(currentChapterAtom)
  const setReview = useSetAtom(reviewModeInfoAtom)
  const navigate = useNavigate()
  const count = words?.length ?? 0
  const chapterCount = Math.ceil(count / 20)
  const matches = (words ?? []).filter(
    (word) =>
      (filter === 'all' || word.kind === filter) &&
      `${word.name} ${word.trans.join(' ')} ${word.note}`.toLowerCase().includes(query.toLowerCase()),
  )
  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    try {
      setMessage(await action())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link className="text-sm text-indigo-500" to="/">
          返回练习
        </Link>
        <Link className="text-sm text-indigo-500" to="/error-book">
          错题本
        </Link>
      </Header>
      <div className="mx-auto max-w-4xl space-y-5 px-6">
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h1 className="text-2xl font-bold">不熟词本</h1>
          <p>主动收藏不熟单词、易混词和短语，记下自己的理解，再集中练习。</p>
          <p className="text-sm text-gray-500">
            共 {count} 词 · {chapterCount} 章。收藏和备注保存在本机；移出词条会保留已有练习历史。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label>
              章节{' '}
              <select
                aria-label="不熟词本章节"
                className="rounded border bg-white p-1 dark:bg-gray-700"
                disabled={!count}
                value={Math.min(chapter, Math.max(0, chapterCount - 1))}
                onChange={(e) => chooseChapter(Number(e.target.value))}
              >
                {Array.from({ length: chapterCount }, (_, index) => (
                  <option key={index} value={index}>
                    第 {index + 1} 章
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={!count}
              className="my-btn-primary disabled:opacity-40"
              onClick={() => {
                setId('unfamiliar')
                setChapter(Math.min(chapter, chapterCount - 1))
                setReview((old) => ({ ...old, isReviewMode: false }))
                navigate('/')
              }}
            >
              练习不熟词本
            </button>
            <button
              disabled={!count}
              className="text-sm text-indigo-500 underline"
              onClick={() => downloadJson('unfamiliar-words.json', { format: 'qwerty-unfamiliar-words', version: 1, words })}
            >
              导出不熟词本
            </button>
            <button
              disabled={!count || busy}
              className="text-sm text-indigo-500 underline"
              onClick={() =>
                void run(async () => {
                  await downloadAnkiTsv(words ?? [], 'unfamiliar')
                  return '已导出 Anki TSV：Front/Back/Tags 三列，使用基础卡片导入'
                })
              }
            >
              导出 Anki TSV
            </button>
            <label className="cursor-pointer text-sm text-indigo-500 underline">
              导入不熟词本
              <input
                aria-label="导入不熟词本"
                type="file"
                accept=".json,application/json"
                className="hidden"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void run(async () => `已合并导入 ${await importUnfamiliarPackage(await readJsonFile(file))} 个词条`)
                }}
              />
            </label>
          </div>
        </section>
        <details className="rounded-xl bg-white p-5 dark:bg-gray-800">
          <summary className="cursor-pointer font-semibold">添加不熟单词、易混词或短语</summary>
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void run(async () => {
                const original = await lookupBuiltInWord(name).catch(() => undefined)
                await saveUnfamiliarWord(
                  {
                    name,
                    trans: meaning.trim() ? [meaning.trim()] : original?.trans ?? [],
                    usphone: original?.usphone ?? '',
                    ukphone: original?.ukphone ?? '',
                  },
                  'manual',
                  { kind, note },
                )
                setName('')
                setMeaning('')
                setNote('')
                return '已收藏到不熟词本'
              })
            }}
          >
            <label className="block">
              英语单词或短语
              <input
                required
                aria-label="不熟单词或短语"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded border p-2 dark:bg-gray-700"
              />
            </label>
            <label className="block">
              中文释义（选填，留空时查原词库）
              <input
                aria-label="不熟词中文释义"
                maxLength={5000}
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="mt-1 block w-full rounded border p-2 dark:bg-gray-700"
              />
            </label>
            <label>
              分类{' '}
              <select
                aria-label="新词分类"
                value={kind}
                onChange={(e) => setKind(e.target.value as UnfamiliarKind)}
                className="rounded border bg-white p-1 dark:bg-gray-700"
              >
                {Object.entries(kinds).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              易混或近义词备注
              <textarea
                aria-label="新词备注"
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                className="mt-1 block w-full rounded border p-2 dark:bg-gray-700"
              />
            </label>
            <button disabled={busy} className="my-btn-primary" type="submit">
              添加到不熟词本
            </button>
          </form>
        </details>
        <p role="status">{message}</p>
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="搜索不熟词本"
            placeholder="搜索单词、释义或备注"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(20)
            }}
            className="flex-1 rounded border p-2 dark:bg-gray-700"
          />
          <select
            aria-label="筛选收藏分类"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setLimit(20)
            }}
            className="rounded border bg-white p-2 dark:bg-gray-700"
          >
            <option value="all">全部分类</option>
            {Object.entries(kinds).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {!words ? (
          <p>读取本地收藏…</p>
        ) : !count ? (
          <p>还没有收藏。练习时点击“收藏到不熟词本”，也可以在上面手动添加。</p>
        ) : !matches.length ? (
          <p>没有匹配的词条。</p>
        ) : (
          matches.slice(0, limit).map((word) => <SavedWord key={word.id} word={word} />)
        )}
        {matches.length > limit && (
          <button className="my-btn-primary" onClick={() => setLimit(limit + 20)}>
            显示更多词条
          </button>
        )}
      </div>
    </main>
  )
}
