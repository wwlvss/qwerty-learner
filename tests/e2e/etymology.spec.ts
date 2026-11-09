import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function counts(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    return {
      words: await db.wordRecords.count(),
      chapters: await db.chapterRecords.count(),
      reviews: await db.reviewRecords.count(),
      views: await db.etymologyViews.count(),
    }
  })
}
async function mode(page: Page, value: string) {
  await page.evaluate(async (value) => {
    const path = '/src/features/etymology/repository.ts'
    const service = await new Function('path', 'return import(path)')(path)
    await service.setDisplayMode(value)
  }, value)
}
async function typeWord(page: Page, word: string) {
  await page.keyboard.type(word, { delay: 35 })
}
async function start(page: Page) {
  await page.getByRole('button', { name: '开始', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem(
      'pronunciation',
      JSON.stringify({ isOpen: false, volume: 0, type: 'us', rate: 1, isLoop: false, isTransRead: false }),
    )
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
  await page.goto('/')
  await expect(page.getByTestId('typing-word')).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/features/etymology/repository.ts'
    await (await new Function('path', 'return import(path)')(path)).ensureEtymologyData()
  })
})

test('correct completion stays on the full word, automatically shows sources, and pauses timer/input', async ({ page }) => {
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toContainText('cancel')
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await expect(page.getByRole('button', { name: '查看词源' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '关闭词源' })).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, chapters: 0, reviews: 0, views: 1 })
  const timer = page
    .locator('div')
    .filter({ has: page.getByText('时间', { exact: true }) })
    .last()
  const before = await timer.innerText()
  await page.keyboard.type('xxxx')
  await page.waitForTimeout(1300)
  expect(await timer.innerText()).toBe(before)
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, views: 1 })
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
  await typeWord(page, 'explosive')
  await expect.poll(() => counts(page)).toMatchObject({ words: 2, reviews: 0 })
  await expect(page.getByTestId('etymology-panel')).toContainText('暂无可靠词源资料')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  await page.waitForTimeout(500)
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
})

test('wrong input has no card; retry keeps original mistake record', async ({ page }) => {
  await start(page)
  await typeWord(page, 'x')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
  expect((await counts(page)).words).toBe(0)
  await page.waitForTimeout(400)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toBeVisible()
  const record = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    return (await new Function('path', 'return import(path)')(path)).db.wordRecords.toArray()
  })
  expect(record).toHaveLength(1)
  expect(record[0].wrongCount).toBe(1)
  expect(record[0].mistakes['0']).toEqual(['x'])
  await expect(page.getByText('正确率', { exact: true }).locator('..')).toContainText('86')
})

test('old off preference cannot suppress automatic feedback or skip the completed word', async ({ page }) => {
  await mode(page, 'off')
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toContainText('cancel')
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, views: 1 })
  await page.getByRole('button', { name: '下一个词' }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  expect((await counts(page)).words).toBe(1)
})

test('old first preference and previous views cannot suppress feedback on repeated correct words', async ({ page }) => {
  await mode(page, 'first')
  for (let i = 1; i <= 3; i++) {
    if (i > 1) await page.reload()
    await expect(page.getByTestId('typing-word')).toBeVisible()
    await start(page)
    await typeWord(page, 'cancel')
    await expect(page.getByTestId('etymology-card')).toBeVisible()
    await expect(page.getByTestId('typing-word')).toHaveText('cancel')
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const path = '/src/utils/db/index.ts'
          return (await (await new Function('path', 'return import(path)')(path)).db.etymologyViews.get('cancel')).viewCount
        }),
      )
      .toBe(i)
    expect((await counts(page)).words).toBe(i)
  }
})

test('root and related-word navigation, search and filters', async ({ page }) => {
  await page.getByRole('link', { name: '我的词根库', exact: true }).click()
  await page.getByRole('link', { name: 'spect', exact: true }).click()
  await expect(page.getByRole('region', { name: '词根详情' })).toBeVisible()
  await page.getByRole('button', { name: 'inspect', exact: true }).click()
  await expect(page.getByTestId('etymology-card')).toContainText('inspect')
  await page.getByRole('button', { name: 'respect', exact: true }).click()
  await expect(page.getByTestId('etymology-card')).toContainText('respect')
  await page.getByRole('button', { name: '关闭词源' }).click()
  await page.getByLabel('搜索词根').fill('transport')
  await expect(page.getByRole('link', { name: 'port', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'spect', exact: true })).toHaveCount(0)
  await page.getByLabel('搜索词根').fill('')
  await page.getByLabel('来源语言').selectOption('拉丁语')
  await page.getByLabel('学习状态', { exact: true }).selectOption('viewed')
  await expect(page.getByRole('link', { name: 'spect', exact: true })).toBeVisible()
})

