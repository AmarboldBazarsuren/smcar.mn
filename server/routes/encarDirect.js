// Direct Encar proxy: pulls data from api.encar.com (Encar's own public
// AJAX endpoint) with proper headers, then normalizes the response so the
// existing frontend can consume it just like the apicars.info proxy.
//
// Feature-flagged via DATA_SOURCE=encar in .env. Set to anything else to
// fall back to the original carsProxy.js mounted in index.js.

const express = require('express')
const tx = require('../lib/encarTranslate')
const opts = require('../lib/encarOptions')
const models = require('../lib/encarModels')

const router = express.Router()

const ENCAR_HEADERS = {
  accept: 'application/json, text/javascript, */*; q=0.01',
  'accept-language': 'en-US,en;q=0.9',
  referer: 'https://www.encar.com/',
  origin: 'https://www.encar.com',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

// ===== In-memory cache (24h fresh, 7d stale-while-revalidate) =====
const cache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000
const STALE_TTL = 7 * 24 * 60 * 60 * 1000
const inflight = new Map()

function getCached(key) {
  return cache.get(key) || null
}
function setCache(key, data) {
  if (cache.size > 1000) cache.delete(cache.keys().next().value)
  cache.set(key, { data, time: Date.now() })
}
function isFresh(it) { return it && Date.now() - it.time < CACHE_TTL }
function isStale(it) { return it && Date.now() - it.time < STALE_TTL }

async function fetchEncar(url) {
  const res = await fetch(url, {
    headers: ENCAR_HEADERS,
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`encar ${res.status}: ${url}`)
  return res.json()
}

async function cachedGet(url) {
  const cached = getCached(url)
  if (isFresh(cached)) return cached.data
  if (isStale(cached)) {
    if (!inflight.has(url)) {
      const p = fetchEncar(url)
        .then((d) => { setCache(url, d); return d })
        .catch((err) => { console.error('revalidate fail:', err.message); return cached.data })
        .finally(() => inflight.delete(url))
      inflight.set(url, p)
    }
    return cached.data
  }
  if (inflight.has(url)) return inflight.get(url)
  const p = fetchEncar(url)
    .then((d) => { setCache(url, d); return d })
    .finally(() => inflight.delete(url))
  inflight.set(url, p)
  return p
}

const CDN = 'https://ci.encar.com'
// Encar's image-resize endpoint. Without this, direct ci.encar.com URLs
// serve a ~28KB cached thumbnail. With these params we get the
// 1280×768 ~91KB high-quality version that encar.com itself uses.
const IMG_QUERY = '?impolicy=heightRate&rh=768&cw=1280&ch=768&cg=Center'

function imageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // Encar's resize endpoint requires '/carpicture/' prefix even if the
  // original path already starts with '/carpicture##/...'.
  const normalized = path.startsWith('/carpicture') ? '/carpicture' + path : path
  return CDN + normalized + IMG_QUERY
}

function pickListPhotos(photos = []) {
  if (!photos.length) return []
  // Encar list returns up to 4 thumbs. Prefer 003/004/007 (cleaner shots) over 001.
  const sorted = [...photos].sort((a, b) => {
    const score = (t) => (t === '001' ? 99 : Number(t) || 50)
    return score(a.type) - score(b.type)
  })
  return sorted.map((p) => imageUrl(p.location))
}

function pickDetailPhotos(photos = []) {
  if (!photos.length) return []
  // Filter to high-quality typed photos; drop UNDER_BODY (separate field anyway).
  // Prefer INNER/OPTION over the watermarked 001 OUTSIDE shot.
  const order = (p) => {
    if (p.type === 'INNER') return 1
    if (p.type === 'OPTION') return 2
    if (p.type === 'EQUIPMENT') return 3
    if (p.code === '001') return 90 // watermarked shot last among outside
    return 10 // other outside shots
  }
  return [...photos].sort((a, b) => order(a) - order(b)).map((p) => imageUrl(p.path))
}

// Build Encar search DSL from our friendly query params.
// Reverse-translate English brand → Korean when present.
const REV_BRAND = (() => {
  const r = {}
  for (const [k, v] of Object.entries(tx.BRAND_MAP)) {
    if (!r[v]) r[v] = k
  }
  return r
})()

function buildQ(params) {
  const parts = ['CarType.A.']
  if (params.brand) {
    const kr = REV_BRAND[params.brand] || params.brand
    parts.push(`Manufacturer.${kr}.`)
  }
  if (params.model) parts.push(`Model.${params.model}.`)
  // Year is yyyyMM in Encar. We get years from filters and convert to range.
  if (params.yearFrom) parts.push(`Year.range(${params.yearFrom}00..).`)
  if (params.yearTo) parts.push(`Year.range(..${params.yearTo}99).`)
  if (params.priceFrom || params.priceTo) {
    const lo = params.priceFrom ? Math.round(Number(params.priceFrom) / 10000) : ''
    const hi = params.priceTo ? Math.round(Number(params.priceTo) / 10000) : ''
    parts.push(`Price.range(${lo}..${hi}).`)
  }
  if (params.maxMileage) parts.push(`Mileage.range(..${params.maxMileage}).`)
  if (params.fuelType) parts.push(`FuelType.${params.fuelType}.`)
  return parts.length === 1 ? '(And.CarType.A.)' : `(And.${parts.join('_.')})`
}

const SORT_MAP = {
  price: 'PriceAsc',
  '-price': 'PriceDesc',
  year: 'Year',
  '-year': 'YearDesc',
  mileage: 'Mileage',
  '-mileage': 'MileageDesc',
  scraped_at: 'ModifiedDate',
}

function buildSr(params) {
  const page = Math.max(1, Number(params.page || 1))
  const limit = Math.min(100, Math.max(1, Number(params.limit || 20)))
  const offset = (page - 1) * limit
  const order = params.sortBy
    ? SORT_MAP[(params.sortOrder === 'asc' ? '' : '-') + params.sortBy] || 'ModifiedDate'
    : 'ModifiedDate'
  return `|${order}|${offset}|${limit}`
}

function normalizeListItem(c) {
  const brand = tx.brand(c.Manufacturer)
  const model = models.translateModelText(c.Model || '')
  const badge = models.translateModelText(c.Badge || '')
  return {
    id: String(c.Id),
    encar_id: String(c.Id),
    title: [brand, model, badge].filter(Boolean).join(' '),
    brand,
    model,
    badge,
    badge_detail: models.translateModelText(c.BadgeDetail || ''),
    year: c.FormYear ? Number(c.FormYear) : Math.floor((c.Year || 0) / 100),
    price: c.Price ? c.Price * 10000 : 0, // KRW
    currency: 'KRW',
    mileage: c.Mileage || 0,
    fuelType: tx.fuel(c.FuelType),
    fuel_type: tx.fuel(c.FuelType),
    transmission: '',
    color: '',
    body_type: '',
    location: c.OfficeCityState || '',
    image: pickListPhotos(c.Photos || []).slice(0, 1)[0] || imageUrl(c.Photo + '001.jpg'),
    images: pickListPhotos(c.Photos || []),
    type: '',
  }
}

function normalizeDetail(d) {
  const cat = d.category || {}
  const spec = d.spec || {}
  const ad = d.advertisement || {}
  const manufacturer = cat.manufacturerEnglishName || tx.brand(cat.manufacturerName)
  const model = cat.modelGroupEnglishName || cat.modelName || ''
  const grade = cat.gradeEnglishName || cat.gradeName || ''
  const trim = cat.gradeDetailEnglishName || cat.gradeDetailName || ''
  return {
    id: String(d.vehicleId || d.dummyVehicleId),
    encar_id: String(d.vehicleId || d.dummyVehicleId),
    title: [manufacturer, model, grade, trim].filter(Boolean).join(' '),
    brand: manufacturer,
    model,
    grade,
    trim,
    year: cat.formYear ? Number(cat.formYear) : 0,
    year_month: cat.yearMonth || '',
    price: ad.price ? ad.price * 10000 : 0, // KRW
    original_price_krw: ad.price ? ad.price * 10000 : 0,
    currency: 'KRW',
    mileage: spec.mileage || 0,
    displacement: spec.displacement || 0,
    fuelType: tx.fuel(spec.fuelName),
    fuel_type: tx.fuel(spec.fuelName),
    transmission: tx.transmission(spec.transmissionName),
    color: tx.color(spec.colorName),
    body_type: tx.body(spec.bodyName),
    seat_count: spec.seatCount || 0,
    vin: d.vin || '',
    location: (d.contact && d.contact.address) || '',
    dealer_type: d.contact && d.contact.userType,
    image: pickDetailPhotos(d.photos || [])[0] || '',
    images: pickDetailPhotos(d.photos || []),
    options: opts.expand(d.options || {}, 'en'),
    options_mn: opts.expand(d.options || {}, 'mn'),
    diagnosis: !!ad.diagnosisCar,
    pre_verified: !!ad.preVerified,
    extend_warranty: !!ad.extendWarranty,
    warranty: cat.warranty || null,
    advertisement_status: ad.status || '',
    one_line: ad.oneLineText || '',
    raw_korean_manufacturer: cat.manufacturerName,
    raw_korean_model: cat.modelName,
    scraped_at: d.manage && d.manage.modifyDateTime,
  }
}

// ===== Routes =====
const CACHE_HEADER = 'public, max-age=3600, stale-while-revalidate=86400'

// GET /api/cars  — Encar list
router.get('/', async (req, res) => {
  try {
    const q = buildQ(req.query)
    const sr = buildSr(req.query)
    const u = new URL('https://api.encar.com/search/car/list/general')
    u.searchParams.set('count', 'true')
    u.searchParams.set('q', q)
    u.searchParams.set('sr', sr)
    const raw = await cachedGet(u.toString())
    const cars = (raw.SearchResults || []).map(normalizeListItem)
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars,
      total: raw.Count || 0,
      page,
      totalPages: Math.ceil((raw.Count || 0) / limit),
    })
  } catch (err) {
    console.error('encar list error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/stats
router.get('/stats', async (req, res) => {
  try {
    const u = new URL('https://api.encar.com/search/car/list/general')
    u.searchParams.set('count', 'true')
    u.searchParams.set('q', '(And.CarType.A.)')
    u.searchParams.set('sr', '|ModifiedDate|0|1')
    const raw = await cachedGet(u.toString())
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      totalCars: raw.Count || 0,
      highestCarNumber: raw.Count || 0,
      carsByWebsite: [{ website: 'encar.com', count: raw.Count || 0 }],
    })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/:id  — detail (summary shape)
router.get('/:id', async (req, res) => {
  try {
    const d = await cachedGet(`https://api.encar.com/v1/readside/vehicle/${req.params.id}`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(d))
  } catch (err) {
    console.error('encar detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/:id/full — full record (same shape, frontend treats it as full)
router.get('/:id/full', async (req, res) => {
  try {
    const d = await cachedGet(`https://api.encar.com/v1/readside/vehicle/${req.params.id}`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(d))
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// POST /api/cars/pricing-breakdown — keep simple compatibility
router.post('/pricing-breakdown', (req, res) => {
  const body = req.body || {}
  const price = Number(body.originalPrice) || 0
  res.json({
    originalPrice: price,
    diagnosticFee: 0,
    shippingFee: 0,
    kosovoTransportFee: 0,
    commissionFee: 0,
    extraFee: 0,
    discount: 0,
    totalPrice: price,
  })
})

module.exports = router
