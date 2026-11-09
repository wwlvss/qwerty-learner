import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem('pronunciation', JSON.stringify({ isOpen: false, isTransRead: false }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
})

test('dictation hides phrase translations before completion, including chapter-list and hover hints', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('wordDictationConfig', JSON.stringify({ isOpen: true, type: 'hideAll', openBy: 'user' })),
  )
  await page.goto('/unfamiliar')
  await page.evaluate(async () => {
    const { saveUnfamiliarWord } = await new Function('return import("/src/features/unfamiliar-words/repository.ts")')()
    await saveUnfamiliarWord({ name: 'take care of', trans: ['照顾；照料'], usphone: '', ukphone: '' }, 'daily-english')
  })
  await page.getByRole('button', { name: '练习不熟词本', exact: true }).click()
  await expect(page.getByText('照顾；照料', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '查看本章词表', exact: true }).click()
  await expect(page.getByText('默写中隐藏中文译文', { exact: true })).toBeVisible()
  await expect(page.getByText('照顾；照料', { exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.down('Tab')
  await expect(page.getByText('照顾；照料', { exact: true })).toHaveCount(0)
  await page.keyboard.up('Tab')
  await page.keyboard.type('take care of', { delay: 30 })
  await expect(page.getByTestId('word-definitions')).toContainText('照顾')
  await expect(page.getByTestId('typing-word')).toHaveText('take␣care␣of')
})

test('Anki TSV downloads contain three escaped fields, broad definitions, usage and personal notes', async ({ page }) => {
  await page.goto('/unfamiliar')
  await page.evaluate(async () => {
    const { saveUnfamiliarWord } = await new Function('return import("/src/features/unfamiliar-words/repository.ts")')()
    await saveUnfamiliarWord(
      { name: 'nursery', trans: ['育苗场；苗圃'], contextTrans: ['育苗场；苗圃'], usphone: '', ukphone: '' },
      'agriculture-english',
      { kind: 'confusable', note: '<script>alert(1)</script>\t第一行\n第二行' },
    )
  })
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 Anki TSV', exact: true }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('qwerty-unfamiliar-anki.tsv')
  const stream = await download.createReadStream()
  const buffers: Buffer[] = []
  for await (const buffer of stream!) buffers.push(Buffer.from(buffer))
  const content = Buffer.concat(buffers).toString('utf8')
  expect(content).toContain('#html:true')
  expect(content).toContain('#tags column:3')
  const rows = content
    .trimEnd()
    .split('\n')
    .filter((row) => !row.startsWith('#'))
  expect(rows).toHaveLength(1)
  const fields = rows[0].split('\t')
  expect(fields).toHaveLength(3)
  expect(fields[0]).toBe('nursery')
  expect(fields[1]).toContain('托儿所')
  expect(fields[1]).toContain('育婴室')
  expect(fields[1]).toContain('a plant nursery')
  expect(fields[1]).toContain('The nursery produces young vegetable plants.')
  expect(fields[1]).toContain('&lt;script&gt;')
  expect(fields[1]).not.toContain('<script>')
  expect(fields[1]).toContain('第一行<br>第二行')
  expect(fields[2]).toContain('source_agriculture-english')
  expect(fields[2]).toContain('kind_confusable')
})

test('all six study dictionaries provide Anki export and a real topic export works', async ({ page }) => {
  await page.goto('/my-dictionary')
  await expect(page.getByRole('button', { name: /^导出.* Anki$/ })).toHaveCount(6)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出工作英语 Anki', exact: true }).click()
  const stream = await (await downloadPromise).createReadStream()
  const buffers: Buffer[] = []
  for await (const buffer of stream!) buffers.push(Buffer.from(buffer))
  const rows = Buffer.concat(buffers)
    .toString('utf8')
    .trimEnd()
    .split('\n')
    .filter((row) => !row.startsWith('#'))
  expect(rows).toHaveLength(120)
  expect(rows.every((row) => row.split('\t').length === 3)).toBe(true)
  await page.goto('/my-dictionary/custom')
  await expect(page.getByRole('button', { name: '导出 Anki TSV', exact: true })).toBeDisabled()
})
