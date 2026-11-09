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

test('every completed English word shows usage without requiring etymology data', async ({ page }) => {
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('cancel', { delay: 35 })
  await expect(page.getByTestId('word-usage')).toContainText('cancel a meeting')
  await expect(page.getByText('正确率', { exact: true }).locator('..')).toContainText('100')
  await expect(page.getByTestId('word-usage')).toContainText('We need to cancel the meeting today.')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  await page.keyboard.type('explosive', { delay: 35 })
  await expect(page.getByTestId('word-usage')).toContainText('explosive growth')
  await expect(page.getByTestId('etymology-panel')).toContainText('暂无可靠词源资料')
  await expect(page.getByTestId('typing-word')).toHaveText('explosive')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('a real independent personal dictionary reuses existing definitions, persists and records separately', async ({ page }) => {
  await page.getByRole('link', { name: '我的词典', exact: true }).click()
  await page.getByLabel('英语单词或短语').fill('maintain')
  await page.getByRole('button', { name: '添加到我的词典' }).click()
  await expect(page.getByRole('status')).toContainText('已保存')
  await page.reload()
  await expect(page.getByRole('button', { name: '移除 maintain' })).toBeVisible()
  await expect(page.getByText('独立于 CET-4 / CET-6', { exact: false })).toContainText('1 词')
  await page.getByRole('button', { name: '练习我的词典' }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('maintain')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('maintain', { delay: 35 })
  await expect(page.getByTestId('word-usage')).toContainText('maintain the irrigation system')
  const state = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    return { word: await db.personalWords.get('maintain'), record: await db.wordRecords.toArray() }
  })
  expect(state.word.trans.length).toBeGreaterThan(0)
  expect(state.record).toHaveLength(1)
  expect(state.record[0].dict).toBe('personal')
  await page.keyboard.press('Space')
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const path = '/src/utils/db/index.ts'
        return (await new Function('path', 'return import(path)')(path)).db.chapterRecords.count()
      }),
    )
    .toBe(1)
})

test('personal dictionary appears alongside CET dictionaries with correct chapters', async ({ page }) => {
  await page.goto('/my-dictionary')
  await page.getByText('批量添加和导入', { exact: true }).click()
  await page.getByLabel('批量单词').fill(Array.from({ length: 21 }, (_, i) => `word${String.fromCharCode(97 + i)}\t测试释义`).join('\n'))
  await page.getByRole('button', { name: '保存批量单词' }).click()
  await expect(page.getByRole('status')).toContainText('批量单词已保存')
  await page.goto('/gallery')
  const card = page.getByRole('button').filter({ has: page.getByRole('heading', { name: '我的词典', exact: true }) })
  await expect(card).toContainText('21 词')
  await card.click()
  await expect(page.getByRole('dialog')).toContainText('2 章节')
  await expect(page.getByRole('link', { name: '管理我的词典：添加和导入单词' })).toBeVisible()
})

test('personal dictionary imports/exports in order, deduplicates and never deletes practice history', async ({ page }) => {
  await page.goto('/my-dictionary')
  const pack = {
    format: 'qwerty-personal-dictionary',
    version: 1,
    words: [
      { name: 'cancel', trans: ['取消'], usphone: '', ukphone: '' },
      { name: 'maintain', trans: ['维护'], usphone: '', ukphone: '' },
      { name: 'Cancel', trans: ['取消会议'], usphone: '', ukphone: '' },
    ],
  }
  await page
    .getByLabel('导入我的词典', { exact: true })
    .setInputFiles({ name: 'personal.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('已合并导入')
  await expect(page.getByText('独立于 CET-4 / CET-6', { exact: false })).toContainText('2 词')
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出我的词典', exact: true }).click()
  const download = await event
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk)
  const saved = JSON.parse(Buffer.concat(chunks).toString())
  expect(saved.words.map((w: { name: string }) => w.name)).toEqual(['Cancel', 'maintain'])
  await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    await db.wordRecords.add({ word: 'cancel', dict: 'personal', chapter: 0, timeStamp: 1, timing: [], wrongCount: 0, mistakes: {} })
  })
  await page.getByRole('button', { name: '移除 Cancel', exact: true }).click()
  expect(
    await page.evaluate(async () => {
      const path = '/src/utils/db/index.ts'
      return (await new Function('path', 'return import(path)')(path)).db.wordRecords.count()
    }),
  ).toBe(1)
})

test('empty personal dictionary offers a management link rather than an endless spinner', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('currentDict', '"personal"'))
  await page.reload()
  await expect(page.getByText('我的词典目前为空', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '添加或导入单词', exact: true })).toBeVisible()
})