test('favorites, explicit mastery and learning provenance survive refresh', async ({ page }) => {
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toBeVisible()
  await page.goto('/roots/la-cancell')
  const detail = page.getByRole('region', { name: '词根详情' })
  await expect(detail).toContainText('cancel')
  await detail.getByRole('button', { name: '收藏词根', exact: true }).click()
  await page.getByLabel('个人掌握状态').selectOption('mastered')
  await page.reload()
  await expect(detail.getByRole('button', { name: '取消收藏', exact: true })).toBeVisible()
  await expect(page.getByLabel('个人掌握状态')).toHaveValue('mastered')
  await detail.getByRole('button', { name: '取消收藏', exact: true }).click()
  await expect(detail.getByRole('button', { name: '收藏词根', exact: true })).toBeVisible()
  expect((await counts(page)).words).toBe(1)
  expect((await counts(page)).reviews).toBe(0)
})

test('backup download/restore preserves old tables and offline imported card reading', async ({ page, context }) => {
  await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    await db.wordRecords.put({
      id: 91,
      word: 'preserved',
      dict: 'cet4',
      chapter: 0,
      timeStamp: 1234,
      timing: [15],
      wrongCount: 1,
      mistakes: { 0: ['x'] },
    })
    await db.chapterRecords.put({
      id: 91,
      dict: 'cet4',
      chapter: 0,
      timeStamp: 1234,
      time: 42,
      correctCount: 6,
      wrongCount: 1,
      wordCount: 1,
      correctWordIndexes: [],
      wordNumber: 20,
      wordRecordIds: [91],
    })
    await db.reviewRecords.put({ id: 91, dict: 'cet4', index: 0, createTime: 1234, isFinished: false, words: [] })
  })
  await page.goto('/roots/la-port')
  const detail = page.getByRole('region', { name: '词根详情' })
  await detail.getByRole('button', { name: '收藏词根', exact: true }).click()
  await mode(page, 'auto')
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出词根备份' }).click()
  const download = await downloadEvent
  const path = await download.path()
  expect(path).toBeTruthy()
  await detail.getByRole('button', { name: '取消收藏', exact: true }).click()
  await mode(page, 'off')
  const before = await counts(page)
  await page.getByLabel('恢复词根备份').setInputFiles(path!)
  await expect(page.getByRole('status')).toContainText('词根备份已恢复')
  await expect(detail.getByRole('button', { name: '取消收藏', exact: true })).toBeVisible()
  expect(
    await page.evaluate(async () => {
      const path = '/src/features/etymology/repository.ts'
      return (await new Function('path', 'return import(path)')(path)).getDisplayMode()
    }),
  ).toBe('auto')
  expect(await counts(page)).toEqual(before)
  // Warm the lazy dialog modules before taking the browser offline; full app offline boot is separate.
  await page.getByRole('button', { name: 'transport', exact: true }).click()
  await expect(page.getByTestId('etymology-card')).toContainText('transport')
  await page.getByRole('button', { name: '关闭词源' }).click()
  await context.setOffline(true)
  await page.getByRole('button', { name: 'portable', exact: true }).click()
  await expect(page.getByTestId('etymology-card')).toContainText('portable')
  await context.setOffline(false)
})

test('valid package imports; malformed references and active URLs reject atomically', async ({ page }) => {
  await page.goto('/roots')
  const original = await page.evaluate(async () => {
    const path = '/src/features/etymology/backup.ts'
    return (await new Function('path', 'return import(path)')(path)).exportEtymologyBackup()
  })
  const pack = original.data
  pack.id = 'import-test'
  pack.entries[0].memoryTip = '本地导入测试：辅助记忆'
  await page
    .getByLabel('导入词源数据包')
    .setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('本地词源数据包已导入')
  pack.entries[0].sources[0].url = 'javascript:alert(1)'
  await page
    .getByLabel('导入词源数据包')
    .setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('HTTPS')
  const result = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    return (await (await new Function('path', 'return import(path)')(path)).db.etymologyEntries.get('en:cancel')).memoryTip
  })
  expect(result).toBe('本地导入测试：辅助记忆')
  pack.entries[0].sources[0].url = 'https://example.org/source'
  pack.relations[0].rootId = 'missing-root'
  await page
    .getByLabel('导入词源数据包')
    .setInputFiles({ name: 'broken-relation.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('关系引用的词根或词条不存在')
  expect((await counts(page)).words).toBe(0)
})

