// Carapis catalog_public proxy.
// Carapis is a paid Encar-data wrapper that already hosts the data on
// their own infrastructure (no Encar rate limits hitting our VPS).
// The free tier exposes:
//   GET  /apix/catalog_public/vehicles/                (list)
//   GET  /apix/catalog_public/vehicles/detail/{uuid}/  (detail)
//   GET  /apix/catalog_public/brands/
// Premium-only fields (VIN, listing_id, full features) are masked.

const express = require('express')
const fs = require('fs')
const path = require('path')
const tx = require('../lib/encarTranslate')
const { absoluteUrlToProxyUrl } = require('./photoProxy')

const router = express.Router()

const CARAPIS_BASE = 'https://api.carapis.com/apix/catalog_public'

// ===== Cache layer (48h fresh / 14d stale / disk-persisted) =====
const CACHE_TTL = 48 * 60 * 60 * 1000
const STALE_TTL = 14 * 24 * 60 * 60 * 1000
const CACHE_FILE = path.join(__dirname, '..', '.cache', 'carapis-cache.json')
const cache = new Map()
const inflight = new Map()
let dirty = false

function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return
    const obj = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
    const now = Date.now()
    let n = 0
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.time === 'number' && now - v.time < STALE_TTL) { cache.set(k, v); n++ }
    }
    if (n) console.log(`[carapis cache] loaded ${n} entries`)
  } catch (e) { console.error('[carapis cache] load fail:', e.message) }
}
function persistCache() {
  if (!dirty) return
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    const now = Date.now()
    const valid = {}
    for (const [k, v] of cache.entries()) if (now - v.time < STALE_TTL) valid[k] = v
    fs.writeFileSync(CACHE_FILE, JSON.stringify(valid))
    dirty = false
  } catch (e) { console.error('[carapis cache] persist fail:', e.message) }
}
loadCache()
setInterval(persistCache, 60 * 1000).unref()
process.on('SIGTERM', persistCache)
process.on('SIGINT', persistCache)
process.on('beforeExit', persistCache)

function setCache(key, data) {
  if (cache.size > 2000) cache.delete(cache.keys().next().value)
  cache.set(key, { data, time: Date.now() })
  dirty = true
}
function isFresh(it) { return it && Date.now() - it.time < CACHE_TTL }
function isStale(it) { return it && Date.now() - it.time < STALE_TTL }

async function fetchCarapis(url) {
  const headers = { accept: 'application/json' }
  if (process.env.CARAPIS_API_KEY) headers.authorization = `ApiKey ${process.env.CARAPIS_API_KEY}`
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
  if (!r.ok) throw new Error(`carapis ${r.status}`)
  return r.json()
}

async function cachedGet(url) {
  const cached = cache.get(url)
  if (isFresh(cached)) return cached.data
  if (isStale(cached)) {
    if (!inflight.has(url)) {
      const p = fetchCarapis(url)
        .then((d) => { setCache(url, d); return d })
        .catch((e) => { console.error('carapis revalidate fail:', e.message); return cached.data })
        .finally(() => inflight.delete(url))
      inflight.set(url, p)
    }
    return cached.data
  }
  if (inflight.has(url)) return inflight.get(url)
  const p = fetchCarapis(url)
    .then((d) => { setCache(url, d); return d })
    .catch((e) => { if (cached) { console.error('upstream fail, expired cache:', e.message); return cached.data } throw e })
    .finally(() => inflight.delete(url))
  inflight.set(url, p)
  return p
}

// ===== Normalisation =====

function cap(s) {
  if (!s) return s
  return String(s).charAt(0).toUpperCase() + String(s).slice(1)
}

function normalizeList(v) {
  return {
    id: v.id,
    encar_id: v.listing_id || v.id, // listing_id only on paid tier
    title: v.display_name || `${v.brand?.name || ''} ${v.model?.name || ''}`.trim(),
    brand: v.brand?.name || '',
    model: v.model?.name || '',
    badge: v.trim || '',
    badge_detail: v.generation || '',
    year: v.year || 0,
    // Frontend toMnt() expects KRW prices in 万원 (10,000 KRW units).
    price: v.price ? Math.round(Number(v.price) / 10000) : 0,
    original_price_krw: Number(v.price) || 0,
    currency: 'KRW',
    mileage: v.mileage || 0,
    displacement: v.engine_cc || 0,
    fuelType: cap(v.fuel_type),
    fuel_type: cap(v.fuel_type),
    fuel_mn: cap(v.fuel_type),
    transmission: cap(v.transmission),
    transmission_mn: cap(v.transmission),
    color: cap(v.color),
    color_mn: cap(v.color),
    body_type: cap(v.body_type),
    body_type_mn: cap(v.body_type),
    seat_count: v.seat_count || 0,
    location: v.region || '',
    location_mn: v.region ? `БНСУ, ${v.region}` : '',
    image: absoluteUrlToProxyUrl(v.main_photo_url || v.preview_photos?.[0]?.url || ''),
    images: (v.preview_photos || []).map((p) => absoluteUrlToProxyUrl(p.url)),
  }
}

