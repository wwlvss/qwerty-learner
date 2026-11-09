import type { UsagePackage, UsageSource } from './types'
import { normalizeWord } from '@/features/etymology/types'
import { db } from '@/utils/db'

function text(value: unknown, max = 5000): asserts value is string {
  if (typeof value !== 'string' || value.length > max) throw new Error('短语或例句文本无效')
}
function validateSource(source: UsageSource) {
  if (!source || typeof source !== 'object') throw new Error('缺少来源')
  for (const value of [source.name, source.url, source.license]) {
    text(value)
    if (!value.trim()) throw new Error('来源及许可不得为空')
  }
  if (!['original', 'builtin', 'tatoeba', 'user'].includes(source.kind)) throw new Error('资料来源类型无效')
  if (source.kind === 'builtin' && /^\/dicts\/[^/]+\.json$/.test(source.url) && !source.url.includes('..')) return
  const url = new URL(source.url)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('来源必须使用无凭据的 HTTPS 链接')
}
export function validateUsagePackage(input: unknown): UsagePackage {
  const pack = input as UsagePackage
  if (!pack || pack.format !== 'qwerty-word-usage' || pack.version !== 1 || !Array.isArray(pack.entries) || pack.entries.length > 20000)
    throw new Error('用法数据包格式无效（每包最多 20000 词）')
  const ids = new Set<string>()
  for (const entry of pack.entries) {
    if (!entry || typeof entry !== 'object') throw new Error('词条无效')
    text(entry.normalizedWord, 120)
    if (!entry.normalizedWord.trim() || normalizeWord(entry.normalizedWord) !== entry.normalizedWord || ids.has(entry.normalizedWord))
      throw new Error('单词未规范化或重复')
    ids.add(entry.normalizedWord)
    if (!Array.isArray(entry.phrases) || !Array.isArray(entry.examples) || entry.phrases.length > 50 || entry.examples.length > 50)
      throw new Error('短语或例句列表无效')
    for (const phrase of entry.phrases) {
      if (!phrase || typeof phrase !== 'object') throw new Error('短语无效')
      if (phrase.context !== undefined) text(phrase.context, 80)
      text(phrase.text)
      text(phrase.translation)
      if (!phrase.text.trim()) throw new Error('短语不得为空')
      validateSource(phrase.source)
    }
    for (const example of entry.examples) {
      if (!example || typeof example !== 'object') throw new Error('例句无效')
      if (example.context !== undefined) text(example.context, 80)
      text(example.text)
      if (example.translation !== undefined) text(example.translation)
      const { targetStart: start, targetEnd: end } = example
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 0 ||
        end <= start ||
        end > example.text.length ||
        normalizeWord(example.text.slice(start, end)) !== entry.normalizedWord ||
        /[a-z]/i.test(example.text[start - 1] ?? '') ||
        /[a-z]/i.test(example.text[end] ?? '')
      )
        throw new Error('例句目标位置与完整单词不一致')
      validateSource(example.source)
    }
  }
  return pack
}
export async function importUsagePackage(input: unknown) {
  const pack = validateUsagePackage(input)
  await db.transaction('rw', db.wordUsageEntries, () => db.wordUsageEntries.bulkPut(pack.entries))
}
