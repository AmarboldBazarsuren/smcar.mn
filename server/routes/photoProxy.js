// Opaque photo proxy: serves images from our own domain so DevTools
// Network tab shows only api.smcar.mn URLs, never the underlying CDN.
//
// URL format: GET /api/p/<base64-url-encoded-path>.jpg
//
// Disk cache: every fetched image is written to /var/www/smcar/server/
// .cache/photos/<sha1>.jpg. Subsequent requests stream the file from
// disk (~5ms) instead of round-tripping to the upstream CDN (~1s).

const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const router = express.Router()

const CDN = 'https://ci.encar.com'
const RESIZE = '?impolicy=heightRate&rh=1080&cw=1920&ch=1080&cg=Center'
const PHOTO_DIR = path.join(__dirname, '..', '.cache', 'photos')

try {
  fs.mkdirSync(PHOTO_DIR, { recursive: true })
} catch {}

const FETCH_HEADERS = {
  referer: 'https://www.encar.com/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

function decodePath(b64) {
  try {
    const std = b64.replace(/-/g, '+').replace(/_/g, '/')
    const pad = std + '='.repeat((4 - (std.length % 4)) % 4)
    return Buffer.from(pad, 'base64').toString('utf8')
  } catch {
    return null
  }
}

function diskKey(b64) {
  return crypto.createHash('sha1').update(b64).digest('hex')
}

const CACHE_CONTROL =
  'public, max-age=604800, stale-while-revalidate=2592000, immutable'

router.get('/:b64.jpg', async (req, res) => {
  const { b64 } = req.params
  const decoded = decodePath(b64)
  if (!decoded || !decoded.startsWith('carpicture')) {
    return res.status(400).end()
  }

  const diskPath = path.join(PHOTO_DIR, diskKey(b64) + '.jpg')

  // Disk fast path — served in a few ms.
  try {
    if (fs.existsSync(diskPath)) {
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Cache-Control', CACHE_CONTROL)
      res.setHeader('X-Cache', 'DISK')
      return fs.createReadStream(diskPath).pipe(res)
    }
  } catch {}

  // Cold path — fetch upstream once, persist, stream out.
  const url = `${CDN}/carpicture/${decoded}${RESIZE}`
  try {
    const upstream = await fetch(url, { headers: FETCH_HEADERS })
    if (!upstream.ok) return res.status(upstream.status).end()
    const buf = Buffer.from(await upstream.arrayBuffer())
    // Persist for next visitor. Ignore disk errors so we still respond.
    fs.writeFile(diskPath, buf, () => {})
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', CACHE_CONTROL)
    res.setHeader('X-Cache', 'MISS')
    res.send(buf)
  } catch (err) {
    console.error('photo proxy error:', err.message)
    res.status(502).end()
  }
})

function encarPathToProxyUrl(p) {
  if (!p) return ''
  if (p.startsWith('http')) return p
  const trimmed = p.replace(/^\/+/, '')
  const b64 = Buffer.from(trimmed, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `/api/p/${b64}.jpg`
}

module.exports = router
module.exports.encarPathToProxyUrl = encarPathToProxyUrl
