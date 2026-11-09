import type { SupportManifest, WordUsage } from './types'
import { normalizeWord } from '@/features/etymology/types'
import type { Word } from '@/typings'
import { db } from '@/utils/db'
import { versionedDataUrl } from '@/utils/versionedDataUrl'
import { normalizeTranslations } from '@/utils/wordData'

const prefix = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''
const cache = new Map<string, Promise<unknown>>()
function read<T>(path: string): Promise<T> {
  if (!cache.has(path))
    cache.set(
      path,
      fetch(versionedDataUrl(prefix + path))
        .then((r) => {
          if (!r.ok) throw new Error('本地学习资料读取失败')
          return r.json()
        })
        .catch((e) => {
          cache.delete(path)
          throw e
        }),
    )
  return cache.get(path) as Promise<T>
}
const bucket = (word: string) => (/^[a-z]/.test(word) ? word[0] : 'other')
export function getSupportManifest() {
  return read<SupportManifest>('/data/word-support/manifest.json')
}
export async function getWordUsage(word: string): Promise<WordUsage | undefined> {
  const normalized = normalizeWord(word)
  const local = await db.wordUsageEntries.get(normalized)
  const shard = await read<Record<string, WordUsage>>(`/data/word-support/usage/${bucket(normalized)}.json`).catch(
    () => ({} as Record<string, WordUsage>),
  )
  const builtin = shard[normalized]
  if (!local) return builtin
  return {
    normalizedWord: normalized,
    phrases: [...local.phrases, ...(builtin?.phrases ?? [])],
    examples: [...local.examples, ...(builtin?.examples ?? [])],
  }
}
export async function lookupBuiltInWord(word: string): Promise<Word | undefined> {
  const normalized = normalizeWord(word)
  const shard = await read<Record<string, { url: string; index: number }>>(`/data/word-support/catalog/${bucket(normalized)}.json`)
  const reference = shard[normalized]
  if (!reference) return undefined
  const words = await read<Word[]>(reference.url)
  const entry = words[reference.index]
  return entry
    ? {
        ...entry,
        trans: normalizeTranslations(entry.trans),
        usphone: typeof entry.usphone === 'string' ? entry.usphone : '',
        ukphone: typeof entry.ukphone === 'string' ? entry.ukphone : '',
      }
    : undefined
}
