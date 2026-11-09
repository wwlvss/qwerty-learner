import type { Word } from '@/typings'

export type UnfamiliarKind = 'unfamiliar' | 'confusable' | 'phrase'
export interface UnfamiliarWord extends Word {
  id: string
  sourceDicts: string[]
  kind: UnfamiliarKind
  note: string
  addedAt: number
  updatedAt: number
}
