import { validatePackage } from './packages'
import type { DisplayMode, EtymologyEntry, EtymologyPackage, RootLearningState } from './types'
import { normalizeWord } from './types'
import { db } from '@/utils/db'

let initialization: Promise<void> | undefined
export function ensureEtymologyData(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      if (await db.etymologyPackages.get('webster-reviewed-demo-v1')) return
      // Match the existing dictionary/router deployment prefix; a relative './'
      // build base would otherwise resolve inside /roots/:id on direct loads.
      const prefix = REACT_APP_DEPLOY_ENV === 'pages' ? '/qwerty-learner' : ''
      const url = `${prefix}/data/etymology/starter.json`
      const response = await fetch(url)
      if (!response.ok) throw new Error('初始词源数据读取失败，可在词根库重新加载或导入数据包')
      const pack = validatePackage(await response.json())
      await importEtymologyPackage(pack, true)
    })().catch((error) => {
      initialization = undefined
      throw error
    })
  }
  return initialization
}

export async function importEtymologyPackage(pack: EtymologyPackage, onlyMissing = false) {
  const checked = validatePackage(pack)
  await db.transaction('rw', [db.etymologyEntries, db.roots, db.rootWordRelations, db.etymologyPackages], async () => {
    for (const root of checked.roots) {
      if (!onlyMissing || !(await db.roots.get(root.id))) await db.roots.put(root)
    }
    for (const entry of checked.entries) {
      if (!onlyMissing || !(await db.etymologyEntries.get(entry.id))) await db.etymologyEntries.put(entry)
    }
    for (const relation of checked.relations) {
      if (!onlyMissing || !(await db.rootWordRelations.get(relation.id))) await db.rootWordRelations.put(relation)
    }
    await db.etymologyPackages.put({ id: checked.id, importedAt: Date.now() })
  })
}

export async function getEtymologyEntry(word: string): Promise<EtymologyEntry | undefined> {
  // Read imported data first: a missing seed/network must never hide an available local entry.
  const normalized = normalizeWord(word)
  const local = await db.etymologyEntries.where('normalizedWord').equals(normalized).first()
  if (local) return local
  await ensureEtymologyData()
  return db.etymologyEntries.where('normalizedWord').equals(normalized).first()
}

export async function getDisplayMode(): Promise<DisplayMode> {
  return (await db.etymologySettings.get('displayMode'))?.value ?? 'first'
}
export async function setDisplayMode(value: DisplayMode) {
  await db.etymologySettings.put({ key: 'displayMode', value })
}

export async function shouldShowEtymology(word: string) {
  const mode = await getDisplayMode()
  if (mode === 'off') return false
  return mode === 'auto' || !(await db.etymologyViews.get(normalizeWord(word)))?.firstCorrectShownAt
}

// This service intentionally has no practice-record or scheduling side effects.
export async function recordEntryView(entry: EtymologyEntry, fromCorrect = false) {
  const now = Date.now()
  await db.transaction('rw', [db.etymologyViews, db.rootWordRelations, db.rootLearningStates, db.rootLearningEvents], async () => {
    const old = await db.etymologyViews.get(entry.normalizedWord)
    await db.etymologyViews.put({
      normalizedWord: entry.normalizedWord,
      firstViewedAt: old?.firstViewedAt ?? now,
      lastViewedAt: now,
      viewCount: (old?.viewCount ?? 0) + 1,
      firstCorrectShownAt: old?.firstCorrectShownAt ?? (fromCorrect ? now : undefined),
    })
    const relations = await db.rootWordRelations.where('normalizedWord').equals(entry.normalizedWord).toArray()
    const rootIds = Array.from(
      new Set(relations.filter((r) => r.relationType !== 'related_meaning' && r.verificationStatus === 'verified').map((r) => r.rootId)),
    )
    for (const rootId of rootIds) await recordRootViewInTransaction(rootId, entry.normalizedWord, now)
  })
}
async function recordRootViewInTransaction(rootId: string, word: string, now: number) {
  const old = await db.rootLearningStates.get(rootId)
  await db.rootLearningStates.put({
    rootId,
    firstViewedAt: old?.firstViewedAt ?? now,
    lastViewedAt: now,
    viewCount: (old?.viewCount ?? 0) + 1,
    status: old?.status ?? 'viewed',
    learnedThroughWords: Array.from(new Set([...(old?.learnedThroughWords ?? []), ...(word ? [word] : [])])),
  })
  await db.rootLearningEvents.add({ rootId, word, viewedAt: now })
}
export async function recordRootView(rootId: string) {
  await db.transaction('rw', [db.rootLearningStates, db.rootLearningEvents], () => recordRootViewInTransaction(rootId, '', Date.now()))
}
export async function setRootStatus(rootId: string, status: RootLearningState['status']) {
  await db.transaction('rw', [db.rootLearningStates, db.rootLearningEvents], async () => {
    if (!(await db.rootLearningStates.get(rootId))) await recordRootViewInTransaction(rootId, '', Date.now())
    await db.rootLearningStates.update(rootId, { status })
  })
}
export async function toggleRootFavorite(rootId: string) {
  await db.transaction('rw', db.rootFavorites, async () => {
    if (await db.rootFavorites.get(rootId)) await db.rootFavorites.delete(rootId)
    else await db.rootFavorites.put({ rootId, createdAt: Date.now() })
  })
}
