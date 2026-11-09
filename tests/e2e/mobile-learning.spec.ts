import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem('pronunciation', JSON.stringify({ isOpen: false, isTransRead: false }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
})

test('old mobile entry opens the six personal dictionaries with only local learning navigation', async ({ page }) => {
  await page.goto('/mobile')
  await expect(page).toHaveURL(/\/my-dictionary$/)
  await expect(page.getByRole('button', { name: /^开始/ })).toHaveCount(6)
  await expect(page.getByRole('heading', { name: '工作英语', exact: true })).toBeVisible()
  await expect(page.locator('a[href*="qwerty.kaiyi.cool"]')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const logo = page.getByRole('link').filter({ has: page.getByAltText('Qwerty Learner Logo') })
  await logo.click()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByRole('link', { name: '打开我的词典', exact: true })).toBeVisible()
})

test('mobile users can reach saved words, roots and custom dictionaries directly without redirection', async ({ page }) => {
  await page.goto('/unfamiliar')
  await expect(page.getByRole('heading', { name: '不熟词本', exact: true })).toBeVisible()
  await page.getByText('添加不熟单词、易混词或短语', { exact: true }).click()
  await page.getByLabel('不熟单词或短语', { exact: true }).fill('nursery')
  await page.getByRole('button', { name: '添加到不熟词本', exact: true }).click()
  await expect(page.getByRole('article', { name: 'nursery收藏词条', exact: true })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(/\/unfamiliar$/)
  await expect(page.getByRole('article')).toHaveCount(1)
  for (const path of ['/roots', '/my-dictionary/custom']) {
    await page.goto(path)
    await expect(page.locator('a[href*="qwerty.kaiyi.cool"]')).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(path + '$'))
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})

test('mobile keyboard practice reuses the typing flow and resizing preserves the current route', async ({ page }) => {
  const alerts: string[] = []
  page.on('dialog', async (dialog) => {
    alerts.push(dialog.message())
    await dialog.dismiss()
  })
  await page.goto('/my-dictionary')
  await page.getByRole('button', { name: '开始日常英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('hello')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('hello', { delay: 40 })
  await expect(page.getByTestId('word-definitions')).toBeVisible()
  await expect(page.getByTestId('typing-word')).toHaveText('hello')
  await page.getByRole('button', { name: '下一个词', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('please')
  expect(alerts).toEqual([])
  await page.goto('/unfamiliar')
  await page.setViewportSize({ width: 1024, height: 768 })
  await expect(page).toHaveURL(/\/unfamiliar$/)
  await expect(page.getByRole('heading', { name: '不熟词本', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page).toHaveURL(/\/unfamiliar$/)
})

test('long phrases wrap on phones and settings stay within the viewport', async ({ page }) => {
  await page.goto('/unfamiliar')
  await page.getByText('添加不熟单词、易混词或短语', { exact: true }).click()
  await page.getByLabel('不熟单词或短语', { exact: true }).fill('integrated pest management')
  await page.getByRole('button', { name: '添加到不熟词本', exact: true }).click()
  await page.getByRole('button', { name: '练习不熟词本', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByTitle('打开设置对话框', { exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const bounds = await dialog.boundingBox()
  expect(bounds!.width).toBeLessThanOrEqual(390)
  await page.getByRole('checkbox', { name: '答对后显示例句', exact: false }).uncheck()
  await page.getByTitle('关闭对话框', { exact: true }).click()
  await expect(dialog).toHaveCount(0)
})