test('single-word loops wait for confirmation after every correct repetition', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('loopWordConfig', JSON.stringify({ times: 3 })))
  await page.reload()
  await expect(page.getByTestId('typing-word')).toBeVisible()
  await start(page)
  for (let i = 1; i <= 3; i++) {
    await typeWord(page, 'cancel')
    await expect(page.getByTestId('etymology-card')).toBeVisible()
    await expect(page.getByTestId('typing-word')).toHaveText('cancel')
    await expect.poll(() => counts(page)).toMatchObject({ words: i, views: 1 })
    await page.keyboard.press('Space')
    await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
  }
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
})

test('chapter saves 20 words and one chapter only after explicit final confirmation', async ({ page }) => {
  await mode(page, 'off')
  const words = [
    'cancel',
    'explosive',
    'numerous',
    'govern',
    'analyse',
    'discourage',
    'resemble',
    'remote',
    'salary',
    'pollution',
    'pretend',
    'kettle',
    'wreck',
    'drunk',
    'calculate',
    'persistent',
    'sake',
    'conceal',
    'audience',
    'meanwhile',
  ]
  await start(page)
  for (let i = 0; i < words.length; i++) {
    await typeWord(page, words[i])
    await expect.poll(async () => (await counts(page)).words).toBe(i + 1)
    await expect(page.getByTestId('etymology-panel')).toBeVisible()
    await expect(page.getByTestId('typing-word')).toHaveText(words[i])
    expect((await counts(page)).chapters).toBe(0)
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
    if (i + 1 < words.length) await expect(page.getByTestId('typing-word')).toHaveText(words[i + 1])
  }
  await expect.poll(() => counts(page)).toMatchObject({ words: 20, chapters: 1, reviews: 0, views: 1 })
  const chapter = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    return (await (await new Function('path', 'return import(path)')(path)).db.chapterRecords.toArray())[0]
  })
  expect(chapter.wrongCount).toBe(0)
  expect(chapter.wordRecordIds).toHaveLength(20)
  expect(chapter.correctCount).toBe(words.join('').length)
})

test('v3 database upgrades to v6 without changing original records', async ({ page }) => {
  // Close app connections, then use a blank same-origin document to construct a real v3 database.
  await page.goto('/roots')
  await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    ;(await new Function('path', 'return import(path)')(path)).db.close()
  })
  await page.route('**/migration-blank', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body>migration</body></html>' }),
  )
  await page.goto('/migration-blank')
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('RecordDB')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('RecordDB', 30)
      request.onupgradeneeded = () => {
        for (const name of ['wordRecords', 'chapterRecords', 'reviewRecords']) {
          const store = request.result.createObjectStore(name, { keyPath: 'id', autoIncrement: true })
          const indexes =
            name === 'wordRecords'
              ? ['word', 'timeStamp', 'dict', 'chapter', 'wrongCount']
              : name === 'chapterRecords'
              ? ['timeStamp', 'dict', 'chapter', 'time']
              : ['dict', 'createTime', 'isFinished']
          for (const index of indexes) store.createIndex(index, index)
          if (name !== 'reviewRecords') store.createIndex('[dict+chapter]', ['dict', 'chapter'])
          store.put({
            id: 99,
            word: 'sentinel',
            dict: 'cet4',
            chapter: 0,
            timeStamp: 1234,
            createTime: 1234,
            isFinished: false,
            index: 0,
            words: [],
            timing: [12],
            wrongCount: 2,
            mistakes: {},
            wordRecordIds: [99],
          })
        }
      }
      request.onsuccess = () => {
        request.result.close()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  })
  await page.goto('/')
  await expect(page.getByTestId('typing-word')).toBeVisible()
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, chapters: 1, reviews: 1 })
  const record = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    return { version: db.verno, word: await db.wordRecords.get(99), review: await db.reviewRecords.get(99) }
  })
  expect(record.version).toBe(6)
  expect(record.word.word).toBe('sentinel')
  expect(record.word.wrongCount).toBe(2)
  expect(record.review.isFinished).toBe(false)
})

