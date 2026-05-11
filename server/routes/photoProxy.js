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

const ENCAR_CDN = 'https://ci.encar.com'
const ENCAR_RESIZE = '?impolicy=heightRate&rh=1080&cw=1920&ch=1080&cg=Center'
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

// Decode the base64 path and resolve to the actual upstream URL.
// - If it starts with 'carpicture' it's an Encar CDN path.
// - If it starts with 'carapis:' it's a Carapis photo UUID URL.
function resolveUpstream(decoded) {
  if (decoded.startsWith('carpicture')) {
    return `${ENCAR_CDN}/carpicture/${decoded}${ENCAR_RESIZE}`
  }
  if (decoded.startsWith('carapis:')) {
    return 'https://' + decoded.slice('carapis:'.length)
  }
  return null
}

router.get('/:b64.jpg', async (req, res) => {
  const { b64 } = req.params
  const decoded = decodePath(b64)
  const upstreamUrl = decoded ? resolveUpstream(decoded) : null
  if (!upstreamUrl) return res.status(400).end()

  const diskPath = path.join(PHOTO_DIR, diskKey(b64) + '.jpg')
  try {
    if (fs.existsSync(diskPath)) {
      res.setHeader('Content-Type', 'image/jpeg')
      res.setHeader('Cache-Control', CACHE_CONTROL)
      res.setHeader('X-Cache', 'DISK')
      return fs.createReadStream(diskPath).pipe(res)
    }
  } catch {}

  try {
    const upstream = await fetch(upstreamUrl, { headers: FETCH_HEADERS })
    if (!upstream.ok) return res.status(upstream.status).end()
    const buf = Buffer.from(await upstream.arrayBuffer())
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

function encodeProxy(payload) {
  return Buffer.from(payload, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function encarPathToProxyUrl(p) {
  if (!p) return ''
  if (p.startsWith('http')) return p
  return `/api/p/${encodeProxy(p.replace(/^\/+/, ''))}.jpg`
}

// For Carapis (or any other absolute https:// photo URL) we encode the
// whole URL minus the scheme behind a 'carapis:' prefix so the resolver
// knows to fetch it directly without applying Encar resize params.
function absoluteUrlToProxyUrl(url) {
  if (!url) return ''
  if (!url.startsWith('https://') && !url.startsWith('http://')) return url
  const stripped = url.replace(/^https?:\/\//, '')
  return `/api/p/${encodeProxy('carapis:' + stripped)}.jpg`
}

module.exports = router
module.exports.encarPathToProxyUrl = encarPathToProxyUrl
module.exports.absoluteUrlToProxyUrl = absoluteUrlToProxyUrl
