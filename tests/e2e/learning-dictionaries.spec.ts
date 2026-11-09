import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem('pronunciation', JSON.stringify({ isOpen: false, isTransRead: false }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
  await page.goto('/my-dictionary')
})

test('six dictionaries have separate cards and real chapter counts', async ({ page }) => {
  for (const [name, count] of [
    ['工作英语', '60 词'],
    ['农业专业英语', '80 词'],
    ['日常英语', '40 词'],
    ['商务英语', '40 词'],
    ['CET-6', '2345 词'],
    ['IELTS', '3575 词'],
  ]) {
    await expect(page.getByRole('region', { name: `${name}词库`, exact: true })).toContainText(count)
  }
  await expect(page.getByRole('button', { name: /^开始/ })).toHaveCount(6)
  await expect(page.getByRole('link', { name: '管理自定义词典' })).toBeVisible()
})

test('work and agriculture retain independent chapters and record dictionary IDs', async ({ page }) => {
  await page.getByRole('button', { name: '开始工作英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('schedule')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('schedule')
  await expect(page.getByTestId('word-usage')).toContainText('update the schedule')
  await expect(page.getByTestId('typing-word')).toHaveText('schedule')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('typing-word')).toHaveText('task')
  await page.goto('/my-dictionary')
  await expect(page.getByRole('region', { name: '工作英语词库', exact: true })).toContainText('逐词练习记录 1 次')
  await page.getByLabel('农业专业英语章节').selectOption('2')
  await page.getByRole('button', { name: '开始农业专业英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('irrigation')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('irrigation')
  await expect(page.getByTestId('word-usage')).toContainText('irrigation schedule')
  await page.goto('/my-dictionary')
  await page.reload()
  await expect(page.getByLabel('农业专业英语章节')).toHaveValue('2')
  await expect(page.getByLabel('工作英语章节')).toHaveValue('0')
  await expect(page.getByRole('region', { name: '农业专业英语词库', exact: true })).toContainText('逐词练习记录 1 次')
  const ids = await page.evaluate(async () => {
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    return (await db.wordRecords.toArray()).map((record: { dict: string }) => record.dict)
  })
  expect(ids.sort()).toEqual(['agriculture-english', 'work-english'])
  await page.getByRole('button', { name: '开始工作英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('schedule')
})

test('business shared vocabulary prioritizes the business example', async ({ page }) => {
  await page.getByRole('button', { name: '开始商务英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('meeting')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('meeting')
  await expect(page.getByTestId('word-usage').locator('mark').first().locator('..')).toHaveText(
    'The business meeting will focus on the contract.',
  )
})

test('existing exam dictionaries reuse original content and IDs', async ({ page, request }) => {
  for (const [name, id, file] of [
    ['CET-6', 'cet6', 'CET6_T.json'],
    ['IELTS', 'ielts', 'IELTS_3_T.json'],
  ]) {
    const words = await (await request.get(`/dicts/${file}`)).json()
    await page.getByRole('button', { name: `开始${name}`, exact: true }).click()
    await expect(page.getByTestId('typing-word')).toHaveText(words[0].name)
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('currentDict')!))).toBe(id)
    await page.goto('/my-dictionary')
  }
})
