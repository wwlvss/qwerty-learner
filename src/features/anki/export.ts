import { getDictionaryMeanings, getWordUsage } from '@/features/word-support/repository'
import { idDictionaryMap } from '@/resources/dictionary'
import type { Word } from '@/typings'
import { saveAs } from 'file-saver'

type ExportWord = Word & { note?: string; kind?: string; sourceDicts?: string[] }
const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r\n|\r|\n/g, '<br>')
    .replace(/\t/g, ' ')
const list = (label: string, entries: string[]) =>
  entries.length ? `<h3>${label}</h3><ul>${entries.map((entry) => `<li>${entry}</li>`).join('')}</ul>` : ''

export async function buildAnkiTsv(words: ExportWord[], dictionaryId: string): Promise<string> {
  const rows: string[] = new Array(words.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(4, words.length) }, async () => {
      while (cursor < words.length) {
        const index = cursor++
        const word = words[index]
        const [meanings, usage] = await Promise.all([
          getDictionaryMeanings(word.name).catch(() => []),
          getWordUsage(word.name).catch(() => undefined),
        ])
        const definitions = Array.from(new Set([...word.trans, ...meanings.map((entry) => entry.text)]))
        const sourceNames = Array.from(
          new Set([...(word.sourceDicts ?? [dictionaryId]), ...meanings.flatMap((entry) => entry.sources)]),
        ).map((id) => idDictionaryMap[id]?.name ?? (id === 'manual' ? '手动添加' : id))
        const phonetics = [word.ukphone ? `英 /${escape(word.ukphone)}/` : '', word.usphone ? `美 /${escape(word.usphone)}/` : '']
          .filter(Boolean)
          .join(' · ')
        const contexts = word.sourceDicts ?? [dictionaryId]
        const prioritize = <T extends { text: string; context?: string }>(entries: T[]) => {
          const seen = new Set<string>()
          return [...entries]
            .sort((a, b) => Number(contexts.includes(b.context ?? '')) - Number(contexts.includes(a.context ?? '')))
            .filter((entry) => {
              if (seen.has(entry.text)) return false
              seen.add(entry.text)
              return true
            })
        }
        const source = (item: { name: string; url: string; license: string }) =>
          `<small>来源：${escape(item.name)} · ${escape(item.url)} · ${escape(item.license)}</small>`
        const back = [
          phonetics ? `<p>${phonetics}</p>` : '',
          list('场景重点', (word.contextTrans ?? []).map(escape)),
          list('词典释义', definitions.map(escape)),
          list(
            '短语',
            prioritize(usage?.phrases ?? []).map(
              (phrase) => `${escape(phrase.text)} — ${escape(phrase.translation)}<br>${source(phrase.source)}`,
            ),
          ),
          list(
            '例句',
            prioritize(usage?.examples ?? []).map(
              (example) =>
                `${escape(example.text)}${example.translation ? '<br>' + escape(example.translation) : ''}<br>${source(example.source)}`,
            ),
          ),
          word.note ? `<h3>个人备注</h3><p>${escape(word.note)}</p>` : '',
          `<p><small>词库来源：${sourceNames.map(escape).join('、')}。释义沿用原词库资料说明。</small></p>`,
        ].join('')
        const tags = [
          'qwerty',
          `dict_${dictionaryId}`,
          ...(word.sourceDicts ?? []).map((id) => `source_${id}`),
          ...(word.kind ? [`kind_${word.kind}`] : []),
        ]
          .map((tag) => tag.replace(/[^a-z0-9_-]/gi, '_'))
          .join(' ')
        rows[index] = [escape(word.name), back, tags].join('\t')
      }
    }),
  )
  return ['#separator:tab', '#html:true', '#tags column:3', '#columns:Front\tBack\tTags', ...rows].join('\n') + '\n'
}
export async function downloadAnkiTsv(words: ExportWord[], dictionaryId: string) {
  const content = await buildAnkiTsv(words, dictionaryId)
  saveAs(new Blob([content], { type: 'text/tab-separated-values;charset=utf-8' }), `qwerty-${dictionaryId}-anki.tsv`)
}
