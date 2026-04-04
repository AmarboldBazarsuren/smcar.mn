const express = require('express')

const router = express.Router()

const APICARS_URL = process.env.APICARS_BASE_URL || 'https://apicars.info'
const API_KEY = process.env.APICARS_API_KEY || ''

// Retry бүхий proxy helper
async function proxyGet(apiPath, query = {}, retries = 2) {
  const url = new URL(apiPath, APICARS_URL)
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url.toString(), {
        headers: { 'x-api-key': API_KEY },
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok) {
        if (i < retries) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
        throw new Error(`apicars API алдаа: ${response.status}`)
      }
      return response.json()
    } catch (err) {
      if (i < retries) { await new Promise(r => setTimeout(r, 500 * (i + 1))); continue }
      throw err
    }
  }
}

async function proxyPost(apiPath, body) {
  const url = new URL(apiPath, APICARS_URL)
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) {
    throw new Error(`apicars API алдаа: ${response.status}`)
  }
  return response.json()
}

// GET /api/cars — машин жагсаалт
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

// GET /api/cars/stats — статистик
router.get('/stats', async (req, res) => {
  try {
    const raw = await proxyGet('/api/cars/stats')
    const result = raw.data || raw
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id — нэг машин
router.get('/:id', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}`)
    const car = raw.data || raw
    res.json(car)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/cars/:id/full — бүтэн мэдээлэл
router.get('/:id/full', async (req, res) => {
  try {
    const raw = await proxyGet(`/api/cars/${req.params.id}/full`)
    const car = raw.data || raw
    res.json(car)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/cars/pricing-breakdown — үнийн тооцоо
router.post('/pricing-breakdown', async (req, res) => {
  try {
    const raw = await proxyPost('/api/cars/pricing-breakdown', req.body)
    const result = raw.data || raw
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
