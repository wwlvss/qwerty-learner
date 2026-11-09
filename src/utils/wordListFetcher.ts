import { versionedDataUrl } from './versionedDataUrl'
import type { Word } from '@/typings'

export async function wordListFetcher(url: string): Promise<Word[]> {
  if (url === 'unfamiliar://words') {
    const { db } = await import('@/utils/db')
    return db.unfamiliarWords.orderBy('addedAt').toArray()
  }
  if (url === 'personal://words') {
    const { db } = await import('@/utils/db')
    return db.personalWords.orderBy('position').toArray()
  }
  const URL_PREFIX: string = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''

  const response = await fetch(versionedDataUrl(URL_PREFIX + url))
  if (!response.ok) throw new Error(`词库读取失败 (${response.status})`)
  const words: Word[] = await response.json()
  return words
}