test('correct words with unavailable source data still wait for explicit confirmation', async ({ page }) => {
  await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    await (await new Function('path', 'return import(path)')(path)).db.etymologyEntries.delete('en:cancel')
  })
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-panel')).toContainText('暂无可靠词源资料')
  await page.waitForTimeout(1700)
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  expect((await counts(page)).words).toBe(1)
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
})

test('pending data is not stated as fact and still cannot auto-advance the word', async ({ page }) => {
  await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    await db.etymologyEntries.update('en:cancel', { verificationStatus: 'pending' })
  })
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-panel')).toContainText('待核实')
  await expect(page.getByTestId('etymology-card')).toHaveCount(0)
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, views: 0 })
})

test('legacy full database backup includes and restores the new tables', async ({ page }) => {
  await page.goto('/roots/la-port')
  await page.getByRole('region', { name: '词根详情' }).getByRole('button', { name: '收藏词根', exact: true }).click()
  const result = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    // Load the actual application export module to use the same Dexie addon instance.
    const exportPath = '/src/utils/db/data-export.ts'
    await new Function('path', 'return import(path)')(exportPath)
    const addonPath = '/node_modules/dexie-export-import/dist/dexie-export-import.mjs'
    const addon = await new Function('path', 'return import(path)')(addonPath)
    const blob = await addon.exportDB(db)
    const data = JSON.parse(await blob.text())
    await db.rootFavorites.clear()
    await addon.importInto(db, blob, { overwriteValues: true, clearTablesBeforeImport: true })
    return { tables: data.data.tables.map((t) => t.name), favorite: await db.rootFavorites.get('la-port') }
  })
  expect(result.tables).toContain('wordRecords')
  expect(result.tables).toContain('etymologyEntries')
  expect(result.tables).toContain('rootFavorites')
  expect(result.favorite.rootId).toBe('la-port')
})

test('root navigation from completion keeps the current saved word and pending chapter in place', async ({ page }) => {
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toBeVisible()
  const popupEvent = page.waitForEvent('popup')
  await page.getByTestId('etymology-panel').getByRole('link', { name: 'cancel', exact: true }).click()
  const popup = await popupEvent
  await expect(popup.getByRole('region', { name: '词根详情' })).toContainText('cancell')
  await popup.close()
  await page.bringToFront()
  await expect(page.getByTestId('etymology-card')).toBeVisible()
  await expect.poll(() => counts(page)).toMatchObject({ words: 1, chapters: 0, reviews: 0 })
  await page.getByRole('button', { name: '下一个词' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
  expect((await counts(page)).words).toBe(1)
})

for (const key of ['Enter', 'Space']) {
  test(`inline feedback: ${key} continues once without pausing or typing an extra character`, async ({ page }) => {
    await mode(page, 'auto')
    await start(page)
    await typeWord(page, 'cancel')
    await expect(page.getByTestId('etymology-panel')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.keyboard.down(key)
    await page.keyboard.down(key)
    await page.waitForTimeout(250)
    await expect(page.getByTestId('etymology-panel')).toBeVisible()
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)
    await page.keyboard.up(key)
    await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
    await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeVisible()
    await typeWord(page, 'explosive')
    await expect.poll(() => counts(page)).toMatchObject({ words: 2, chapters: 0, reviews: 0 })
    const records = await page.evaluate(async () => {
      const path = '/src/utils/db/index.ts'
      return (await new Function('path', 'return import(path)')(path)).db.wordRecords.toArray()
    })
    expect(records.map((r) => r.word)).toEqual(['cancel', 'explosive'])
    expect(records[1].wrongCount).toBe(0)
  })
}

test('Space on a disclosure keeps the completed word visible until explicit next action', async ({ page }) => {
  await start(page)
  await typeWord(page, 'cancel')
  await expect(page.getByTestId('etymology-card')).toBeVisible()
  const summary = page.getByText('同源词、词根与关系详情', { exact: true })
  await summary.focus()
  await page.keyboard.press('Space')
  await expect(summary.locator('..')).toHaveAttribute('open', '')
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  expect((await counts(page)).words).toBe(1)
  await page.getByTestId('etymology-panel').focus()
  await page.keyboard.press('Space')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  expect((await counts(page)).words).toBe(1)
})
