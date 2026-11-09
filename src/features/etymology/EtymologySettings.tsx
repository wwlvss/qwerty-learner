import { getDisplayMode, setDisplayMode } from './repository'
import type { DisplayMode } from './types'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'

export default function EtymologySettings() {
  const mode = useLiveQuery(getDisplayMode)
  const [error, setError] = useState('')
  return (
    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
      <label className="flex items-center gap-3">
        词源卡片显示
        <select
          aria-label="词源卡片显示"
          className="rounded border bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          value={mode ?? 'first'}
          disabled={!mode}
          onChange={(e) => {
            setError('')
            void setDisplayMode(e.target.value as DisplayMode).catch(() => setError('设置保存失败，请重试'))
          }}
        >
          <option value="auto">自动显示 · 每次答对</option>
          <option value="first">首次显示 · 首次答对</option>
          <option value="off">关闭</option>
        </select>
      </label>
      <p className="text-xs">默认首次显示；无可靠资料时直接继续。阅读期间暂停练习计时；仍可随时手动查看。</p>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
