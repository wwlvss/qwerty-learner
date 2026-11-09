import EtymologyContent from './EtymologyContent'
import type { EtymologyContentProps } from './EtymologyContent'
import FarmWordNotes from '@/features/farm-english/FarmWordNotes'
import { learningPreferencesAtom } from '@/features/learning-preferences/store'
import SelectionLookup from '@/features/selection-lookup/SelectionLookup'
import SynonymPanel from '@/features/word-support/SynonymPanel'
import WordDefinitionsPanel from '@/features/word-support/WordDefinitionsPanel'
import WordUsagePanel from '@/features/word-support/WordUsagePanel'
import { currentDictIdAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useLayoutEffect, useRef } from 'react'

const interactive = 'button, a, input, select, textarea, summary, [contenteditable="true"], [role="button"]'

export default function EtymologyPanel({ onNext, ...content }: EtymologyContentProps & { onNext: () => void }) {
  const dictId = useAtomValue(currentDictIdAtom)
  const prefs = useAtomValue(learningPreferencesAtom)
  const panel = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    panel.current?.focus({ preventScroll: true })
    let pressed = ''
    const isContinueKey = (event: KeyboardEvent) =>
      !window.getSelection()?.toString().trim() &&
      (event.key === 'Enter' || event.key === ' ') &&
      !event.isComposing &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    const isInteractive = (event: KeyboardEvent) => event.target instanceof Element && Boolean(event.target.closest(interactive))
    const down = (event: KeyboardEvent) => {
      if (!isContinueKey(event) || isInteractive(event)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!event.repeat) pressed = event.key
    }
    const up = (event: KeyboardEvent) => {
      if (!isContinueKey(event) || isInteractive(event) || pressed !== event.key) return
      event.preventDefault()
      event.stopImmediatePropagation()
      pressed = ''
      // Wait until key release so a held Space/Enter never spills into the next word.
      onNext()
    }
    const blur = () => {
      pressed = ''
    }
    window.addEventListener('keydown', down, true)
    window.addEventListener('keyup', up, true)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down, true)
      window.removeEventListener('keyup', up, true)
      window.removeEventListener('blur', blur)
    }
  }, [onNext])
  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label="练习词源说明"
      className="my-4 w-full rounded-xl border border-indigo-100 bg-white p-4 text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-gray-700 dark:bg-gray-800"
      data-testid="etymology-panel"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-700">
        <div>
          <p className="font-semibold text-green-600 dark:text-green-400">输入正确</p>
          <p className="text-xs text-gray-500">当前单词已保留，按回车或空格进入下一个词</p>
        </div>
        <button type="button" className="my-btn-primary" onClick={onNext}>
          下一个词
        </button>
      </div>
      <SelectionLookup>
        <div className={`grid gap-6 ${prefs.showDefinitions && (prefs.showPhrases || prefs.showExamples) ? 'lg:grid-cols-2' : ''}`}>
          {prefs.showDefinitions && content.word && <WordDefinitionsPanel word={content.word} />}
          {(prefs.showPhrases || prefs.showExamples) && <WordUsagePanel word={content.initialWord} />}
        </div>
        {prefs.showSynonyms && <SynonymPanel word={content.initialWord} />}
        {dictId === 'farm-english' && <FarmWordNotes word={content.initialWord} />}
        {prefs.showEtymology && <EtymologyContent {...content} compact onNavigate={onNext} />}
      </SelectionLookup>
    </section>
  )
}
