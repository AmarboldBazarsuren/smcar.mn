// Direct Encar proxy: pulls data from api.encar.com (Encar's own public
// AJAX endpoint) with proper headers, then normalizes the response so the
// existing frontend can consume it just like the apicars.info proxy.
//
// Feature-flagged via DATA_SOURCE=encar in .env. Set to anything else to
// fall back to the original carsProxy.js mounted in index.js.

const express = require('express')
const fs = require('fs')
const path = require('path')
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

// ===== Cache: 48h fresh, 14d stale-while-revalidate, disk-persisted =====
const CACHE_TTL = 48 * 60 * 60 * 1000          // 48 hours fresh window
const STALE_TTL = 14 * 24 * 60 * 60 * 1000     // 14 days stale-while-revalidate
const CACHE_FILE = path.join(__dirname, '..', '.cache', 'encar-cache.json')
const cache = new Map()
const inflight = new Map()
let dirty = false

// Load existing cache from disk on startup (survives pm2 restarts).
function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return
    const raw = fs.readFileSync(CACHE_FILE, 'utf8')
    const obj = JSON.parse(raw)
    let loaded = 0
    for (const [k, v] of Object.entries(obj)) {
      if (v && typeof v.time === 'number' && Date.now() - v.time < STALE_TTL) {
        cache.set(k, v)
        loaded++
      }
    }
    if (loaded) console.log(`[encar cache] loaded ${loaded} entries from disk`)
  } catch (e) {
    console.error('[encar cache] load failed:', e.message)
  }
}
function persistCache() {
  if (!dirty) return
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    // Only persist entries that are still within the stale window.
    const valid = {}
    const now = Date.now()
    for (const [k, v] of cache.entries()) {
      if (now - v.time < STALE_TTL) valid[k] = v
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(valid))
    dirty = false
  } catch (e) {
    console.error('[encar cache] persist failed:', e.message)
  }
}
loadCache()
// Flush dirty cache to disk every 60 seconds + on shutdown.
setInterval(persistCache, 60 * 1000).unref()
process.on('SIGTERM', persistCache)
process.on('SIGINT', persistCache)
process.on('beforeExit', persistCache)

function getCached(key) {
  return cache.get(key) || null
}
function setCache(key, data) {
  if (cache.size > 2000) cache.delete(cache.keys().next().value)
  cache.set(key, { data, time: Date.now() })
  dirty = true
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
// Encar's image-resize endpoint. The bare URL serves a 28KB thumbnail.
// With these params we get a high-quality 1920×1080 image — same
// resolution Encar uses on its own desktop detail page (293KB).
const IMG_QUERY = '?impolicy=heightRate&rh=1080&cw=1920&ch=1080&cg=Center'

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
  // List endpoint sends 4 numbered thumbnails (type "001"/"003"/...).
  // Order them numerically so the hero (001) is first.
  return [...photos]
    .sort((a, b) => (Number(a.type) || 999) - (Number(b.type) || 999))
    .map((p) => imageUrl(p.location))
}

function pickDetailPhotos(photos = []) {
  if (!photos.length) return []
  // Use Encar's own ordering: photo code (001, 002, 003, ...) is the
  // dealer-curated sequence with the hero shot first. We only filter
  // out under-body inspection photos (those live in a separate field
  // on the detail response anyway).
  return [...photos]
    .filter((p) => p.type !== 'UNDER_BODY')
    .sort((a, b) => {
      const ac = Number(a.code) || 999
      const bc = Number(b.code) || 999
      return ac - bc
    })
    .map((p) => imageUrl(p.path))
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
    // Frontend's toMnt() expects KRW prices in 万원 (10,000-KRW units),
    // exactly like the legacy apicars.info response. Encar returns the
    // value already in 万원, so we keep it as-is.
    price: c.Price || 0,
    original_price_krw: c.Price ? c.Price * 10000 : 0,
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
    // 万원 unit (matches frontend toMnt expectations + legacy apicars shape)
    price: ad.price || 0,
    original_price_krw: ad.price ? ad.price * 10000 : 0,
    currency: 'KRW',
    mileage: spec.mileage || 0,
    displacement: spec.displacement || 0,
    fuelType: tx.fuel(spec.fuelName),
    fuel_type: tx.fuel(spec.fuelName),
    fuel_mn: tx.fuel(spec.fuelName, 'mn'),
    transmission: tx.transmission(spec.transmissionName),
    transmission_mn: tx.transmission(spec.transmissionName, 'mn'),
    color: tx.color(spec.colorName),
    color_mn: tx.color(spec.colorName, 'mn'),
    body_type: tx.body(spec.bodyName),
    body_type_mn: tx.body(spec.bodyName, 'mn'),
    seat_count: spec.seatCount || 0,
    vin: d.vin || '',
    location: (d.contact && d.contact.address) || '',
    location_mn: tx.region((d.contact && d.contact.address) || '', 'mn'),
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
// Browser/CDN: cache fresh for 48h (172800s), stale-while-revalidate for 7 days.
// CDN gets one upstream hit per 48h window per cache key (filter combo);
// browsers reuse the same response on refresh until it expires.
const CACHE_HEADER = 'public, max-age=172800, stale-while-revalidate=604800'

// Throttled detail enrichment: for cars whose title still contains
// Korean after the dictionary pass, fetch the detail endpoint (which
// returns English manufacturer/model/grade) and overwrite the title.
async function enrichWithDetailIfKorean(item) {
  if (!models.hasKorean(item.title)) return item
  try {
    const d = await cachedGet(`https://api.encar.com/v1/readside/vehicle/${item.encar_id}`)
    const cat = d.category || {}
    const brand = cat.manufacturerEnglishName || item.brand
    const model = cat.modelGroupEnglishName || item.model
    const grade = cat.gradeEnglishName || item.badge
    const trim = cat.gradeDetailEnglishName || ''
    item.brand = brand
    item.model = model
    item.badge = grade
    item.badge_detail = trim
    item.title = [brand, model, grade, trim].filter(Boolean).join(' ')
  } catch (err) {
    // leave the item as-is on failure
  }
  return item
}

async function enrichInBatches(items, concurrency = 8) {
  const result = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const settled = await Promise.all(batch.map(enrichWithDetailIfKorean))
    result.push(...settled)
  }
  return result
}

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
    let cars = (raw.SearchResults || []).map(normalizeListItem)
    cars = await enrichInBatches(cars, 8)
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
