import EtymologyContent from './EtymologyContent'
import type { EtymologyContentProps } from './EtymologyContent'
import { useEffect, useRef } from 'react'

const interactive = 'button, a, input, select, textarea, summary, [contenteditable="true"], [role="button"]'

export default function EtymologyPanel({ onClose, ...content }: EtymologyContentProps & { onClose: () => void }) {
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
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
      onClose()
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
  }, [onClose])
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
          <p className="font-semibold text-green-600 dark:text-green-400">{content.completion ? '输入正确' : '词源说明'}</p>
          <p className="text-xs text-gray-500">{content.completion ? '按回车或空格，继续下一个词' : '按回车或空格，返回当前练习'}</p>
        </div>
        <button type="button" className="my-btn-primary" onClick={onClose}>
          {content.completion ? '继续练习' : '关闭词源'}
        </button>
      </div>
      <EtymologyContent {...content} compact onNavigate={onClose} />
    </section>
  )
}
