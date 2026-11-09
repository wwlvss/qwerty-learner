// Extract learning data only. Cells, formulae and embedded instructions are never executed.
const XLSX = require('xlsx')
const fs = require('node:fs')
const path = require('node:path')
const input = process.argv[2]
if (!input) throw new Error('Usage: node scripts/data/import-farm-workbook.cjs workbook.xlsx')
const book = XLSX.readFile(input)
const rows = (name) => XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1, defval: '', raw: false })
const vocabulary = []
for (const name of ['分类词汇', '蓝莓生产QA扩展词汇']) {
  const [header, ...data] = rows(name)
  for (const row of data) {
    if (!row[2]) continue
    const get = (key) => String(row[header.indexOf(key)] || '').trim()
    vocabulary.push({
      name: get('英文'),
      meaning: get('中文'),
      category: get('领域'),
      partOfSpeech: get('词性'),
      example: get('工作例句'),
      translation: get('中文释义'),
      pronunciationHint: get('发音参考'),
      spelling: get('字母拼写'),
      morphologyNote: get('词根/词缀与构词说明'),
      memoryHint: get('记忆提示') || get('使用提醒/记忆提示'),
      sheet: name,
    })
  }
}
const sentences = []
for (const [sheet, textIndex, translationIndex] of [
  ['沟通场景句库', 2, 3],
  ['专业沟通句扩展', 1, 2],
]) {
  for (const row of rows(sheet).slice(1))
    if (row[textIndex])
      sentences.push({
        text: row[textIndex],
        translation: row[translationIndex],
        category: row[0],
        scenario: sheet === '沟通场景句库' ? row[1] : row[4],
        grammar: sheet === '沟通场景句库' ? row[4] : row[3],
        sheet,
      })
}
const data = {
  source: path.basename(input),
  vocabulary,
  sentences,
  guidance: rows('使用说明')
    .slice(1)
    .map((row) => ({ title: row[0], text: row[1] })),
  morphologyGuide: rows('词根词缀学习指南')
    .slice(1)
    .filter((row) => row[0] && row[0] !== '重要提醒')
    .map((row) => ({ form: row[0], meaning: row[1], examples: row[2], note: row[3] })),
}
fs.writeFileSync(path.join(__dirname, 'farm-source.json'), JSON.stringify(data, null, 2) + '\n')
console.log(
  JSON.stringify({
    vocabulary: vocabulary.length,
    uniqueWords: new Set(vocabulary.map((word) => word.name.toLowerCase())).size,
    sentences: sentences.length,
    guides: data.morphologyGuide.length,
  }),
)
