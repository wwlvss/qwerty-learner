import { learningPreferencesAtom } from '@/features/learning-preferences/store'
import { currentDictInfoAtom, hintSoundsConfigAtom, isOpenDarkModeAtom, keySoundsConfigAtom, pronunciationConfigAtom } from '@/store'
import { useAtom, useAtomValue } from 'jotai'
import { Link } from 'react-router-dom'

export default function PersonalLearningSetting() {
  const dict = useAtomValue(currentDictInfoAtom)
  const [prefs, setPrefs] = useAtom(learningPreferencesAtom)
  const [pronunciation, setPronunciation] = useAtom(pronunciationConfigAtom)
  const [keys, setKeys] = useAtom(keySoundsConfigAtom)
  const [hints, setHints] = useAtom(hintSoundsConfigAtom)
  const [dark, setDark] = useAtom(isOpenDarkModeAtom)
  const options = [
    ['simpleLayout', '简洁学习界面', '收起低频工具，隐藏社群、赞助等页脚入口。'],
    ['hideTranslationsInDictation', '默写时隐藏中文译文', '单词和短语在输入完成前不显示中文；答对后再显示学习资料。'],
    ['showSynonyms', '答对后显示近义词与近义表达', '展示语境和差别，不把近义词当作总能互换。'],
    ['showDefinitions', '答对后显示词典其他释义', '保留场景重点，同时查阅原词库中的其他中文释义。'],
    ['showPhrases', '答对后显示常用短语', '短语旁可以直接收藏到不熟词本。'],
    ['showExamples', '答对后显示例句', '显示例句和中文译文。'],
    ['showEtymology', '答对后显示词根词源', '资料不全时会明确提示，关闭后仍需回车或空格进入下一词。'],
  ] as const
  return (
    <div className="h-full w-full space-y-5 overflow-y-auto p-6 text-left text-sm text-gray-700 dark:text-gray-200">
      <h2 className="text-lg font-semibold">个人学习</h2>
      {options.map(([key, label, description]) => (
        <label key={key} className="flex cursor-pointer items-start gap-3">
          <input
            className="mt-1"
            type="checkbox"
            checked={prefs[key]}
            onChange={(event) => setPrefs((old) => ({ ...old, [key]: event.target.checked }))}
          />
          <span>
            <span className="block font-medium">{label}</span>
            <span className="mt-1 block text-xs text-gray-500">{description}</span>
          </span>
        </label>
      ))}
      <hr className="dark:border-gray-700" />
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={pronunciation.isOpen}
          onChange={(e) => setPronunciation((old) => ({ ...old, isOpen: e.target.checked }))}
        />
        自动播放单词发音
      </label>
      {dict.language === 'en' && (
        <label className="flex items-center gap-3">
          英语发音
          <select
            aria-label="英语发音"
            className="rounded border bg-white p-1 dark:bg-gray-700"
            value={pronunciation.type === 'uk' ? 'uk' : 'us'}
            onChange={(e) =>
              setPronunciation((old) => ({ ...old, type: e.target.value as 'us' | 'uk', name: e.target.value === 'uk' ? '英音' : '美音' }))
            }
          >
            <option value="us">美音</option>
            <option value="uk">英音</option>
          </select>
        </label>
      )}
      <label className="flex items-center gap-3">
        播放语速
        <select
          aria-label="播放语速"
          className="rounded border bg-white p-1 dark:bg-gray-700"
          value={pronunciation.rate}
          onChange={(event) => setPronunciation((old) => ({ ...old, rate: Number(event.target.value) }))}
        >
          {![0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].includes(pronunciation.rate) && (
            <option value={pronunciation.rate}>{pronunciation.rate}×</option>
          )}
          {[0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((rate) => (
            <option key={rate} value={rate}>
              {rate}×
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={keys.isOpen} onChange={(e) => setKeys((old) => ({ ...old, isOpen: e.target.checked }))} />
        键盘音效
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={hints.isOpen} onChange={(e) => setHints((old) => ({ ...old, isOpen: e.target.checked }))} />
        正确和错误提示音
      </label>
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
        深色模式
      </label>
      <p className="text-xs text-gray-500">
        这些显示偏好保存在当前浏览器，不会删除释义资料、收藏或学习历史。字体、默写、循环和备份仍可在其他设置页中调整。
      </p>
      <div className="flex flex-wrap gap-4 text-indigo-500">
        <Link to="/my-dictionary">选择我的词典</Link>
        <Link to="/unfamiliar">管理不熟词本</Link>
      </div>
    </div>
  )
}
