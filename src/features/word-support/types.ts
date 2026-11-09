export interface UsageSource {
  name: string
  url: string
  license: string
  kind: 'original' | 'builtin' | 'tatoeba'
}
export interface UsagePhrase {
  text: string
  translation: string
  source: UsageSource
}
export interface UsageExample {
  text: string
  translation?: string
  targetStart: number
  targetEnd: number
  source: UsageSource
}
export interface WordUsage {
  normalizedWord: string
  phrases: UsagePhrase[]
  examples: UsageExample[]
}
export interface UsagePackage {
  format: 'qwerty-word-usage'
  version: 1
  entries: WordUsage[]
}
export interface SupportManifest {
  englishDictionaries: number
  availableDictionaries: number
  uniqueEntries: number
  phraseEntries: number
  exampleEntries: number
  etymologyEntries: number
  missingDictionaries: string[]
}
