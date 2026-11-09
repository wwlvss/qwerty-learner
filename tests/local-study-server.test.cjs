const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { spawn } = require('node:child_process')

let folder, child, origin
before(async () => {
  folder = fs.mkdtempSync(path.join(os.tmpdir(), 'qwerty-local-server-'))
  fs.mkdirSync(path.join(folder, 'site'))
  fs.writeFileSync(path.join(folder, 'site/index.html'), '<html>local study</html>')
  fs.writeFileSync(path.join(folder, 'site/words.json'), '["irrigation"]')
  fs.writeFileSync(path.join(folder, 'private.txt'), 'should remain private')
  fs.symlinkSync(path.join(folder, 'private.txt'), path.join(folder, 'site/link.txt'))
  fs.copyFileSync(path.resolve(__dirname, '../scripts/local-study/server.cjs'), path.join(folder, 'server.cjs'))
  const port = await new Promise((resolve) => {
    const probe = net.createServer()
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port
      probe.close(() => resolve(port))
    })
  })
  origin = `http://127.0.0.1:${port}`
  child = spawn(process.execPath, [path.join(folder, 'server.cjs')], {
    env: { ...process.env, QWERTY_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise((resolve, reject) => {
    child.stdout.once('data', resolve)
    child.once('error', reject)
    child.once('exit', (code) => reject(new Error(`server exited: ${code}`)))
  })
})
after(async () => {
  if (child && child.exitCode === null) {
    const stopped = new Promise((resolve) => child.once('exit', resolve))
    child.kill()
    await stopped
  }
  if (folder) fs.rmSync(folder, { recursive: true, force: true })
})
test('serves the SPA on deep links and static data with correct MIME types', async () => {
  const route = await fetch(`${origin}/unfamiliar`)
  assert.equal(route.status, 200)
  assert.match(await route.text(), /local study/)
  const data = await fetch(`${origin}/words.json`)
  assert.match(data.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await data.json(), ['irrigation'])
  const head = await fetch(origin, { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
})
test('rejects non-read requests, missing assets, malformed paths and escaping files', async () => {
  assert.equal((await fetch(origin, { method: 'POST', body: 'not a data upload' })).status, 405)
  assert.equal((await fetch(`${origin}/missing.json`)).status, 404)
  assert.equal((await fetch(`${origin}/%E0%A4%A`)).status, 400)
  assert.equal((await fetch(`${origin}/..%2fprivate.txt`)).status, 403)
  assert.equal((await fetch(`${origin}/link.txt`)).status, 403)
})
