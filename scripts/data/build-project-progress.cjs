const fs = require('node:fs')
const path = require('node:path')
const XLSX = require('xlsx')
const root = path.resolve(__dirname, '../..')
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'project-milestones.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/data/word-support/manifest.json'), 'utf8'))
const items = source.items.map((item) => ({
  ...item,
  percent: item.milestones.filter((step) => step.done).length * 20,
  completed: item.milestones.filter((step) => step.done).map((step) => step.label),
  remaining: item.milestones.filter((step) => !step.done).map((step) => step.label),
}))
const total = manifest.uniqueEntries
const coverage = [
  ['原词库中文释义', manifest.definitionEntries],
  ['短语资料', manifest.phraseEntries],
  ['例句资料', manifest.exampleEntries],
  ['可靠历史词源', manifest.etymologyEntries],
  ['近义表达教学资料', manifest.synonymEntries || 0],
].map(([name, count]) => ({ name, count, total, percent: Number(((count / total) * 100).toFixed(3)) }))
const data = { method: source.method, items, coverage, inventory: manifest }
fs.writeFileSync(path.join(root, 'public/data/project-progress.json'), JSON.stringify(data, null, 2) + '\n')
const book = XLSX.utils.book_new()
const summary = XLSX.utils.json_to_sheet(
  items.map((item) => ({
    模块: item.name,
    完成度: item.percent / 100,
    优先级: item.priority,
    已完成: item.completed.join('；') || '尚无可用功能',
    待完成: item.remaining.join('；') || '本轮定义范围已交付',
    证据路径: item.evidence,
  })),
)
items.forEach((_, index) => {
  summary[`B${index + 2}`].z = '0%'
})
summary['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 10 }, { wch: 70 }, { wch: 70 }, { wch: 55 }]
XLSX.utils.book_append_sheet(book, summary, '功能进度')
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.json_to_sheet(
    coverage.map((row) => ({ 资料类型: row.name, 有资料的不同词条: row.count, 总词条: row.total, 覆盖率百分比: row.percent })),
  ),
  '真实数据覆盖',
)
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.json_to_sheet(
    items.flatMap((item) => item.milestones.map((step) => ({ 模块: item.name, 里程碑: step.label, 已完成: step.done ? '是' : '否' }))),
  ),
  '里程碑明细',
)
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.aoa_to_sheet([
    ['说明', source.method],
    ['边界', '百分比是范围内的交付估算，不能理解为全词库已有完整资料；构词记忆提示不等于已核实历史词源。'],
    ['隐私', '现有Google/Mixpanel/Vercel统计尚未统一关闭；划词本地查询不调用外部翻译API。'],
  ]),
  '口径说明',
)
XLSX.writeFile(book, path.join(root, 'public/data/project-progress.xlsx'))
const header = '# 当前功能进度与完成率\n\n' + source.method + '\n\n| 模块 | 完成率 | 已完成 | 待完成 |\n|---|---:|---|---|\n'
const table = items
  .map(
    (item) =>
      `| ${item.name} | ${item.percent}% | ${item.completed.join('；') || '尚未实现'} | ${item.remaining.join('；') || '本轮范围已交付'} |`,
  )
  .join('\n')
fs.writeFileSync(
  path.join(root, 'docs/personal-learning/current-progress.md'),
  header +
    table +
    '\n\n资料覆盖率以实际生成数据为准：\n\n| 资料 | 已覆盖 / 总词条 | 覆盖率 |\n|---|---:|---:|\n' +
    coverage.map((row) => `| ${row.name} | ${row.count} / ${row.total} | ${row.percent}% |`).join('\n') +
    '\n',
)
console.log(JSON.stringify({ modules: items.length, coverage }))

const handoff = path.join(root, 'docs/personal-learning/LOCAL_CODEX_HANDOFF.md')
if (fs.existsSync(handoff)) fs.copyFileSync(handoff, path.join(root, 'public/data/local-codex-handoff.md'))
