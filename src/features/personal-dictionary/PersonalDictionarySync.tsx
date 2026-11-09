import { PERSONAL_DICT_URL } from './constants'
import { personalDictionaryCountAtom } from '@/store'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { mutate } from 'swr'

export default function PersonalDictionarySync() {
  const words = useLiveQuery(() => db.personalWords.orderBy('position').toArray())
  const setCount = useSetAtom(personalDictionaryCountAtom)
  useEffect(() => {
    if (!words) return
    setCount(words.length)
    void mutate(PERSONAL_DICT_URL, words, false)
  }, [words, setCount])
  return null
}
