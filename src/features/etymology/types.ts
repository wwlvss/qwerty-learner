export type VerificationStatus = 'verified' | 'pending'
export type RelationType = 'cognate' | 'shared_root' | 'related_meaning'
export type DisplayMode = 'auto' | 'first' | 'off'

export interface Source {
  name: string
  url: string
  license: string
  originalEntry: string
  evidence: string
  verificationStatus: VerificationStatus
}

export interface Morpheme {
  kind: 'prefix' | 'root' | 'suffix' | 'stem' | 'inflection'
  text: string
  meaning: string
  // UTF-16 offsets into the original spelling, never inferred from substring matches.
  start: number
  end: number
  rootId?: string
}

export interface EtymologyEntry {
  id: string
  // New namespaced reference; existing dictionary identifiers are never rewritten.
  wordId: string
  normalizedWord: string
  morphologicalAnalysis: Morpheme[]
  morphologyNote: string
  originLanguage: string
  originalForm: string
  originalMeaning: string
  historicalEvolution: string[]
  etymologyExplanation: string
  memoryTip: string
  sources: Source[]
  confidence: number
  verificationStatus: VerificationStatus
  updatedAt: string
}

export interface Root {
  id: string
  root: string
  language: string
  meaning: string
  originalForm: string
  explanation: string
  relatedRootIds: string[]
  sources: Source[]
  confidence: number
  verificationStatus: VerificationStatus
}

export interface RootWordRelation {
  id: string
  rootId: string
  wordId: string
  normalizedWord: string
  relationType: RelationType
  explanation: string
  sources: Source[]
  verificationStatus: VerificationStatus
}

export interface RootLearningState {
  rootId: string
  firstViewedAt: number
  lastViewedAt: number
  viewCount: number
  status: 'viewed' | 'mastered' | 'review'
  learnedThroughWords: string[]
}

export interface EtymologyPackage {
  format: 'qwerty-etymology'
  version: 1
  id: string
  entries: EtymologyEntry[]
  roots: Root[]
  relations: RootWordRelation[]
}

export const relationLabels: Record<RelationType, string> = {
  cognate: 'A · 真正同源词',
  shared_root: 'B · 相同词根构词',
  related_meaning: 'C · 语义相关词（不代表同源）',
}

export const normalizeWord = (word: string) => word.normalize('NFC').trim().toLowerCase()
