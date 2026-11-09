import type { PersonalWord } from './types'
import { normalizeWord } from '@/features/etymology/types'
import { lookupBuiltInWord } from '@/features/word-support/repository'
import type { Word } from '@/typings'
import { db } from '@/utils/db'

export function validateWords(input: unknown): Word[] {
  if (!Array.isArray(input) || input.length > 10000) throw new Error('每次最多导入 10000 个单词')
  return input.map((value) => {
    if (!value || typeof value !== 'object') throw new Error('单词格式无效')
    const word = value as Word
    if (typeof word.name !== 'string' || !word.name.trim() || word.name.length > 120 || !/^[a-zA-Z][a-zA-Z '\-.,?!]*$/.test(word.name))
      throw new Error('请使用英语单词或短语（最多 120 个字符）')
    const trans = word.trans ?? []
    if (!Array.isArray(trans) || trans.length > 100 || trans.some((t) => typeof t !== 'string' || t.length > 2000))
      throw new Error('释义格式无效')
    if (word.usphone !== undefined && (typeof word.usphone !== 'string' || word.usphone.length > 200)) throw new Error('美式音标无效')
    if (word.ukphone !== undefined && (typeof word.ukphone !== 'string' || word.ukphone.length > 200)) throw new Error('英式音标无效')
    if (
      word.contextTrans !== undefined &&
      (!Array.isArray(word.contextTrans) ||
        word.contextTrans.length > 100 ||
        word.contextTrans.some((text) => typeof text !== 'string' || text.length > 2000))
    )
      throw new Error('场景释义无效')
    return {
      name: word.name.trim(),
      trans,
      usphone: word.usphone ?? '',
      ukphone: word.ukphone ?? '',
      ...(word.contextTrans ? { contextTrans: word.contextTrans } : {}),
    }
  })
}
export async function addPersonalWords(input: unknown, fillFromBuiltIn = true) {
  const words = validateWords(input)
  if (fillFromBuiltIn) {
    let cursor = 0
    // Bound parallel reads; lookup reuses cached catalog shards and original dictionary files.
    await Promise.all(
      Array.from({ length: Math.min(8, words.length) }, async () => {
        while (cursor < words.length) {
          const index = cursor++
          const word = words[index]
          if (word.trans.length && word.usphone && word.ukphone) continue
          const original = await lookupBuiltInWord(word.name).catch(() => undefined)
          if (!original) continue
          words[index] = {
            ...word,
            trans: word.trans.length
              ? word.trans
              : Array.isArray(original.trans)
              ? original.trans.filter((t) => typeof t === 'string')
              : [],
            usphone: word.usphone || (typeof original.usphone === 'string' ? original.usphone : ''),
            ukphone: word.ukphone || (typeof original.ukphone === 'string' ? original.ukphone : ''),
          }
        }
      }),
    )
  }
  await db.transaction('rw', db.personalWords, async () => {
    let nextPosition = ((await db.personalWords.orderBy('position').last())?.position ?? -1) + 1
    for (const word of words) {
      const id = normalizeWord(word.name)
      const old = await db.personalWords.get(id)
      const entry: PersonalWord = { ...word, id, position: old?.position ?? nextPosition++, addedAt: old?.addedAt ?? Date.now() }
      await db.personalWords.put(entry)
    }
  })
}
export function parseWordText(text: string): Word[] {
  // One word/phrase per line, optional TAB-separated Chinese translation.
  return validateWords(
    text
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => {
        const [name, ...translation] = line.split('\t')
        return { name, trans: translation.join('\t').trim() ? [translation.join('\t').trim()] : [], usphone: '', ukphone: '' }
      }),
  )
}
