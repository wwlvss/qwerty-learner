import type { Word } from '@/typings'

export interface PersonalWord extends Word {
  id: string
  addedAt: number
  position: number
  sourceDictionary?: string
}
