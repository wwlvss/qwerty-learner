export interface FarmVocabulary {
  name: string
  meaning: string
  category: string
  partOfSpeech?: string
  example: string
  translation: string
  pronunciationHint?: string
  spelling?: string
  morphologyNote?: string
  memoryHint?: string
  sheet: string
  sourceKind: 'user' | 'original'
}
export interface FarmSentence {
  text: string
  translation: string
  category: string
  scenario: string
  grammar: string
  sheet: string
}
export interface FarmMaterials {
  profile: { farmLabel: string; role: string; roleEnglish: string; region: string; regionEnglish: string; varietyCodes: string[] }
  source: string
  vocabulary: FarmVocabulary[]
  sentences: FarmSentence[]
  guidance: { title: string; text: string }[]
  morphologyGuide: { form: string; meaning: string; examples: string; note: string }[]
  sourceVocabularyCount: number
  extensionVocabularyCount: number
  sourceSentenceCount: number
  notes: string[]
}
