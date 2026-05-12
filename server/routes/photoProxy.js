// Opaque photo proxy: serves images from our own domain so DevTools
// Network tab shows only api.smcar.mn URLs, never the underlying CDN.
//
// URL format: GET /api/p/<base64-url-encoded-host+path>.jpg
//
// The base64 payload encodes the original host+path as a single string
// (e.g. "api.example.com/path/to/image.jpg"). We prepend https:// and
// fetch — no upstream-specific logic in this file.
//
// Disk cache: every fetched image is written to .cache/photos/<sha1>.jpg
// Subsequent requests stream the file from disk (~5ms) instead of
// round-tripping to the upstream CDN (~1s).

const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const router = express.Router()

const PHOTO_DIR = path.join(__dirname, '..', '.cache', 'photos')

try {
  fs.mkdirSync(PHOTO_DIR, { recursive: true })
} catch {}

const FETCH_HEADERS = {
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

// Decoded payload looks like: "host.example.com/path/to/file.jpg"
// We accept any host so the proxy stays generic; the host is implicit
// in the payload, not in the URL.
function resolveUpstream(decoded) {
  if (!decoded) return null
  // Strip legacy "carapis:" prefix (kept for back-compat with old URLs)
  const cleaned = decoded.startsWith('carapis:')
    ? decoded.slice('carapis:'.length)
    : decoded
  if (!cleaned.includes('/')) return null
  return 'https://' + cleaned
}

router.get('/:b64.jpg', async (req, res) => {
  const { b64 } = req.params
  const decoded = decodePath(b64)
  const upstreamUrl = resolveUpstream(decoded)
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

// Turn any absolute https?:// URL into our opaque proxy form.
function absoluteUrlToProxyUrl(url) {
  if (!url) return ''
  if (!url.startsWith('https://') && !url.startsWith('http://')) return url
  const stripped = url.replace(/^https?:\/\//, '')
  return `/api/p/${encodeProxy(stripped)}.jpg`
}

module.exports = router
module.exports.absoluteUrlToProxyUrl = absoluteUrlToProxyUrl