function normalizeDetail(v) {
  return {
    id: v.id,
    encar_id: v.listing_id || v.id,
    title: v.display_name || `${v.brand?.name || ''} ${v.model?.name || ''}`.trim(),
    brand: v.brand?.name || '',
    model: v.model?.name || '',
    grade: v.trim || '',
    trim: v.trim || '',
    badge: v.trim || '',
    badge_detail: v.generation || '',
    year: v.year || 0,
    price: v.price ? Math.round(Number(v.price) / 10000) : 0,
    original_price_krw: Number(v.price) || 0,
    currency: 'KRW',
    mileage: v.mileage || 0,
    displacement: v.engine_cc || 0,
    fuelType: cap(v.fuel_type),
    fuel_type: cap(v.fuel_type),
    fuel_mn: cap(v.fuel_type),
    transmission: cap(v.transmission),
    transmission_mn: cap(v.transmission),
    color: cap(v.color),
    color_mn: cap(v.color),
    body_type: cap(v.body_type),
    body_type_mn: cap(v.body_type),
    seat_count: v.seat_count || 0,
    vin: v.vin || '',
    location: v.region || '',
    location_mn: v.region ? `БНСУ, ${v.region}` : '',
    dealer_type: v.seller_type === 'private' ? 'PERSONAL' : 'DEALER',
    image: absoluteUrlToProxyUrl(v.photos?.[0]?.url || ''),
    images: (v.photos || []).map((p) => absoluteUrlToProxyUrl(p.url)),
    options: { groups: [] },
    options_mn: { groups: [] },
    diagnosis: !!v.inspection_passed,
    pre_verified: !!v.is_verified,
    extend_warranty: v.warranty_type && v.warranty_type !== 'none',
    status: v.status === 'active' ? 'ADVERTISE' : v.status,
    one_line: v.description || '',
    scraped_at: v.first_seen_at,
  }
}

const CACHE_HEADER = 'public, max-age=172800, stale-while-revalidate=604800'

router.get('/', async (req, res) => {
  try {
    const u = new URL(`${CARAPIS_BASE}/vehicles/`)
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    u.searchParams.set('page', page)
    u.searchParams.set('page_size', limit)
    if (req.query.brand) u.searchParams.set('brand_slug', String(req.query.brand).toLowerCase())
    if (req.query.model) u.searchParams.set('model_slug', String(req.query.model).toLowerCase())
    if (req.query.yearFrom) u.searchParams.set('min_year', req.query.yearFrom)
    if (req.query.yearTo) u.searchParams.set('max_year', req.query.yearTo)
    if (req.query.priceFrom) u.searchParams.set('min_price', Math.round(Number(req.query.priceFrom) * 10000))
    if (req.query.priceTo) u.searchParams.set('max_price', Math.round(Number(req.query.priceTo) * 10000))
    if (req.query.fuelType) u.searchParams.set('fuel_type', String(req.query.fuelType).toLowerCase())
    if (req.query.transmission) u.searchParams.set('transmission', String(req.query.transmission).toLowerCase())
    if (req.query.maxMileage) u.searchParams.set('max_mileage', req.query.maxMileage)
    const raw = await cachedGet(u.toString())
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars: (raw.results || []).map(normalizeList),
      total: raw.count || 0,
      page: raw.page || page,
      totalPages: raw.pages || 1,
    })
  } catch (err) {
    console.error('carapis list error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const u = `${CARAPIS_BASE}/vehicles/?page_size=1`
    const raw = await cachedGet(u)
    res.set('Cache-Control', CACHE_HEADER)
    res.json({ totalCars: raw.count || 0, highestCarNumber: raw.count || 0, carsByWebsite: [{ website: 'carapis', count: raw.count || 0 }] })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const raw = await cachedGet(`${CARAPIS_BASE}/vehicles/detail/${req.params.id}/`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(raw))
  } catch (err) {
    console.error('carapis detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

router.get('/:id/full', async (req, res) => {
  try {
    const raw = await cachedGet(`${CARAPIS_BASE}/vehicles/detail/${req.params.id}/`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(raw))
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

router.post('/pricing-breakdown', (req, res) => {
  const body = req.body || {}
  const price = Number(body.originalPrice) || 0
  res.json({
    originalPrice: price,
    diagnosticFee: 0, shippingFee: 0, kosovoTransportFee: 0,
    commissionFee: 0, extraFee: 0, discount: 0, totalPrice: price,
  })
})

// `tx` may not be needed here but keeping import in case we add brand fallback
void tx

module.exports = router
