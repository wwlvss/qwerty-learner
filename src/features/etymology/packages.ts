import type { EtymologyPackage, Source } from './types'
import { normalizeWord } from './types'

type Row = Record<string, unknown>
function row(value: unknown): asserts value is Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('数据项必须是对象')
}
function string(value: unknown): asserts value is string {
  if (typeof value !== 'string' || value.length > 20000) throw new Error('文本字段无效或过长')
}
function strings(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('文本列表无效')
  value.forEach(string)
}
function sources(value: unknown): asserts value is Source[] {
  if (!Array.isArray(value) || !value.length || value.length > 30) throw new Error('每项资料必须包含来源')
  for (const source of value) {
    row(source)
    for (const key of ['name', 'url', 'license', 'originalEntry', 'evidence']) {
      string(source[key])
      if (!(source[key] as string).trim()) throw new Error('来源、许可和证据不得为空')
    }
    const url = new URL(source.url as string)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('来源网址必须是无凭据的 HTTPS 地址')
    status(source.verificationStatus)
  }
}
function status(value: unknown) {
  if (value !== 'verified' && value !== 'pending') throw new Error('核实状态无效')
}
function evidence(item: Row) {
  status(item.verificationStatus)
  sources(item.sources)
  if (typeof item.confidence !== 'number' || !Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) {
    throw new Error('可信度必须是 0–1 的数字')
  }
  if (item.verificationStatus === 'verified' && item.sources.some((s) => s.verificationStatus !== 'verified')) {
    throw new Error('已核实资料不能仅引用待核实来源')
  }
}
function unique(items: Row[], key: string) {
  const keys = items.map((r) => r[key])
  if (new Set(keys).size !== keys.length) throw new Error(`数据包含重复的 ${key}`)
}

// Importing a package never executes code, renders HTML, fetches URLs, or touches practice/SRS tables.
export function validatePackage(value: unknown): EtymologyPackage {
  row(value)
  if (value.format !== 'qwerty-etymology' || value.version !== 1) throw new Error('不支持的词源数据包格式或版本')
  string(value.id)
  if (!value.id) throw new Error('缺少数据包 ID')
  for (const key of ['entries', 'roots', 'relations']) {
    const list = value[key]
    if (!Array.isArray(list) || list.length > 10000) throw new Error('数据包列表无效或过大')
    list.forEach(row)
    unique(list, 'id')
    for (const item of list) {
      string(item.id)
      if (!item.id) throw new Error('ID 不得为空')
    }
  }
  const entries = value.entries as Row[]
  const roots = value.roots as Row[]
  const relations = value.relations as Row[]
  unique(entries, 'normalizedWord')
  for (const entry of entries) {
    for (const key of [
      'wordId',
      'normalizedWord',
      'morphologyNote',
      'originLanguage',
      'originalForm',
      'originalMeaning',
      'etymologyExplanation',
      'memoryTip',
      'updatedAt',
    ])
      string(entry[key])
    if (!entry.normalizedWord || normalizeWord(entry.normalizedWord as string) !== entry.normalizedWord) throw new Error('单词必须规范化')
    if (entry.wordId !== `en:${entry.normalizedWord}` || entry.id !== entry.wordId) throw new Error('词条 ID 必须为 en:单词')
    if (!Number.isFinite(Date.parse(entry.updatedAt as string))) throw new Error('更新时间无效')
    strings(entry.historicalEvolution)
    evidence(entry)
    if (!Array.isArray(entry.morphologicalAnalysis) || entry.morphologicalAnalysis.length > 30) throw new Error('构词分析无效')
    let lastEnd = 0
    for (const part of entry.morphologicalAnalysis) {
      row(part)
      string(part.text)
      string(part.meaning)
      if (!['prefix', 'root', 'suffix', 'stem', 'inflection'].includes(part.kind as string)) throw new Error('语素类型无效')
      if (
        !Number.isInteger(part.start) ||
        !Number.isInteger(part.end) ||
        (part.start as number) < lastEnd ||
        (part.end as number) <= (part.start as number) ||
        (part.end as number) > (entry.normalizedWord as string).length
      )
        throw new Error('构词位置重叠或超出单词范围')
      if ((entry.normalizedWord as string).slice(part.start as number, part.end as number) !== part.text)
        throw new Error('构词高亮与拼写不一致')
      if (part.rootId !== undefined && !roots.some((r) => r.id === part.rootId)) throw new Error('构词指向未知词根')
      lastEnd = part.end as number
    }
  }
  for (const root of roots) {
    for (const key of ['root', 'language', 'meaning', 'originalForm', 'explanation']) string(root[key])
    strings(root.relatedRootIds)
    if (root.relatedRootIds.some((id) => !roots.some((r) => r.id === id))) throw new Error('关联词根不存在')
    evidence(root)
  }
  for (const rel of relations) {
    for (const key of ['rootId', 'wordId', 'normalizedWord', 'explanation']) string(rel[key])
    if (!roots.some((r) => r.id === rel.rootId) || !entries.some((e) => e.wordId === rel.wordId && e.normalizedWord === rel.normalizedWord))
      throw new Error('关系引用的词根或词条不存在')
    if (!['cognate', 'shared_root', 'related_meaning'].includes(rel.relationType as string)) throw new Error('关系类型无效')
    sources(rel.sources)
    status(rel.verificationStatus)
    if (rel.verificationStatus === 'verified' && rel.sources.some((s) => s.verificationStatus !== 'verified'))
      throw new Error('关系来源尚未核实')
  }
  unique(relations, 'id')
  return value as unknown as EtymologyPackage
}

export async function readJsonFile(file: File, maxMB = 5): Promise<unknown> {
  if (file.size > maxMB * 1024 * 1024) throw new Error(`文件超过 ${maxMB} MB，请拆分数据包或使用完整数据库备份`)
  return JSON.parse(await file.text()) as unknown
}

export function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
