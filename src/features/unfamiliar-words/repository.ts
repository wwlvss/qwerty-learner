import type { UnfamiliarKind, UnfamiliarWord } from './types'
import { normalizeWord } from '@/features/etymology/types'
import type { Word } from '@/typings'
import { db } from '@/utils/db'

export async function saveUnfamiliarWord(word: Word, dict: string, detail?: { kind: UnfamiliarKind; note: string }) {
  const name = word.name.trim().replace(/\s+/g, ' ')
  if (!name || name.length > 120 || !/^[a-z0-9][a-z0-9 '.,()/&-]*$/i.test(name)) throw new Error('请输入英语单词或短语（最多 120 字符）')
  if (detail && (!['unfamiliar', 'confusable', 'phrase'].includes(detail.kind) || detail.note.length > 2000))
    throw new Error('标签或备注无效')
  const id = normalizeWord(name)
  await db.transaction('rw', db.unfamiliarWords, async () => {
    const existing = await db.unfamiliarWords.get(id)
    const now = Date.now()
    await db.unfamiliarWords.put({
      ...word,
      id,
      name,
      trans: Array.from(new Set([...(existing?.trans ?? []), ...word.trans.filter((item) => typeof item === 'string')])),
      sourceDicts: Array.from(new Set([...(existing?.sourceDicts ?? []), ...(dict !== 'unfamiliar' ? [dict] : [])])),
      kind: detail?.kind ?? existing?.kind ?? (name.includes(' ') ? 'phrase' : 'unfamiliar'),
      note: detail?.note ?? existing?.note ?? '',
      addedAt: existing?.addedAt ?? now,
      updatedAt: now,
    })
  })
}

export function validateUnfamiliarPackage(value: unknown): UnfamiliarWord[] {
  const pack = value as { format: string; version: number; words: UnfamiliarWord[] }
  if (!pack || pack.format !== 'qwerty-unfamiliar-words' || pack.version !== 1 || !Array.isArray(pack.words) || pack.words.length > 20000)
    throw new Error('不熟词本数据包格式无效')
  const ids = new Set<string>()
  for (const word of pack.words) {
    if (
      !word ||
      typeof word.name !== 'string' ||
      !word.name.trim() ||
      word.name.length > 120 ||
      !/^[a-z0-9][a-z0-9 '.,()/&-]*$/i.test(word.name) ||
      word.id !== normalizeWord(word.name) ||
      ids.has(word.id)
    )
      throw new Error('词条名称或 ID 无效或重复')
    ids.add(word.id)
    if (
      word.contextTrans !== undefined &&
      (!Array.isArray(word.contextTrans) ||
        word.contextTrans.length > 100 ||
        word.contextTrans.some((text) => typeof text !== 'string' || text.length > 2000))
    )
      throw new Error('场景释义无效')
    if (
      !Array.isArray(word.trans) ||
      word.trans.length > 100 ||
      word.trans.some((item) => typeof item !== 'string' || item.length > 5000) ||
      typeof word.usphone !== 'string' ||
      typeof word.ukphone !== 'string' ||
      word.usphone.length > 200 ||
      word.ukphone.length > 200
    )
      throw new Error('释义或音标无效')
    if (
      !Array.isArray(word.sourceDicts) ||
      word.sourceDicts.length > 1000 ||
      word.sourceDicts.some((dict) => typeof dict !== 'string' || dict.length > 100) ||
      !['unfamiliar', 'confusable', 'phrase'].includes(word.kind) ||
      typeof word.note !== 'string' ||
      word.note.length > 2000 ||
      !Number.isFinite(word.addedAt) ||
      !Number.isFinite(word.updatedAt)
    )
      throw new Error('来源、标签或备注无效')
  }
  return pack.words
}

export async function importUnfamiliarPackage(value: unknown) {
  const words = validateUnfamiliarPackage(value)
  await db.transaction('rw', db.unfamiliarWords, async () => {
    for (const word of words) {
      const existing = await db.unfamiliarWords.get(word.id)
      await db.unfamiliarWords.put(
        existing
          ? { ...word, addedAt: existing.addedAt, sourceDicts: Array.from(new Set([...existing.sourceDicts, ...word.sourceDicts])) }
          : word,
      )
    }
  })
  return words.length
}