test('local usage packs work for previously unknown words; invalid target spans reject atomically', async ({ page }) => {
  await page.goto('/my-dictionary')
  await page.getByLabel('英语单词或短语').fill('quokka')
  await page.getByLabel('中文释义').fill('短尾矮袋鼠')
  await page.getByRole('button', { name: '添加到我的词典' }).click()
  await expect(page.getByRole('status')).toContainText('已保存')
  const source = { name: 'Test-owned example', url: 'https://example.org/test', license: 'CC0-1.0', kind: 'original' }
  const pack = {
    format: 'qwerty-word-usage',
    version: 1,
    entries: [
      {
        normalizedWord: 'quokka',
        phrases: [{ text: 'a small quokka', translation: '一只小短尾矮袋鼠', source }],
        examples: [{ text: 'A quokka is nearby.', targetStart: 2, targetEnd: 8, source }],
      },
    ],
  }
  await page
    .getByLabel('导入短语与例句数据包')
    .setInputFiles({ name: 'usage.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('已保存在本地')
  pack.entries[0].examples[0].targetEnd = 9
  await page
    .getByLabel('导入短语与例句数据包')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(pack)) })
  await expect(page.getByRole('status')).toContainText('例句目标位置')
  await page.reload()
  await page.getByRole('button', { name: '练习我的词典' }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('quokka')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('quokka', { delay: 35 })
  await expect(page.getByTestId('word-usage')).toContainText('A quokka is nearby.')
  await expect(page.getByTestId('word-usage').locator('mark')).toHaveText('quokka')
  await expect(page.getByTestId('typing-word')).toHaveText('quokka')
})

test('complete database backups include personal words and imported usage', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    await db.personalWords.add({ id: 'cancel', name: 'cancel', trans: ['取消'], usphone: '', ukphone: '', addedAt: 1, position: 0 })
    await db.wordUsageEntries.add({ normalizedWord: 'cancel', phrases: [], examples: [] })
    const addon = await new Function('path', 'return import(path)')('/node_modules/dexie-export-import/dist/dexie-export-import.mjs')
    const blob = await addon.exportDB(db)
    await db.personalWords.clear()
    await db.wordUsageEntries.clear()
    await addon.importInto(db, blob, { clearTablesBeforeImport: true, overwriteValues: true })
    return { version: db.verno, words: await db.personalWords.count(), usage: await db.wordUsageEntries.count() }
  })
  expect(result).toEqual({ version: 5, words: 1, usage: 1 })
})

test('real v4 upgrade keeps existing etymologies, root favorites and word history', async ({ page }) => {
  const fixture = await page.evaluate(async () => {
    const pack = await (await fetch('/data/etymology/starter.json')).json()
    const path = '/src/features/etymology/schema.ts'
    const schema = (await new Function('path', 'return import(path)')(path)).etymologySchema
    const dbPath = '/src/utils/db/index.ts'
    ;(await new Function('path', 'return import(path)')(dbPath)).db.close()
    return {
      root: pack.roots[0],
      entry: pack.entries[0],
      schema: {
        wordRecords: '++id,word,timeStamp,dict,chapter,wrongCount,[dict+chapter]',
        chapterRecords: '++id,timeStamp,dict,chapter,time,[dict+chapter]',
        reviewRecords: '++id,dict,createTime,isFinished',
        ...schema,
      },
    }
  })
  await page.route('**/upgrade-blank', (route) => route.fulfill({ contentType: 'text/html', body: '<html><body>upgrade</body></html>' }))
  await page.goto('/upgrade-blank')
  await page.evaluate(async (fixture) => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('RecordDB')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('RecordDB', 40)
      request.onupgradeneeded = () => {
        for (const [name, definition] of Object.entries(fixture.schema)) {
          const [primary, ...indexes] = (definition as string).split(',')
          const store = request.result.createObjectStore(name, {
            keyPath: primary.replace(/^\+\+/, ''),
            autoIncrement: primary.startsWith('++'),
          })
          for (const index of indexes) {
            const key = index.replace(/^[&*]/, '')
            store.createIndex(key, key.startsWith('[') ? key.slice(1, -1).split('+') : key, { unique: index.startsWith('&') })
          }
        }
        const tx = request.transaction!
        tx.objectStore('roots').put({ ...fixture.root, explanation: 'existing personal root note' })
        tx.objectStore('etymologyEntries').put({ ...fixture.entry, memoryTip: 'existing memory note' })
        tx.objectStore('rootFavorites').put({ rootId: fixture.root.id, createdAt: 1234 })
        tx.objectStore('wordRecords').put({
          id: 99,
          word: 'cancel',
          dict: 'cet4',
          chapter: 0,
          timeStamp: 1234,
          timing: [50],
          wrongCount: 2,
          mistakes: {},
        })
      }
      request.onsuccess = () => {
        request.result.close()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }, fixture)
  await page.goto('/my-dictionary')
  await expect(page.getByRole('heading', { name: '我的词典', exact: true })).toBeVisible()
  const restored = await page.evaluate(async (fixture) => {
    const path = '/src/utils/db/index.ts'
    const { db } = await new Function('path', 'return import(path)')(path)
    return {
      version: db.verno,
      favorite: await db.rootFavorites.get(fixture.root.id),
      entry: await db.etymologyEntries.get(fixture.entry.id),
      record: await db.wordRecords.get(99),
      roots: await db.roots.count(),
    }
  }, fixture)
  expect(restored.version).toBe(5)
  expect(restored.favorite.createdAt).toBe(1234)
  expect(restored.entry.memoryTip).toBe('existing memory note')
  expect(restored.record.wrongCount).toBe(2)
  expect(restored.roots).toBeGreaterThan(0)
})

