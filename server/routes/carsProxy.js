const express = require('express')

const router = express.Router()

const APICARS_URL = process.env.APICARS_BASE_URL || 'https://apicars.info'
const API_KEY = process.env.APICARS_API_KEY || ''

// ===== In-memory cache =====
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 минут

function getCached(key) {
  const item = cache.get(key)
  if (!item) return null
  if (Date.now() - item.time > CACHE_TTL) { cache.delete(key); return null }
  return item.data
}

function setCache(key, data) {
  // Cache хэт их болохоос хамгаалах
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value
    cache.delete(firstKey)
  }
  cache.set(key, { data, time: Date.now() })
}

// Retry бүхий proxy helper
async function proxyGet(apiPath, query = {}) {
  const url = new URL(apiPath, APICARS_URL)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  const cacheKey = url.toString()
  const cached = getCached(cacheKey)
  if (cached) return cached

  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(url.toString(), {
        headers: { 'x-api-key': API_KEY },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        if (i < 2) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
        throw new Error(`apicars API алдаа: ${response.status}`)
      }
      const data = await response.json()
      setCache(cacheKey, data)
      return data
    } catch (err) {
      if (i < 2) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
      throw err
    }
  }
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

// GET /api/cars
router.get('/', async (req, res) => {
  try {
    const raw = await proxyGet('/api/cars', req.query)
    const result = raw.data || raw
    const pagination = result.pagination || {}
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
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}`)
    res.json(raw.data || raw)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id/full
router.get('/:id/full', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}/full`)
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
