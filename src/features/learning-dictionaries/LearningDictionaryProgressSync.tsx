import { learningDictionaryPlan } from './plan'
import { currentChapterAtom, currentDictIdAtom, learningDictionaryChaptersAtom } from '@/store'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'

export default function LearningDictionaryProgressSync() {
  const id = useAtomValue(currentDictIdAtom)
  const chapter = useAtomValue(currentChapterAtom)
  const setChapters = useSetAtom(learningDictionaryChaptersAtom)
  useEffect(() => {
    if (!learningDictionaryPlan.some((dict) => dict.id === id)) return
    setChapters((old) => (old[id] === chapter ? old : { ...old, [id]: chapter }))
  }, [id, chapter, setChapters])
  return null
}