test('bulk plain words reuse dictionary meanings without overwriting supplied definitions', async ({ page }) => {
  await page.goto('/my-dictionary')
  await page.getByText('批量添加和导入', { exact: true }).click()
  await page.getByLabel('批量单词').fill('cancel\nmaintain\t我的专用释义')
  await page.getByRole('button', { name: '保存批量单词' }).click()
  await expect(page.getByRole('status')).toContainText('批量单词已保存')
  const words = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    return (await new Function('path', 'return import(path)')(path)).db.personalWords.orderBy('position').toArray()
  })
  expect(words[0].trans.length).toBeGreaterThan(0)
  expect(words[0].usphone.length).toBeGreaterThan(0)
  expect(words[1].trans).toEqual(['我的专用释义'])
})

test('spaces inside a personal phrase are typed normally and only continue after completion', async ({ page }) => {
  await page.goto('/my-dictionary')
  await page.getByLabel('英语单词或短语').fill('take care of')
  await page.getByRole('button', { name: '添加到我的词典' }).click()
  await expect(page.getByRole('status')).toContainText('已保存')
  await page.getByRole('button', { name: '练习我的词典' }).click()
  await expect(page.getByTestId('typing-word')).toHaveText('take␣care␣of')
  await page.getByRole('button', { name: '开始', exact: true }).click()
  await page.keyboard.type('take care of', { delay: 35 })
  await expect(page.getByTestId('etymology-panel')).toBeVisible()
  const record = await page.evaluate(async () => {
    const path = '/src/utils/db/index.ts'
    return (await (await new Function('path', 'return import(path)')(path)).db.wordRecords.toArray())[0]
  })
  expect(record.word).toBe('take care of')
  expect(record.wrongCount).toBe(0)
  await page.keyboard.press('Space')
  await expect(page.getByTestId('etymology-panel')).toHaveCount(0)
})

test('all four formerly relative dictionary paths load through the shared fetcher', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const resourcesPath = '/src/resources/dictionary.ts'
    const fetcherPath = '/src/utils/wordListFetcher.ts'
    const { dictionaries } = await new Function('path', 'return import(path)')(resourcesPath)
    const { wordListFetcher } = await new Function('path', 'return import(path)')(fetcherPath)
    return Promise.all(
      ['ket', 'Yilin1', 'Yilin2', 'Yilin3'].map(async (id) => {
        const dict = dictionaries.find((d: { id: string }) => d.id === id)
        return { id, url: dict.url, count: (await wordListFetcher(dict.url)).length }
      }),
    )
  })
  for (const dictionary of result) {
    expect(dictionary.url.startsWith('/dicts/')).toBe(true)
    expect(dictionary.count).toBeGreaterThan(0)
  }
})

test('refreshing a later personal chapter waits for local data instead of resetting to chapter one', async ({ page }) => {
  await page.evaluate(async () => {
    const path = '/src/features/personal-dictionary/repository.ts'
    const { addPersonalWords } = await new Function('path', 'return import(path)')(path)
    await addPersonalWords(
      Array.from({ length: 21 }, (_, i) => ({ name: `word${String.fromCharCode(97 + i)}`, trans: ['测试'], usphone: '', ukphone: '' })),
      false,
    )
    localStorage.setItem('currentDict', '"personal"')
    localStorage.setItem('currentChapter', '1')
  })
  await page.reload()
  await expect(page.getByTestId('typing-word')).toHaveText('wordu')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('currentChapter')!))).toBe(1)
})
