import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem('pronunciation', JSON.stringify({ isOpen: false, isTransRead: false }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
})

test('reading text can really be dragged, looked up and saved without advancing', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('cancel', { delay: 30 })
  await expect(page.getByTestId('word-usage')).toContainText('We need to cancel the meeting today.')
  await page
    .getByTestId('word-usage')
    .getByText('We need to cancel the meeting today.', { exact: false })
    .first()
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  await expect(page.getByTestId('etymology-panel')).toContainText('有来源支持')
  await page
    .getByTestId('word-usage')
    .getByText('We need to cancel the meeting today.', { exact: false })
    .first()
    .evaluate((element) => element.scrollIntoView({ block: 'center' }))
  const area = await page
    .getByTestId('word-usage')
    .getByText('We need to cancel the meeting today.', { exact: false })
    .first()
    .evaluate((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const start = node.textContent?.indexOf('meeting') ?? -1
        if (start >= 0) {
          const range = document.createRange()
          range.setStart(node, start)
          range.setEnd(node, start + 7)
          const rect = range.getBoundingClientRect()
          return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2, userSelect: getComputedStyle(element).userSelect }
        }
      }
      throw Error('missing text')
    })
  expect(area.userSelect).toBe('text')
  await page.mouse.move(area.left + 1, area.y)
  await page.mouse.down()
  await page.mouse.move(area.right - 1, area.y, { steps: 12 })
  await page.mouse.up()
  expect(await page.evaluate(() => getSelection()?.toString().trim())).toBe('meeting')
  const popup = page.getByTestId('selection-lookup')
  await expect(popup).toContainText('会议')
  await page.keyboard.press('Control+c')
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await popup.getByRole('button', { name: '收藏 meeting 到不熟词本', exact: true }).click()
  await expect(popup.getByRole('button', { name: '已收藏 meeting 到不熟词本', exact: true })).toBeDisabled()
  await popup.getByRole('button', { name: '关闭选词释义', exact: true }).click()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  await page.goto('/unfamiliar')
  await expect(page.getByRole('article', { name: 'meeting收藏词条', exact: true })).toContainText('会议')
})

test('selected phrases reuse displayed translations and unknown expressions accept manual meanings', async ({ page }) => {
  await page.goto('/farm')
  await page.getByLabel('搜索农场资料').fill('cold chain')
  const sentence = page.getByText('Check the cold chain records when the fruit arrives.', { exact: true })
  await expect(sentence).toBeVisible()
  await sentence.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
  })
  await expect(page.getByTestId('selection-lookup')).toContainText('果实到达时检查冷链记录')
  await page.getByRole('button', { name: '关闭选词释义', exact: true }).click()
  await page.getByLabel('搜索农场资料').fill('timesheet')
  const target = page.getByRole('heading', { name: 'timesheet', exact: true })
  await target.evaluate((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    document.dispatchEvent(new Event('selectionchange'))
  })
  await expect(page.getByTestId('selection-lookup')).toContainText('工时表')
  await page.getByTestId('selection-lookup').getByLabel('选词补充释义').fill('我常用的工时表')
  await page.getByTestId('selection-lookup').getByRole('button', { name: '收藏 timesheet 到不熟词本', exact: true }).click()
  await page.goto('/unfamiliar')
  await expect(page.getByRole('article', { name: 'timesheet收藏词条', exact: true })).toContainText('我常用的工时表')
})

test('farm material keeps all source sections and the user-confirmed profile', async ({ page, request }) => {
  const pack = await (await request.get('/data/farm-english/materials.json')).json()
  expect(pack.vocabulary).toHaveLength(160)
  expect(pack.sourceVocabularyCount).toBe(119)
  expect(pack.extensionVocabularyCount).toBe(41)
  expect(pack.sentences).toHaveLength(64)
  expect(pack.morphologyGuide).toHaveLength(15)
  expect(pack.profile.role).toBe('生产主管')
  expect(pack.profile.region).toBe('云南红河蒙自')
  expect(pack.profile.varietyCodes).toEqual(['L25', 'L29', 'L11', 'L36', 'L37'])
  await page.goto('/my-dictionary')
  await expect(page.getByRole('region', { name: '农场英语词库', exact: true })).toContainText('160 词')
  await page.getByRole('button', { name: '开始农场英语', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('timesheet')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('timesheet', { delay: 30 })
  await expect(page.getByTestId('word-usage')).toContainText('Please complete your timesheet before leaving.')
  await expect(page.getByText('农场资料笔记 · 工时管理', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '收藏 timesheet 到不熟词本', exact: true }).click()
  await page.goto('/unfamiliar')
  await expect(page.getByRole('article', { name: 'timesheet收藏词条', exact: true })).toContainText('农场英语')
})

test('the detailed progress table has honest milestone percentages and a downloadable workbook', async ({ page }) => {
  await page.goto('/progress')
  await expect(page.getByRole('heading', { name: '项目进度与未完成事项', exact: true })).toBeVisible()
  const fsrs = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'FSRS复习', exact: true }) })
  await expect(fsrs).toContainText('0%')
  await expect(fsrs).toContainText('显式评分与到期队列')
  await expect(page.getByRole('heading', { name: '真实资料覆盖率', exact: true })).toBeVisible()
  const pending = page.waitForEvent('download')
  await page.getByRole('link', { name: '下载详细进度表 Excel', exact: true }).click()
  expect((await pending).suggestedFilename()).toBe('project-progress.xlsx')
})
