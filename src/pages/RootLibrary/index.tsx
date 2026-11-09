import Header from '@/components/Header'
import { Sources } from '@/features/etymology/EtymologyCard'
import EtymologyDialog from '@/features/etymology/EtymologyDialog'
import EtymologySettings from '@/features/etymology/EtymologySettings'
import { exportEtymologyBackup, restoreEtymologyBackup } from '@/features/etymology/backup'
import { downloadJson, readJsonFile, validatePackage } from '@/features/etymology/packages'
import {
  ensureEtymologyData,
  importEtymologyPackage,
  recordRootView,
  setRootStatus,
  toggleRootFavorite,
} from '@/features/etymology/repository'
import type { RootLearningState } from '@/features/etymology/types'
import { relationLabels } from '@/features/etymology/types'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const labels = { unlearned: '未学习', viewed: '已查看', mastered: '已掌握', review: '待复习', favorite: '已收藏' }
const date = (timestamp: number) => new Date(timestamp).toLocaleString()

export default function RootLibrary() {
  const { rootId } = useParams()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')
  const [filter, setFilter] = useState('all')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const data = useLiveQuery(
    async () => ({
      roots: await db.roots.toArray(),
      favorites: await db.rootFavorites.toArray(),
      states: await db.rootLearningStates.toArray(),
      relations: await db.rootWordRelations.toArray(),
      events: rootId ? await db.rootLearningEvents.where('rootId').equals(rootId).reverse().limit(30).toArray() : [],
    }),
    [rootId],
  )
  const initialize = () => {
    setNotice('')
    void ensureEtymologyData()
      .catch((e: Error) => setNotice(e.message))
      .finally(() => setReady(true))
  }
  useEffect(initialize, [])
  useEffect(() => {
    if (!ready || !rootId) return
    let cancelled = false
    // Cancel the StrictMode probe before it can write a duplicate learning event.
    void db.roots
      .get(rootId)
      .then((root) => {
        if (root && !cancelled) return recordRootView(rootId)
      })
      .catch(() => setNotice('词根查看记录保存失败'))
    return () => {
      cancelled = true
    }
  }, [rootId, ready])
  const selected = data?.roots.find((r) => r.id === rootId)
  const state = data?.states.find((s) => s.rootId === rootId)
  const favorite = data?.favorites.find((f) => f.rootId === rootId)
  const run = async (operation: () => Promise<unknown>, message = '') => {
    setBusy(true)
    setNotice('')
    try {
      await operation()
      if (message) setNotice(message)
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }
  const importFile = async (file: File, backup: boolean) => {
    await run(
      async () => {
        const value = await readJsonFile(file, backup ? 50 : 5)
        if (backup) await restoreEtymologyBackup(value)
        else await importEtymologyPackage(validatePackage(value))
      },
      backup ? '词根备份已恢复；原有单词、章节及复习记录未修改。' : '本地词源数据包已导入。导入的核实标记来自数据包作者，请检查来源证据。',
    )
  }
  const shown = data?.roots.filter((root) => {
    const learning = data.states.find((s) => s.rootId === root.id)
    const relations = data.relations.filter((r) => r.rootId === root.id)
    return (
      `${root.root} ${root.meaning} ${root.originalForm} ${relations.map((r) => r.normalizedWord).join(' ')}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (language === 'all' || root.language === language) &&
      (filter === 'all' ||
        (filter === 'favorite' ? data.favorites.some((f) => f.rootId === root.id) : (learning?.status ?? 'unlearned') === filter))
    )
  })
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link to="/" className="text-sm text-indigo-500">
          返回打字练习
        </Link>
      </Header>
      <div className="mx-auto max-w-5xl space-y-6 px-6">
        <section className="rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800">
          <h1 className="text-2xl font-bold">
            我的词根库 <span className="text-sm font-normal">Root Library</span>
          </h1>
          <p className="my-2 text-sm">
            已查看/学习 {data?.states.length ?? 0} 个 · 已收藏 {data?.favorites.length ?? 0} 个 · 资料共 {data?.roots.length ?? 0} 个词根
          </p>
          <p className="mb-4 text-xs text-gray-500">
            已查看不等于已掌握；收藏、掌握和待复习相互独立。首批为有原文证据的小型示例库，不覆盖所有单词。
          </p>
          <EtymologySettings />
        </section>
        <section className="flex flex-wrap gap-3">
          <input
            aria-label="搜索词根"
            placeholder="搜索词根、含义或关联单词"
            className="min-w-64 flex-1 rounded border bg-white dark:bg-gray-800"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="来源语言"
            className="rounded border bg-white dark:bg-gray-800"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="all">所有语言</option>
            {Array.from(new Set(data?.roots.map((r) => r.language))).map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select
            aria-label="学习状态"
            className="rounded border bg-white dark:bg-gray-800"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">所有学习状态</option>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </section>
        {notice && (
          <p role="status" className="rounded border border-amber-300 p-3 text-sm">
            {notice}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {shown?.map((root) => (
            <section key={root.id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
              <Link to={`/roots/${encodeURIComponent(root.id)}`} className="text-xl font-semibold text-indigo-500">
                {root.root}
              </Link>
              <p>
                {root.meaning} · {root.language}
              </p>
              <p className="my-2 text-xs">
                {labels[data?.states.find((s) => s.rootId === root.id)?.status ?? 'unlearned']} · 关联词{' '}
                {data?.relations.filter((r) => r.rootId === root.id).length} 个 ·{' '}
                {root.verificationStatus === 'verified' ? '有来源支持' : '待核实'}
              </p>
              <button
                className="text-sm text-indigo-500 underline"
                disabled={busy}
                onClick={() => {
                  void run(() => toggleRootFavorite(root.id))
                }}
              >
                {data?.favorites.some((f) => f.rootId === root.id) ? '取消收藏' : '收藏词根'} {root.root}
              </button>
            </section>
          ))}
        </div>
        {data && !shown?.length && <p>没有符合条件的词根。</p>}
        {rootId && !selected && ready && <p role="status">未找到此词根，请检查数据包。</p>}
        {selected && (
          <section className="space-y-4 rounded-xl bg-white p-5 dark:bg-gray-800" aria-label="词根详情">
            <h2 className="text-2xl font-bold">
              {selected.root} · {selected.meaning}
            </h2>
            <p>
              {selected.language} · {selected.originalForm}
            </p>
            <p>{selected.explanation}</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="my-btn-primary"
                disabled={busy}
                onClick={() => {
                  void run(() => toggleRootFavorite(selected.id))
                }}
              >
                {favorite ? '取消收藏' : '收藏词根'}
              </button>
              <label className="text-sm">
                个人掌握状态{' '}
                <select
                  aria-label="个人掌握状态"
                  value={state?.status ?? 'unlearned'}
                  disabled={busy}
                  className="rounded border bg-white dark:bg-gray-700"
                  onChange={(e) => {
                    void run(() => setRootStatus(selected.id, e.target.value as RootLearningState['status']))
                  }}
                >
                  <option value="unlearned" disabled>
                    未学习
                  </option>
                  <option value="viewed">已查看</option>
                  <option value="mastered">已掌握（自行标记）</option>
                  <option value="review">待复习（自行标记）</option>
                </select>
              </label>
            </div>
            <p className="text-sm">
              首次查看：{state ? date(state.firstViewedAt) : '尚未查看'} · 最近查看：{state ? date(state.lastViewedAt) : '—'} · 查看{' '}
              {state?.viewCount ?? 0} 次
            </p>
            {favorite && <p className="text-xs">收藏时间：{date(favorite.createdAt)}</p>}
            <p className="text-sm">通过这些单词学习：{state?.learnedThroughWords.join('、') || '尚无单词来源，直接从词根库查看'}</p>
            <h3 className="font-semibold">关联英语单词</h3>
            <p className="text-xs text-gray-500">A/B 按主要关系分类，C 仅为语义联系，不据此推断同源。</p>
            <ul className="space-y-3">
              {data?.relations
                .filter((rel) => rel.rootId === selected.id)
                .map((rel) => (
                  <li key={rel.id}>
                    <button className="font-semibold text-indigo-500 underline" onClick={() => setParams({ word: rel.normalizedWord })}>
                      {rel.normalizedWord}
                    </button>
                    <span className="ml-3 text-xs">
                      {relationLabels[rel.relationType]} · {rel.verificationStatus === 'verified' ? '已核实' : '待核实'}
                    </span>
                    <p className="text-sm">{rel.explanation}</p>
                  </li>
                ))}
            </ul>
            {selected.relatedRootIds.length > 0 && (
              <p>
                相关词根：
                {selected.relatedRootIds.map((id) => (
                  <Link key={id} className="ml-2 text-indigo-500 underline" to={`/roots/${encodeURIComponent(id)}`}>
                    {data?.roots.find((r) => r.id === id)?.root ?? id}
                  </Link>
                ))}
              </p>
            )}
            <Sources sources={selected.sources} />
            <details>
              <summary className="cursor-pointer text-sm">最近 30 次学习历史</summary>
              <ul className="mt-2 space-y-1 text-xs">
                {data?.events.map((event) => (
                  <li key={event.id}>
                    {date(event.viewedAt)} · {event.word ? `通过 ${event.word}` : '直接查看词根'}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}
        <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h2 className="font-semibold">本地词源数据包与备份</h2>
          <p className="text-sm">
            支持带来源证据的 JSON 数据包（最大 5 MB）。导入更新同 ID
            的资料，保留收藏和历史；不会修改原词库。核实标记由数据包作者提供，不是自动事实核查。
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="my-btn-primary cursor-pointer">
              导入词源数据包
              <input
                aria-label="导入词源数据包"
                type="file"
                accept=".json,application/json"
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void importFile(file, false)
                }}
              />
            </label>
            <button
              className="my-btn-primary"
              disabled={busy}
              onClick={() => {
                void run(async () => downloadJson('qwerty-etymology-backup.json', await exportEtymologyBackup()))
              }}
            >
              导出词根备份
            </button>
            <label className="my-btn-primary cursor-pointer">
              恢复词根备份
              <input
                aria-label="恢复词根备份"
                type="file"
                accept=".json,application/json"
                disabled={busy}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void importFile(file, true)
                }}
              />
            </label>
            <button className="text-indigo-500 underline" disabled={busy} onClick={initialize}>
              重新加载示例资料
            </button>
          </div>
          <p className="text-xs text-gray-500">
            恢复会替换词根收藏、查看历史和显示设置，合并词源资料；不触碰原单词、章节或复习记录。原“设置 →
            数据导出”的完整数据库备份也包含新增表。
          </p>
          <p className="text-xs text-gray-500">导入后资料可离线阅读；本功能不改变整个网站的离线启动能力。资料版权与来源见每张卡片。</p>
        </section>
      </div>
      {params.get('word') && (
        <EtymologyDialog key={params.get('word')} initialWord={params.get('word') ?? ''} onClose={() => setParams({})} />
      )}
    </main>
  )
}
