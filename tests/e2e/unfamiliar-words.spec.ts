import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hasSeenEnhancedPromotion', 'true')
    localStorage.setItem('pronunciation', JSON.stringify({ isOpen: false, isTransRead: false }))
    localStorage.setItem('keySoundsConfig', JSON.stringify({ isOpen: false }))
    localStorage.setItem('hintSoundsConfig', JSON.stringify({ isOpen: false }))
  })
  await page.goto('/')
  await expect(page.getByTestId('typing-word')).toBeVisible()
})

test('save an unfamiliar word before completion and a related phrase after completion without advancing', async ({ page }) => {
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.getByRole('button', { name: '收藏 cancel 到不熟词本', exact: true }).click()
  await expect(page.getByRole('button', { name: '已收藏 cancel 到不熟词本', exact: true })).toBeDisabled()
  await page.keyboard.type('cancel')
  await expect(page.getByTestId('word-usage')).toBeVisible()
  await page.getByRole('button', { name: '收藏 cancel a meeting 到不熟词本', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('cancel')
  await page.getByRole('link', { name: '不熟词本', exact: true }).click()
  await expect(page.getByRole('article', { name: 'cancel收藏词条', exact: true })).toContainText('CET-4')
  await expect(page.getByRole('article', { name: 'cancel a meeting收藏词条', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('article')).toHaveCount(2)
})

test('manual confusable words keep notes, filters and independent practice history', async ({ page }) => {
  await page.goto('/unfamiliar')
  await page.getByText('添加不熟单词、易混词或短语', { exact: true }).click()
  await page.getByLabel('不熟单词或短语', { exact: true }).fill('affect')
  await page.getByLabel('新词分类').selectOption('confusable')
  await page.getByLabel('新词备注').fill('effect 是容易混淆的词；区分动词和名词用法')
  await page.getByRole('button', { name: '添加到不熟词本', exact: true }).click()
  const article = page.getByRole('article', { name: 'affect收藏词条', exact: true })
  await expect(article).toBeVisible()
  await expect(article.getByLabel('affect备注')).toHaveValue(/effect/)
  await article.getByLabel('affect备注').fill('effect：检查例句中的词性')
  await article.getByRole('button', { name: '保存 affect 备注' }).click()
  await expect(article.getByRole('status')).toHaveText('备注已保存')
  await page.reload()
  await expect(page.getByLabel('affect备注')).toHaveValue('effect：检查例句中的词性')
  await page.getByLabel('筛选收藏分类').selectOption('phrase')
  await expect(page.getByText('没有匹配的词条。')).toBeVisible()
  await page.getByLabel('筛选收藏分类').selectOption('confusable')
  await page.getByLabel('搜索不熟词本').fill('effect')
  await expect(article).toBeVisible()
  await page.getByRole('button', { name: '练习不熟词本', exact: true }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('affect')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('affect')
  await expect(page.getByTestId('etymology-panel')).toBeVisible()
  await page.keyboard.press('Enter')
  const result = await page.evaluate(async () => {
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    return { records: await db.wordRecords.toArray(), saved: await db.unfamiliarWords.count() }
  })
  expect(result.records).toHaveLength(1)
  expect(result.records[0].dict).toBe('unfamiliar')
  expect(result.saved).toBe(1)
  await page.goto('/unfamiliar')
  await page.getByRole('button', { name: '移出 affect', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(0)
  expect(await page.evaluate(async () => (await new Function('return import("/src/utils/db/index.ts")')()).db.wordRecords.count())).toBe(1)
})

test('collections deduplicate by spelling while preserving sources and notes', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { saveUnfamiliarWord } = await new Function('return import("/src/features/unfamiliar-words/repository.ts")')()
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    const word = { name: 'meeting', trans: ['会议'], usphone: '', ukphone: '' }
    await Promise.all([
      saveUnfamiliarWord(word, 'work-english', { kind: 'confusable', note: 'compare conference' }),
      saveUnfamiliarWord({ ...word, name: 'Meeting' }, 'business-english'),
    ])
    return { entries: await db.unfamiliarWords.toArray(), errors: await db.wordRecords.count() }
  })
  expect(result.entries).toHaveLength(1)
  expect(result.entries[0].sourceDicts.sort()).toEqual(['business-english', 'work-english'])
  expect(result.entries[0].note).toBe('compare conference')
  expect(result.errors).toBe(0)
})

test('dedicated exports import atomically and complete database backups include collections', async ({ page }) => {
  await page.goto('/unfamiliar')
  const pack = {
    format: 'qwerty-unfamiliar-words',
    version: 1,
    words: [
      {
        id: 'take care of',
        name: 'take care of',
        trans: ['照顾'],
        usphone: '',
        ukphone: '',
        kind: 'phrase',
        note: '注意三个词',
        sourceDicts: ['daily-english'],
        addedAt: 10,
        updatedAt: 10,
      },
    ],
  }
  await page
    .getByLabel('导入不熟词本', { exact: true })
    .setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('article', { name: 'take care of收藏词条' })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出不熟词本', exact: true }).click()
  const stream = await (await downloadPromise).createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(JSON.parse(Buffer.concat(chunks).toString()).words[0].note).toBe('注意三个词')
  const restored = await page.evaluate(async () => {
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    const addon = await new Function('return import("/node_modules/dexie-export-import/dist/dexie-export-import.mjs")')()
    const { importUnfamiliarPackage } = await new Function('return import("/src/features/unfamiliar-words/repository.ts")')()
    const first = await db.unfamiliarWords.get('take care of')
    let rejected = false
    try {
      await importUnfamiliarPackage({
        format: 'qwerty-unfamiliar-words',
        version: 1,
        words: [
          { ...first, id: 'cancel', name: 'cancel' },
          { ...first, id: 'broken', name: 'broken', kind: 'invalid' },
        ],
      })
    } catch {
      rejected = true
    }
    const unchanged = await db.unfamiliarWords.count()
    const blob = await addon.exportDB(db)
    await db.unfamiliarWords.clear()
    await addon.importInto(db, blob, { clearTablesBeforeImport: true, overwriteValues: true })
    return { rejected, unchanged, restored: await db.unfamiliarWords.get('take care of') }
  })
  expect(restored.rejected).toBe(true)
  expect(restored.unchanged).toBe(1)
  expect(restored.restored.note).toBe('注意三个词')
  await page.getByRole('button', { name: '练习不熟词本' }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('take␣care␣of')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('take care of')
  await expect(page.getByTestId('etymology-panel')).toBeVisible()
})

test('a real v5 database upgrades without changing personal words, usage or original history', async ({ page }) => {
  const schema = await page.evaluate(async () => {
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    const schema = db.tables
      .filter((table: { name: string }) => table.name !== 'unfamiliarWords')
      .map((table: { name: string; schema: { primKey: { src: string }; indexes: { src: string }[] } }) => ({
        name: table.name,
        definition: [table.schema.primKey.src, ...table.schema.indexes.map((index) => index.src)].join(','),
      }))
    db.close()
    return schema
  })
  await page.route('**/upgrade-blank', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>migration</body></html>' }))
  await page.goto('/upgrade-blank')
  await page.evaluate(async (schema) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('RecordDB')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('RecordDB', 50)
      request.onupgradeneeded = () => {
        for (const table of schema) {
          const [primary, ...indexes] = table.definition.split(',')
          const store = request.result.createObjectStore(table.name, {
            keyPath: primary.replace(/^\+\+/, ''),
            autoIncrement: primary.startsWith('++'),
          })
          for (const index of indexes) {
            const key = index.replace(/^[&*]/, '')
            store.createIndex(key, key.startsWith('[') ? key.slice(1, -1).split('+') : key, {
              unique: index.startsWith('&'),
              multiEntry: index.startsWith('*'),
            })
          }
        }
        request
          .transaction!.objectStore('personalWords')
          .put({ id: 'cancel', name: 'cancel', trans: ['我的原释义'], usphone: '', ukphone: '', addedAt: 1, position: 0 })
        request.transaction!.objectStore('wordUsageEntries').put({ normalizedWord: 'cancel', phrases: [], examples: [] })
        request
          .transaction!.objectStore('wordRecords')
          .put({ id: 91, word: 'cancel', dict: 'cet4', chapter: 0, wrongCount: 2, timeStamp: 1, timing: [], mistakes: {} })
      }
      request.onsuccess = () => {
        request.result.close()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }, schema)
  await page.goto('/unfamiliar')
  await expect(page.getByRole('heading', { name: '不熟词本', exact: true })).toBeVisible()
  const result = await page.evaluate(async () => {
    const { db } = await new Function('return import("/src/utils/db/index.ts")')()
    return {
      version: db.verno,
      personal: await db.personalWords.get('cancel'),
      usage: await db.wordUsageEntries.count(),
      record: await db.wordRecords.get(91),
      favorites: await db.unfamiliarWords.count(),
    }
  })
  expect(result.version).toBe(6)
  expect(result.personal.trans).toEqual(['我的原释义'])
  expect(result.usage).toBe(1)
  expect(result.record.wrongCount).toBe(2)
  expect(result.favorites).toBe(0)
})
