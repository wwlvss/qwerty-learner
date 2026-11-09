import { PERSONAL_DICT_URL } from './constants'
import { personalDictionaryCountAtom, unfamiliarDictionaryCountAtom } from '@/store'
import { db } from '@/utils/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { mutate } from 'swr'

export default function PersonalDictionarySync() {
  const words = useLiveQuery(() => db.personalWords.orderBy('position').toArray())
  const unfamiliar = useLiveQuery(() => db.unfamiliarWords.orderBy('addedAt').toArray())
  const setUnfamiliarCount = useSetAtom(unfamiliarDictionaryCountAtom)
  const setCount = useSetAtom(personalDictionaryCountAtom)
  useEffect(() => {
    if (!words) return
    setCount(words.length)
    void mutate(PERSONAL_DICT_URL, words, false)
  }, [words, setCount])
  useEffect(() => {
    if (!unfamiliar) return
    setUnfamiliarCount(unfamiliar.length)
    void mutate('unfamiliar://words', unfamiliar, false)
  }, [unfamiliar, setUnfamiliarCount])
  return null
}
