import Header from '@/components/Header'
import { learningDictionaryPlan } from '@/features/learning-dictionaries/plan'
import { idDictionaryMap } from '@/resources/dictionary'
import { currentChapterAtom, currentDictIdAtom, learningDictionaryChaptersAtom, reviewModeInfoAtom } from '@/store'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Link, useNavigate } from 'react-router-dom'

export default function LearningDictionaries() {
  const [chapters, setChapters] = useAtom(learningDictionaryChaptersAtom)
  const currentId = useAtomValue(currentDictIdAtom)
  const setId = useSetAtom(currentDictIdAtom)
  const setChapter = useSetAtom(currentChapterAtom)
  const setReview = useSetAtom(reviewModeInfoAtom)
  const navigate = useNavigate()
  const stats = useLiveQuery(async () =>
    Object.fromEntries(
      await Promise.all(
        learningDictionaryPlan.map(async ({ id }) => {
          const records = await db.chapterRecords.where('dict').equals(id).toArray()
          return [
            id,
            {
              completed: new Set(records.filter((record) => record.chapter !== null && record.chapter >= 0).map((record) => record.chapter))
                .size,
              attempts: await db.wordRecords.where('dict').equals(id).count(),
            },
          ]
        }),
      ),
    ),
  )
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link to="/" className="text-sm text-indigo-500">
          返回练习
        </Link>
        <Link to="/gallery" className="text-sm text-indigo-500">
          全部词库
        </Link>
      </Header>
      <div className="mx-auto max-w-5xl space-y-5 px-6">
        <section className="space-y-2 rounded-xl bg-white p-5 dark:bg-gray-800">
          <h1 className="text-2xl font-bold">我的词典</h1>
          <p>六个独立词库，分别选择、分别练习、分别记录。</p>
          <p className="text-sm text-gray-500">
            优先学习工作英语和农业专业英语；日常英语优先级高；商务英语与 CET-6 为中；IELTS 留作后续。每个词库按 20 词分章。
          </p>
          {REACT_APP_DEPLOY_ENV === 'pages' && (
            <a className="inline-block text-sm text-indigo-500 underline" href="/qwerty-learner/local-study.zip" download>
              下载本地学习包（含 Windows 启动文件）
            </a>
          )}
        </section>
        <div className="grid gap-5 md:grid-cols-2">
          {learningDictionaryPlan.map((plan) => {
            const dict = idDictionaryMap[plan.id]
            const selectedChapter = Math.min(chapters[plan.id] ?? 0, Math.max(0, dict.chapterCount - 1))
            return (
              <section
                key={dict.id}
                aria-label={`${plan.name}词库`}
                className="space-y-3 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      plan.priority === '最高'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    优先级：{plan.priority}
                  </span>
                </div>
                <p>{plan.focus}</p>
                <p className="text-sm text-gray-500">
                  {dict.length} 词 · {dict.chapterCount} 章 · {plan.stage}
                </p>
                <p className="text-xs text-gray-500">
                  已完成 {stats?.[dict.id]?.completed ?? 0} 章 · 逐词练习记录 {stats?.[dict.id]?.attempts ?? 0} 次
                  {currentId === dict.id ? ' · 当前词库' : ''}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm">
                    章节{' '}
                    <select
                      aria-label={`${plan.name}章节`}
                      className="rounded border bg-white dark:bg-gray-700"
                      value={selectedChapter}
                      onChange={(event) => setChapters((old) => ({ ...old, [dict.id]: Number(event.target.value) }))}
                    >
                      {Array.from({ length: dict.chapterCount }, (_, index) => (
                        <option value={index} key={index}>
                          第 {index + 1} 章
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="my-btn-primary"
                    onClick={() => {
                      setId(dict.id)
                      setChapter(selectedChapter)
                      setReview((old) => ({ ...old, isReviewMode: false }))
                      navigate('/')
                    }}
                  >
                    开始{plan.name}
                  </button>
                </div>
              </section>
            )
          })}
        </div>
        <section className="rounded-xl bg-white p-5 text-sm dark:bg-gray-800">
          <h2 className="mb-2 font-semibold">另外保留：自定义词典</h2>
          <p className="mb-3 text-gray-500">你此前自己添加、导入的词条仍在独立的自定义词典中，不会混入上述六个词库，也不会被覆盖。</p>
          <Link className="text-indigo-500 underline" to="/my-dictionary/custom">
            管理自定义词典
          </Link>
        </section>
      </div>
    </main>
  )
}
