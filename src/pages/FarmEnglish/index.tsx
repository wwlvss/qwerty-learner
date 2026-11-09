import Header from '@/components/Header'
import type { FarmMaterials } from '@/features/farm-english/types'
import SelectionLookup from '@/features/selection-lookup/SelectionLookup'
import SaveUnfamiliarButton from '@/features/unfamiliar-words/SaveUnfamiliarButton'
import { getFarmMaterials } from '@/features/word-support/repository'
import { currentChapterAtom, currentDictIdAtom, reviewModeInfoAtom } from '@/store'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function FarmEnglish() {
  const [data, setData] = useState<FarmMaterials>()
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('words')
  const [limit, setLimit] = useState(20)
  const [chapter, chooseChapter] = useState(0)
  const setId = useSetAtom(currentDictIdAtom)
  const setChapter = useSetAtom(currentChapterAtom)
  const setReview = useSetAtom(reviewModeInfoAtom)
  const navigate = useNavigate()
  useEffect(() => {
    void getFarmMaterials()
      .then(setData)
      .catch(() => setError('农场资料读取失败，请刷新重试'))
  }, [])
  const search = query.trim().toLowerCase()
  const words =
    data?.vocabulary.filter((word) =>
      `${word.name} ${word.meaning} ${word.category} ${word.memoryHint ?? ''}`.toLowerCase().includes(search),
    ) ?? []
  const sentences =
    data?.sentences.filter((sentence) =>
      `${sentence.text} ${sentence.translation} ${sentence.category} ${sentence.scenario}`.toLowerCase().includes(search),
    ) ?? []
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link to="/my-dictionary" className="text-sm text-indigo-500">
          返回我的词典
        </Link>
      </Header>
      <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6">
        <h1 className="text-2xl font-bold">农场英语</h1>
        {error && <p role="alert">{error}</p>}
        {!data && !error ? (
          <p>读取农场学习资料…</p>
        ) : (
          data && (
            <>
              <section className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800">
                <h2 className="font-semibold">{data.profile.farmLabel} · 生产主管学习场景</h2>
                <p>
                  {data.profile.region} · {data.profile.roleEnglish}
                </p>
                <p>用户提供的品种代号：{data.profile.varietyCodes.join('、')}</p>
                <p>
                  {data.sourceVocabularyCount} 个原词条 + {data.extensionVocabularyCount} 个补充词条 = {data.vocabulary.length} 词 ·{' '}
                  {data.sourceSentenceCount} 句沟通表达
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label>
                    章节{' '}
                    <select
                      aria-label="农场资料练习章节"
                      value={chapter}
                      onChange={(event) => chooseChapter(Number(event.target.value))}
                      className="rounded border bg-white p-1 dark:bg-gray-700"
                    >
                      {Array.from({ length: Math.ceil(data.vocabulary.length / 20) }, (_, index) => (
                        <option value={index} key={index}>
                          第 {index + 1} 章
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="my-btn-primary"
                    onClick={() => {
                      setId('farm-english')
                      setChapter(chapter)
                      setReview((old) => ({ ...old, isReviewMode: false }))
                      navigate('/')
                    }}
                  >
                    练习农场英语
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  句子中的产量、日期和人数是教学示例。构词记忆提示未按可靠历史词源核实。可选中英文查询本地释义并收藏。
                </p>
              </section>
              <input
                aria-label="搜索农场资料"
                placeholder="搜索工时、灌溉、蓝莓 QA、英文词或场景"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setLimit(20)
                }}
                className="w-full rounded-lg border p-3 dark:bg-gray-800"
              />
              <div className="flex flex-wrap gap-3" role="group" aria-label="农场资料分类">
                {[
                  ['words', '词汇与例句'],
                  ['sentences', '沟通句库'],
                  ['roots', '构词与使用说明'],
                ].map(([id, name]) => (
                  <button
                    key={id}
                    aria-pressed={tab === id}
                    className={tab === id ? 'my-btn-primary' : 'rounded border px-3 py-2 text-sm'}
                    onClick={() => {
                      setTab(id)
                      setLimit(20)
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <SelectionLookup dictionaryId="farm-english">
                {tab === 'words' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">匹配 {words.length} 个词条</p>
                    {words.slice(0, limit).map((word) => (
                      <article
                        aria-label={`${word.name}农场词条`}
                        key={word.name}
                        className="space-y-3 rounded-xl bg-white p-5 dark:bg-gray-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h2 data-lookup-text={word.name} data-lookup-translation={word.meaning} className="text-xl font-semibold">
                            {word.name}
                          </h2>
                          <SaveUnfamiliarButton
                            dictionaryId="farm-english"
                            word={{ name: word.name, trans: [word.meaning], usphone: '', ukphone: '' }}
                          />
                        </div>
                        <p>{word.meaning}</p>
                        <p className="text-xs text-gray-500">
                          {word.category} · {word.sourceKind === 'user' ? `原资料：${word.sheet}` : '原创补充教学材料'}
                        </p>
                        <p data-lookup-text={word.example} data-lookup-translation={word.translation}>
                          {word.example}
                        </p>
                        <p>{word.translation}</p>
                        {word.memoryHint && <p className="text-sm text-gray-500">记忆提示：{word.memoryHint}</p>}
                        {(word.morphologyNote || word.pronunciationHint) && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-indigo-500">原资料构词与发音提示（未核实词源）</summary>
                            <p>{word.morphologyNote}</p>
                            <p>近似发音提示：{word.pronunciationHint || '未提供'}；不替代标准音标。</p>
                            <p>{word.spelling}</p>
                          </details>
                        )}
                      </article>
                    ))}
                  </div>
                )}
                {tab === 'sentences' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">匹配 {sentences.length} 句 · 只作语言学习，不代表公司政策或实际生产数据</p>
                    {sentences.slice(0, limit).map((sentence, index) => (
                      <article key={index} className="space-y-2 rounded-xl bg-white p-5 dark:bg-gray-800">
                        <p className="text-xs text-indigo-500">
                          {sentence.category} · {sentence.scenario}
                        </p>
                        <p data-lookup-text={sentence.text} data-lookup-translation={sentence.translation}>
                          {sentence.text}
                        </p>
                        <p>{sentence.translation}</p>
                        <p className="text-xs text-gray-500">结构提示：{sentence.grammar}</p>
                      </article>
                    ))}
                  </div>
                )}
                {tab === 'roots' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">以下是上传资料中的记忆笔记，不是已核实的历史词源数据库。</p>
                    {data.morphologyGuide.map((guide, index) => (
                      <article key={index} className="space-y-2 rounded-xl bg-white p-5 dark:bg-gray-800">
                        <h2 className="font-semibold">
                          {guide.form} · {guide.meaning}
                        </h2>
                        <p>{guide.examples}</p>
                        <p>{guide.note}</p>
                      </article>
                    ))}
                    <section className="space-y-2 rounded-xl bg-white p-5 dark:bg-gray-800">
                      <h2 className="font-semibold">原资料使用说明</h2>
                      {data.guidance.map((item) => (
                        <p key={item.title}>
                          {item.title}：{item.text}
                        </p>
                      ))}
                    </section>
                  </div>
                )}
              </SelectionLookup>
              {((tab === 'words' && words.length > limit) || (tab === 'sentences' && sentences.length > limit)) && (
                <button className="my-btn-primary" onClick={() => setLimit(limit + 20)}>
                  显示更多农场资料
                </button>
              )}
            </>
          )
        )}
      </div>
    </main>
  )
}
