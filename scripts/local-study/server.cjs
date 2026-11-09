/* Portable static server: no packages, no administrator rights, local browser data only. */
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const site = fs.realpathSync(path.join(__dirname, 'site'))
const port = Number(process.env.QWERTY_PORT || 4173)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('QWERTY_PORT must be 1024–65535')
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.zip': 'application/zip',
}
const server = http.createServer((request, response) => {
  const fail = (code, message) => {
    response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(message)
  }
  if (!['GET', 'HEAD'].includes(request.method)) return fail(405, 'Method not allowed')
  let pathname
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  } catch {
    return fail(400, 'Invalid path')
  }
  let file = path.resolve(site, '.' + pathname)
  if (file !== site && !file.startsWith(site + path.sep)) return fail(403, 'Forbidden')
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  } catch {
    if (path.extname(file)) return fail(404, 'Not found')
    file = path.join(site, 'index.html')
  }
  try {
    file = fs.realpathSync(file)
    if (!file.startsWith(site + path.sep)) return fail(403, 'Forbidden')
    if (!fs.statSync(file).isFile()) return fail(404, 'Not found')
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    })
    if (request.method === 'HEAD') return response.end()
    const stream = fs.createReadStream(file)
    stream.on('error', () => response.destroy())
    stream.pipe(response)
  } catch {
    fail(404, 'Not found')
  }
})
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? 'Port 4173 is busy. Close the previous local-study window and try again.' : error.message)
  process.exitCode = 1
})
server.listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}`
  console.log(
    `Qwerty Learner: ${url}\nKeep this window open. Press Ctrl+C to stop.\nUse the same browser and address to keep your local learning data.`,
  )
  if (process.argv.includes('--open')) {
    const [command, args] =
      process.platform === 'win32'
        ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
        : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
    const child = spawn(command, args, { stdio: 'ignore', detached: true })
    child.on('error', () => {})
    child.unref()
  }
})
