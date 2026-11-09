import atomForConfig from '@/store/atomForConfig'

export const learningPreferencesAtom = atomForConfig('learningPreferences', {
  simpleLayout: true,
  showDefinitions: true,
  showPhrases: true,
  showExamples: true,
  showEtymology: true,
})
