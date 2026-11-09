import { validatePackage } from './packages'
import type { EtymologyPackage } from './types'
import { db } from '@/utils/db'

const personalTables = ['rootFavorites', 'rootLearningStates', 'rootLearningEvents', 'etymologyViews', 'etymologySettings'] as const
export async function exportEtymologyBackup() {
  return db.transaction(
    'r',
    [db.etymologyEntries, db.roots, db.rootWordRelations, ...personalTables.map((name) => db.table(name))],
    async () => ({
      format: 'qwerty-etymology-backup',
      version: 1,
      data: {
        format: 'qwerty-etymology',
        version: 1,
        id: 'personal-backup',
        entries: await db.etymologyEntries.toArray(),
        roots: await db.roots.toArray(),
        relations: await db.rootWordRelations.toArray(),
      },
      personal: Object.fromEntries(await Promise.all(personalTables.map(async (name) => [name, await db.table(name).toArray()]))),
    }),
  )
}

function validTime(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}
export async function restoreEtymologyBackup(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('备份无效')
  const backup = value as {
    format?: string
    version?: number
    data?: EtymologyPackage
    personal?: Record<string, Record<string, unknown>[]>
  }
  if (backup.format !== 'qwerty-etymology-backup' || backup.version !== 1 || !backup.personal || typeof backup.personal !== 'object')
    throw new Error('备份格式或版本无效')
  const pack = validatePackage(backup.data)
  const rootIds = new Set(pack.roots.map((r) => r.id))
  for (const name of personalTables) {
    const rows = backup.personal[name]
    if (!Array.isArray(rows) || rows.length > 100000) throw new Error('个人记录列表无效')
    for (const record of rows) {
      if (!record || typeof record !== 'object') throw new Error('个人记录无效')
      if (name.startsWith('root') && !rootIds.has(record.rootId as string)) throw new Error('个人记录指向未知词根')
      if (name === 'rootFavorites' && !validTime(record.createdAt)) throw new Error('收藏时间无效')
      if (
        name === 'rootLearningStates' &&
        (!validTime(record.firstViewedAt) ||
          !validTime(record.lastViewedAt) ||
          !Number.isInteger(record.viewCount) ||
          (record.viewCount as number) < 1 ||
          !['viewed', 'mastered', 'review'].includes(record.status as string) ||
          !Array.isArray(record.learnedThroughWords) ||
          record.learnedThroughWords.some((w) => typeof w !== 'string'))
      )
        throw new Error('学习状态无效')
      if (
        name === 'rootLearningEvents' &&
        (!Number.isInteger(record.id) || (record.id as number) < 1 || !validTime(record.viewedAt) || typeof record.word !== 'string')
      )
        throw new Error('学习历史无效')
      if (
        name === 'etymologyViews' &&
        (typeof record.normalizedWord !== 'string' ||
          (record.firstCorrectShownAt !== undefined && !validTime(record.firstCorrectShownAt)) ||
          !validTime(record.firstViewedAt) ||
          !validTime(record.lastViewedAt) ||
          !Number.isInteger(record.viewCount) ||
          (record.viewCount as number) < 1)
      )
        throw new Error('查看记录无效')
      if (name === 'etymologySettings' && (record.key !== 'displayMode' || !['auto', 'first', 'off'].includes(record.value as string)))
        throw new Error('显示设置无效')
    }
  }
  const personal = backup.personal
  // Restore only the morphology feature, atomically. Never clear or import practice/SRS tables.
  await db.transaction(
    'rw',
    [db.etymologyEntries, db.roots, db.rootWordRelations, ...personalTables.map((name) => db.table(name))],
    async () => {
      await db.etymologyEntries.bulkPut(pack.entries)
      await db.roots.bulkPut(pack.roots)
      await db.rootWordRelations.bulkPut(pack.relations)
      for (const name of personalTables) {
        await db.table(name).clear()
        await db.table(name).bulkPut(personal[name])
      }
    },
  )
}
