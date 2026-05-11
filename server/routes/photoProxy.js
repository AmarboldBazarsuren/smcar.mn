// Opaque photo proxy: serves images from our own domain so DevTools
// Network tab shows only api.smcar.mn URLs, never the underlying CDN.
//
// URL format: GET /api/p/<base64-url-encoded-encar-path>.jpg
// Example client URL:
//   https://api.smcar.mn/api/p/Y2FycGljdHVyZTA2L3BpYzQwNzYvNDA3NjE5MzdfMDAxLmpwZw.jpg
// resolves to
//   https://ci.encar.com/carpicture/carpicture06/pic4076/40761937_001.jpg?<resize>

const express = require('express')

const router = express.Router()

const CDN = 'https://ci.encar.com'
const RESIZE = '?impolicy=heightRate&rh=1080&cw=1920&ch=1080&cg=Center'

// Encar requires a referer or origin from encar.com to serve images
// without 403, so we forward those headers from our backend.
const FETCH_HEADERS = {
  referer: 'https://www.encar.com/',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

function decodePath(b64) {
  try {
    // url-safe base64 → standard
    const std = b64.replace(/-/g, '+').replace(/_/g, '/')
    const pad = std + '='.repeat((4 - (std.length % 4)) % 4)
    return Buffer.from(pad, 'base64').toString('utf8')
  } catch {
    return null
  }
}

router.get('/:b64.jpg', async (req, res) => {
  const decoded = decodePath(req.params.b64)
  if (!decoded || !decoded.startsWith('carpicture')) {
    return res.status(400).end()
  }
  const url = `${CDN}/carpicture/${decoded}${RESIZE}`
  try {
    const upstream = await fetch(url, {
      headers: FETCH_HEADERS,
      // No timeout — Encar can be slow on cold cache; node's default is fine
    })
    if (!upstream.ok) return res.status(upstream.status).end()
    const ct = upstream.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', ct)
    // Cache aggressively at browser + CDN: 7 days fresh, 30 days stale.
    res.setHeader(
      'Cache-Control',
      'public, max-age=604800, stale-while-revalidate=2592000, immutable'
    )
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.send(buf)
  } catch (err) {
    console.error('photo proxy error:', err.message)
    res.status(502).end()
  }
})

// Helper that encarDirect.js imports to emit our own opaque URLs.
function encarPathToProxyUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // The detail/list responses give paths like '/carpicture06/pic4076/x_001.jpg'.
  // Strip the leading slash; the proxy always prepends '/carpicture/'.
  const trimmed = path.replace(/^\/+/, '')
  const b64 = Buffer.from(trimmed, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `/api/p/${b64}.jpg`
}

module.exports = router
module.exports.encarPathToProxyUrl = encarPathToProxyUrl
