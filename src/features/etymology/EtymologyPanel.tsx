import EtymologyContent from './EtymologyContent'
import type { EtymologyContentProps } from './EtymologyContent'
import { useLayoutEffect, useRef } from 'react'

const interactive = 'button, a, input, select, textarea, summary, [contenteditable="true"], [role="button"]'

export default function EtymologyPanel({ onNext, ...content }: EtymologyContentProps & { onNext: () => void }) {
  const panel = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    panel.current?.focus({ preventScroll: true })
    let pressed = ''
    const isContinueKey = (event: KeyboardEvent) =>
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
      <EtymologyContent {...content} compact onNavigate={onNext} />
    </section>
  )
}
