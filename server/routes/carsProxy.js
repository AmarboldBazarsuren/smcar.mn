const express = require('express')

const router = express.Router()

const APICARS_URL = process.env.APICARS_BASE_URL || 'https://apicars.info'
const API_KEY = process.env.APICARS_API_KEY || ''

// ===== In-memory cache =====
const cache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 цаг
const STALE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 хоног - stale-while-revalidate-д ашиглана
const inflight = new Map()

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  return item
}

function setCache(key, data) {
  // Cache хэт их болохоос хамгаалах
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, { data, time: Date.now() })
}

function isFresh(item) {
  return item && (Date.now() - item.time) < CACHE_TTL
}

function isStale(item) {
  return item && (Date.now() - item.time) < STALE_TTL
}

async function fetchFromApi(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'x-api-key': API_KEY },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        if (i < 2) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
        throw new Error(`apicars API алдаа: ${response.status}`)
      }
      return await response.json()
    } catch (err) {
      if (i < 2) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
      throw err
    }
  }
}

// Stale-while-revalidate proxy helper - cache 24 цаг шинэхэн, 7 хоног stale
async function proxyGet(apiPath, query = {}) {
  const url = new URL(apiPath, APICARS_URL)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const cacheKey = url.toString()
  const cached = getCached(cacheKey)

  // Шинэхэн cache - шууд буцаана
  if (isFresh(cached)) return cached.data

  // Stale cache байгаа бол background-д шинэчилж, stale өгөгдлийг буцаана
  if (isStale(cached)) {
    if (!inflight.has(cacheKey)) {
      const promise = fetchFromApi(cacheKey)
        .then((data) => { setCache(cacheKey, data); return data })
        .catch((err) => { console.error('Background revalidate failed:', err.message); return cached.data })
        .finally(() => inflight.delete(cacheKey))
      inflight.set(cacheKey, promise)
    }
    return cached.data
  }

  // Cache огт байхгүй - дуудаж буцаана
  if (inflight.has(cacheKey)) return inflight.get(cacheKey)

  const promise = fetchFromApi(cacheKey)
    .then((data) => { setCache(cacheKey, data); return data })
    .finally(() => inflight.delete(cacheKey))
  inflight.set(cacheKey, promise)
  return promise
}

async function proxyPost(apiPath, body) {
  const url = new URL(apiPath, APICARS_URL)
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`apicars API алдаа: ${response.status}`)
  return response.json()
}

// Browser/CDN-д 1 цаг fresh, 1 хоног stale болгож зөвшөөрнө
const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=86400'

// GET /api/cars
router.get('/', async (req, res) => {
  try {
    const raw = await proxyGet('/api/cars', req.query)
    const result = raw.data || raw
    const pagination = result.pagination || {}
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars: result.cars || [],
      total: pagination.total || 0,
      page: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/stats
router.get('/stats', async (req, res) => {
  try {
    const raw = await proxyGet('/api/cars/stats')
    res.set('Cache-Control', CACHE_HEADER)
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id/full
router.get('/:id/full', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}/full`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/cars/pricing-breakdown
router.post('/pricing-breakdown', async (req, res) => {
  try {
    const raw = await proxyPost('/api/cars/pricing-breakdown', req.body)
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
