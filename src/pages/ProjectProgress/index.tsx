import Header from '@/components/Header'
import { versionedDataUrl } from '@/utils/versionedDataUrl'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type ProgressData = {
  method: string
  items: { name: string; percent: number; priority: string; completed: string[]; remaining: string[]; evidence: string }[]
  coverage: { name: string; count: number; total: number; percent: number }[]
}
export default function ProjectProgress() {
  const [data, setData] = useState<ProgressData>()
  const [error, setError] = useState('')
  const prefix = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''
  useEffect(() => {
    void fetch(versionedDataUrl(prefix + '/data/project-progress.json'))
      .then((response) => {
        if (!response.ok) throw Error('读取进度表失败')
        return response.json()
      })
      .then(setData)
      .catch(() => setError('读取进度表失败，请刷新重试'))
  }, [prefix])
  return (
    <main className="min-h-screen bg-gray-50 pb-12 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
      <Header>
        <Link to="/my-dictionary" className="text-sm text-indigo-500">
          返回我的词典
        </Link>
      </Header>
      <div className="mx-auto max-w-6xl space-y-5 px-4 sm:px-6">
        <h1 className="text-2xl font-bold">项目进度与未完成事项</h1>
        <a className="inline-block text-indigo-500 underline" href={versionedDataUrl(prefix + '/data/project-progress.xlsx')} download>
          下载详细进度表 Excel
        </a>
        <a
          className="ml-4 inline-block text-indigo-500 underline"
          href={versionedDataUrl(prefix + '/data/local-codex-handoff.md')}
          download
        >
          下载本地 Codex 交接说明
        </a>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 text-sm dark:bg-gray-800">
          <a className="my-btn-primary" href={versionedDataUrl(prefix + '/data/codex-handoff.zip')} download>
            下载完整 Codex 交接包
          </a>
          <a className="text-indigo-500 underline" href={versionedDataUrl(prefix + '/data/local-codex-first-message.txt')} download>
            下载发给本地 Codex 的第一条消息
          </a>
          <p className="w-full text-gray-500">
            只需先安装并登录本地 Codex，再把交接包里的 FIRST_MESSAGE_TO_CODEX.txt 发给它；环境安装和项目启动交给它处理。
          </p>
        </div>
        {error && <p role="alert">{error}</p>}
        {data && (
          <>
            <p className="rounded-lg bg-white p-4 text-sm dark:bg-gray-800">{data.method}</p>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">功能交付进度</h2>
              <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-800">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      {['模块', '完成度', '已完成', '待完成', '优先级'].map((label) => (
                        <th key={label} className="p-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.name} className="border-b align-top dark:border-gray-700">
                        <th scope="row" className="p-3 font-medium">
                          {item.name}
                        </th>
                        <td className="p-3 font-semibold text-indigo-500">{item.percent}%</td>
                        <td className="p-3">{item.completed.join('；') || '尚未实现'}</td>
                        <td className="p-3">{item.remaining.join('；') || '本轮定义范围已交付'}</td>
                        <td className="p-3">{item.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">真实资料覆盖率</h2>
              <p className="text-sm text-gray-500">功能可用不代表所有词都有完整资料；以下按实际去重词条计算。</p>
              <div className="overflow-x-auto rounded-xl bg-white dark:bg-gray-800">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      {['资料类型', '已覆盖／总词条', '覆盖率'].map((label) => (
                        <th key={label} className="p-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.coverage.map((row) => (
                      <tr key={row.name} className="border-t dark:border-gray-700">
                        <th scope="row" className="p-3 font-medium">
                          {row.name}
                        </th>
                        <td className="p-3">
                          {row.count}／{row.total}
                        </td>
                        <td className="p-3">{row.percent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
