import { expect, test } from '@playwright/test'

function wave() {
  const length = 8000 * 4
  const buffer = Buffer.alloc(44 + length * 2)
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(8000, 24)
  buffer.writeUInt32LE(16000, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(length * 2, 40)
  for (let index = 0; index < length; index++)
    buffer.writeInt16LE(Math.round(Math.sin((index * 2 * Math.PI * 220) / 8000) * 1000), 44 + index * 2)
  return buffer
}

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript((audio) => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    if (!localStorage.getItem('pronunciation'))
      localStorage.setItem('pronunciation', JSON.stringify({ isOpen: audio, isTransRead: false, isLoop: audio, rate: 1, type: 'us' }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  }, info.title.startsWith('actual audio'))
})

test('near synonyms explain differences and can be collected independently', async ({ page }) => {
  await page.goto('/my-dictionary')
  await page.getByLabel('工作英语章节').selectOption('3')
  await page.getByRole('button', { name: '开始工作英语', exact: true }).click()
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('training', { delay: 25 })
  const panel = page.getByTestId('word-synonyms')
  await expect(panel).toContainText('instruction')
  await expect(panel).toContainText('coaching')
  await expect(panel).toContainText('不能在所有句子中互换')
  await panel.getByRole('button', { name: '收藏 coaching 到不熟词本', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('training')
  await page.goto('/unfamiliar')
  await expect(page.getByRole('article', { name: 'coaching收藏词条', exact: true })).toContainText('辅导')
})

test('phonetic transcription stays visible without the AmE and BrE prefix', async ({ page }) => {
  await page.goto('/')
  const phonetic = page.getByTestId('word-phonetic')
  await expect(phonetic).toContainText('[')
  await expect(phonetic).not.toContainText('AmE')
  await expect(phonetic).not.toContainText('BrE')
})

test('actual audio playbackRate changes on the loaded player and persists across reload', async ({ page }) => {
  await page.route('https://dict.youdao.com/**', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: wave(), headers: { 'Access-Control-Allow-Origin': '*' } }),
  )
  await page.addInitScript(() => {
    const state = window as unknown as { __rateNodes: HTMLMediaElement[] }
    state.__rateNodes = []
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate')!
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      configurable: true,
      get: descriptor.get,
      set(value) {
        if (!state.__rateNodes.includes(this)) state.__rateNodes.push(this)
        descriptor.set!.call(this, value)
      },
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  const currentRate = (rate: number) =>
    page.evaluate(
      (rate) =>
        (window as unknown as { __rateNodes: HTMLMediaElement[] }).__rateNodes.some(
          (node) => node.src.includes('dict.youdao.com') && Math.abs(node.playbackRate - rate) < 0.001,
        ),
      rate,
    )
  await expect.poll(() => currentRate(1)).toBe(true)
  await page.getByTitle('打开设置对话框', { exact: true }).click()
  await page.getByLabel('播放语速', { exact: true }).selectOption('0.5')
  await expect.poll(() => currentRate(0.5)).toBe(true)
  await page.getByLabel('播放语速', { exact: true }).selectOption('2')
  await expect.poll(() => currentRate(2)).toBe(true)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pronunciation')!).rate)).toBe(2)
  await page.reload()
  await page.getByTitle('打开设置对话框', { exact: true }).click()
  await expect(page.getByLabel('播放语速', { exact: true })).toHaveValue('2')
  await page.getByTitle('关闭对话框', { exact: true }).click()
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await expect.poll(() => currentRate(2)).toBe(true)
})
