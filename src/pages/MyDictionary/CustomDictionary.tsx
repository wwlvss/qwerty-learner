import Header from '@/components/Header'
import { downloadJson, readJsonFile } from '@/features/etymology/packages'
import { PERSONAL_DICT_ID } from '@/features/personal-dictionary/constants'
import { addPersonalWords, parseWordText } from '@/features/personal-dictionary/repository'
import { importUsagePackage } from '@/features/word-support/packages'
import { getSupportManifest } from '@/features/word-support/repository'
import type { SupportManifest } from '@/features/word-support/types'
import { dictionaries } from '@/resources/dictionary'
import { currentChapterAtom, currentDictIdAtom, reviewModeInfoAtom } from '@/store'
import { db } from '@/utils/db'
import { normalizeTranslations } from '@/utils/wordData'
import { wordListFetcher } from '@/utils/wordListFetcher'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function MyDictionary() {
  const words = useLiveQuery(() => db.personalWords.orderBy('position').toArray())
  const [name, setName] = useState('')
  const [translation, setTranslation] = useState('')
  const [bulk, setBulk] = useState('')
  const [query, setQuery] = useState('')
  const [sourceId, setSourceId] = useState('cet4')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [manifest, setManifest] = useState<SupportManifest>()
  const setDict = useSetAtom(currentDictIdAtom)
  const setChapter = useSetAtom(currentChapterAtom)
  const setReview = useSetAtom(reviewModeInfoAtom)
  const navigate = useNavigate()
  useEffect(() => {
    void getSupportManifest()
      .then(setManifest)
      .catch(() => {
        /* Local personal words remain usable. */
      })
  }, [])
  async function run(operation: () => Promise<unknown>, success: string) {
    setBusy(true)
    setNotice('')
    try {
      await operation()
      setNotice(success)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }
  const shown = words?.filter((w) => `${w.name} ${w.trans.join(' ')}`.toLowerCase().includes(query.toLowerCase())) ?? []
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link className="text-sm text-indigo-500" to="/">
          返回练习
        </Link>
        <Link className="text-sm text-indigo-500" to="/gallery">
          全部词典
        </Link>
      </Header>
      <div className="mx-auto max-w-5xl space-y-5 px-6">
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h1 className="text-2xl font-bold">自定义词典</h1>
          <p>
            独立于 CET-4 / CET-6 的本地词典 · {words?.length ?? 0} 词 · {Math.ceil((words?.length ?? 0) / 20)} 章
          </p>
          <p className="text-sm text-gray-500">
            按添加顺序每 20 词一章。单词、释义与音标保存在此浏览器；学习记录与原词库分开。每次答对仍自动显示资料并等待下一词。
          </p>
          <button
            className="my-btn-primary disabled:opacity-40"
            disabled={!words?.length || busy}
            onClick={() => {
              setDict(PERSONAL_DICT_ID)
              setChapter(0)
              setReview((old) => ({ ...old, isReviewMode: false }))
              navigate('/')
            }}
          >
            练习自定义词典
          </button>
        </section>
        {notice && (
          <p role="status" className="rounded border border-indigo-200 p-3 text-sm">
            {notice}
          </p>
        )}
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h2 className="font-semibold">添加单词或短语</h2>
          <form
            className="flex flex-wrap gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void run(async () => {
                await addPersonalWords([{ name, trans: translation.trim() ? [translation.trim()] : [], usphone: '', ukphone: '' }], true)
                setName('')
                setTranslation('')
              }, '已保存到自定义词典')
            }}
          >
            <input
              className="rounded border bg-white dark:bg-gray-700"
              aria-label="英语单词或短语"
              placeholder="例如 maintain 或 take care of"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
            />
            <input
              className="flex-1 rounded border bg-white dark:bg-gray-700"
              aria-label="中文释义"
              placeholder="中文释义（可选，优先复用已有词库）"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              maxLength={2000}
            />
            <button className="my-btn-primary" disabled={busy}>
              添加到自定义词典
            </button>
          </form>
          <p className="text-xs text-gray-500">同一词形再次添加会更新释义并保留原位置；未知词可自行填写。不会替换原有 CET 词库。</p>
          <details>
            <summary className="cursor-pointer text-sm text-indigo-500">批量添加和导入</summary>
            <div className="mt-3 space-y-3">
              <textarea
                aria-label="批量单词"
                className="h-32 w-full rounded border bg-white dark:bg-gray-700"
                placeholder="每行一个单词；可用 Tab 分隔中文释义"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
              />
              <button
                className="my-btn-primary"
                disabled={busy || !bulk.trim()}
                onClick={() => {
                  void run(async () => {
                    await addPersonalWords(parseWordText(bulk))
                    setBulk('')
                  }, '批量单词已保存')
                }}
              >
                保存批量单词
              </button>
              <div className="flex flex-wrap gap-3">
                <select
                  className="rounded border bg-white dark:bg-gray-700"
                  aria-label="复制来源词典"
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                >
                  {dictionaries
                    .filter((d) => d.language === 'en' && d.id !== PERSONAL_DICT_ID)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
                <button
                  className="my-btn-primary"
                  disabled={busy}
                  onClick={() => {
                    void run(async () => {
                      const dict = dictionaries.find((d) => d.id === sourceId)
                      if (!dict) throw new Error('来源词典不存在')
                      const data = await wordListFetcher(dict.url)
                      await addPersonalWords(
                        data.map((w) => ({
                          ...w,
                          trans: normalizeTranslations(w.trans),
                          usphone: typeof w.usphone === 'string' ? w.usphone : '',
                          ukphone: typeof w.ukphone === 'string' ? w.ukphone : '',
                        })),
                      )
                    }, '来源词典已复制到自定义词典（去重并保留原有单词）')
                  }}
                >
                  复制此词典到自定义词典
                </button>
              </div>
            </div>
          </details>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              className="my-btn-primary"
              disabled={busy}
              onClick={() =>
                downloadJson('my-dictionary.json', {
                  format: 'qwerty-personal-dictionary',
                  version: 1,
                  words: words?.map(({ name, trans, usphone, ukphone }) => ({ name, trans, usphone, ukphone })) ?? [],
                })
              }
            >
              导出自定义词典
            </button>
            <label className="my-btn-primary cursor-pointer">
              导入自定义词典
              <input
                className="sr-only"
                type="file"
                accept=".json,.txt,application/json,text/plain"
                aria-label="导入自定义词典"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  void run(async () => {
                    if (file.size > 10 * 1024 * 1024) throw new Error('文件超过 10 MB')
                    if (file.name.endsWith('.txt')) return addPersonalWords(parseWordText(await file.text()))
                    const value = await readJsonFile(file, 10)
                    if (Array.isArray(value)) return addPersonalWords(value)
                    const pack = value as { format?: string; version?: number; words?: unknown }
                    if (pack?.format !== 'qwerty-personal-dictionary' || pack.version !== 1) throw new Error('个人词典格式或版本无效')
                    return addPersonalWords(pack.words)
                  }, '自定义词典已合并导入；原学习记录未改动')
                }}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">
            词典导出包含词条，不含学习历史。完整历史请在设置中导出数据库；新增的个人词典表和用法资料表也会包含在完整备份中。
          </p>
        </section>
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h2 className="font-semibold">自定义词典词条</h2>
          <input
            className="w-full rounded border bg-white dark:bg-gray-700"
            aria-label="搜索自定义词典"
            placeholder="搜索单词或释义"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {!shown.length && <p className="text-sm text-gray-500">暂无词条，先添加或导入，再开始练习。</p>}
          <ul className="max-h-96 divide-y overflow-y-auto">
            {shown.map((word) => (
              <li key={word.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <strong>{word.name}</strong>
                  <p className="text-sm text-gray-500">{word.trans.join('；') || '未填写释义'}</p>
                </div>
                <button
                  disabled={busy}
                  className="text-sm text-red-500"
                  aria-label={`移除 ${word.name}`}
                  onClick={() => {
                    void run(() => db.personalWords.delete(word.id), '词条已移除；已有学习记录仍保留')
                  }}
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h2 className="font-semibold">全部英语词典的资料覆盖</h2>
          <p className="text-sm">所有英语词条共用同一个短语、例句和词源查询入口；有资料就显示，没有资料就明确提示。个人新词也适用。</p>
          {manifest && (
            <p className="text-sm">
              已索引 {manifest.availableDictionaries} 个英语词库、{manifest.uniqueEntries} 个不同词条；其中 {manifest.phraseEntries}{' '}
              词有相关短语，{manifest.exampleEntries} 词有原创教学例句，{manifest.etymologyEntries} 词有已核实词源。
            </p>
          )}
          <p className="text-xs text-gray-500">
            短语来自现有词库或原创教学整理，不等于语料频次排名。例句与历史词源分开保存，未把缺失资料批量编造成事实。
          </p>
          <label className="my-btn-primary inline-block cursor-pointer text-sm">
            导入短语与例句数据包
            <input
              type="file"
              className="sr-only"
              accept=".json,application/json"
              aria-label="导入短语与例句数据包"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void run(async () => importUsagePackage(await readJsonFile(file, 50)), '短语与例句数据包已保存在本地')
              }}
            />
          </label>
        </section>
      </div>
    </main>
  )
}
