import EtymologyContent from './EtymologyContent'
import type { EtymologyContentProps } from './EtymologyContent'
import { Dialog } from '@headlessui/react'
import { useRef } from 'react'

// The root library retains its detail viewer. Typing feedback uses the inline panel.
export default function EtymologyDialog({ onClose, ...content }: EtymologyContentProps & { onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null)
  return (
    <Dialog open onClose={onClose} initialFocus={closeButton} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Dialog.Title className="font-semibold text-gray-700 dark:text-gray-200">词根词源解析</Dialog.Title>
              <button type="button" ref={closeButton} className="my-btn-primary" onClick={onClose}>
                关闭词源
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto pr-2">
              <EtymologyContent {...content} onNavigate={onClose} />
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
