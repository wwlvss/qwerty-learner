import { normalizeWord } from '@/features/etymology/types'
import SaveUnfamiliarButton from '@/features/unfamiliar-words/SaveUnfamiliarButton'
import { getDictionaryMeanings, lookupBuiltInWord } from '@/features/word-support/repository'
import type { Word } from '@/typings'
import { db } from '@/utils/db'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const clean = (text: string) =>
  text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[.,;:!?“”"]+|[.,;:!?“”"]+$/g, '')
    .trim()
type Picked = { text: string; translation: string; left: number; top: number }

export default function SelectionLookup({ children, dictionaryId }: PropsWithChildren<{ dictionaryId?: string }>) {
  const container = useRef<HTMLDivElement>(null)
  const popup = useRef<HTMLElement>(null)
  const [picked, setPicked] = useState<Picked>()
  const [word, setWord] = useState<Word>()
  const [loading, setLoading] = useState(false)
  const [custom, setCustom] = useState('')
  useEffect(() => {
    let timer = 0
    let dragging = false
    const inspect = () => {
      if (dragging) return
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed || !selection.rangeCount) return
        const range = selection.getRangeAt(0)
        if (!container.current?.contains(range.startContainer) || !container.current.contains(range.endContainer)) return
        const text = clean(selection.toString())
        if (!text || text.length > 120 || !/^[a-z0-9][a-z0-9 '.,()/&-]*$/i.test(text)) return
        const element =
          range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? (range.commonAncestorContainer as Element)
            : range.commonAncestorContainer.parentElement
        const pair = element?.closest('[data-lookup-text]') as HTMLElement | null
        const translation =
          pair && normalizeWord(clean(pair.dataset.lookupText ?? '')) === normalizeWord(text) ? pair.dataset.lookupTranslation ?? '' : ''
        const rect = range.getBoundingClientRect()
        setPicked({
          text,
          translation,
          left: Math.max(12, Math.min(rect.left, window.innerWidth - 372)),
          top: Math.max(12, Math.min(rect.bottom + 10, window.innerHeight - 360)),
        })
      }, 120)
    }
    const outside = (event: PointerEvent) => {
      dragging = event.target instanceof Node && !popup.current?.contains(event.target)
      if (dragging) {
        clearTimeout(timer)
        setPicked(undefined)
      }
    }
    const released = () => {
      dragging = false
      inspect()
    }
    document.addEventListener('selectionchange', inspect)
    document.addEventListener('pointerup', released)
    document.addEventListener('pointercancel', released)
    document.addEventListener('keyup', inspect)
    document.addEventListener('pointerdown', outside)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('selectionchange', inspect)
      document.removeEventListener('pointerup', released)
      document.removeEventListener('pointercancel', released)
      document.removeEventListener('keyup', inspect)
      document.removeEventListener('pointerdown', outside)
    }
  }, [])
  const selectedText = picked?.text
  const selectedTranslation = picked?.translation
  useEffect(() => {
    if (!selectedText) return
    let active = true
    setLoading(true)
    setCustom('')
    setWord(undefined)
    const normalized = normalizeWord(selectedText)
    void Promise.all([
      lookupBuiltInWord(selectedText).catch(() => undefined),
      getDictionaryMeanings(selectedText).catch(() => []),
      db.personalWords.get(normalized).catch(() => undefined),
      db.unfamiliarWords.get(normalized).catch(() => undefined),
    ])
      .then(([builtin, meanings, personal, saved]) => {
        if (!active) return
        const trans = Array.from(
          new Set([
            ...(selectedTranslation ? [selectedTranslation] : []),
            ...(saved?.trans ?? []),
            ...(personal?.trans ?? []),
            ...(builtin?.trans ?? []),
            ...meanings.map((entry) => entry.text),
          ]),
        )
        setWord({
          name: selectedText,
          trans,
          usphone: personal?.usphone || builtin?.usphone || '',
          ukphone: personal?.ukphone || builtin?.ukphone || '',
        })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedText, selectedTranslation])
  const close = () => {
    setPicked(undefined)
    window.getSelection()?.removeAllRanges()
  }
  return (
    <div ref={container} className="learning-readable">
      {children}
      {picked &&
        createPortal(
          <aside
            ref={popup}
            aria-label="选词释义"
            data-testid="selection-lookup"
            className="learning-readable fixed z-[70] max-h-[70vh] w-[calc(100vw-24px)] max-w-[360px] space-y-3 overflow-y-auto rounded-xl border border-indigo-200 bg-white p-4 text-left text-sm text-gray-700 shadow-xl dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            style={{ left: picked.left, top: picked.top }}
          >
            <div className="flex items-start justify-between gap-3">
              <strong className="break-words text-lg">{picked.text}</strong>
              <button type="button" className="shrink-0 text-indigo-500" onClick={close} aria-label="关闭选词释义">
                关闭
              </button>
            </div>
            {loading ? (
              <p>查询本地释义…</p>
            ) : (
              <>
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {word?.trans.map((translation, index) => (
                    <li key={index}>{translation}</li>
                  ))}
                </ul>
                {!word?.trans.length && (
                  <p className="text-gray-500">本地暂无该表达的释义，可改选单词，或补充译文后收藏。这里不会自动编造整句翻译。</p>
                )}
                <label className="block text-xs text-gray-500">
                  补充中文释义（选填）
                  <input
                    aria-label="选词补充释义"
                    value={custom}
                    maxLength={2000}
                    onChange={(event) => setCustom(event.target.value)}
                    className="mt-1 block w-full rounded border p-2 text-sm dark:bg-gray-700"
                  />
                </label>
                {word && (
                  <SaveUnfamiliarButton
                    dictionaryId={dictionaryId}
                    word={{ ...word, trans: custom.trim() ? [custom.trim(), ...word.trans] : word.trans }}
                  />
                )}
              </>
            )}
            <p className="text-xs text-gray-400">本地词库查询 · 不向外部翻译服务发送选中文字</p>
          </aside>,
          document.body,
        )}
    </div>
  )
}
