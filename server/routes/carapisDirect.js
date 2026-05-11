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

// ===== English → Mongolian / cleaned-up English value maps =====
// Carapis returns lower-case English values (gasoline / auto / sedan / white).

const FUEL_MN = {
  gasoline: 'Бензин',
  diesel: 'Дизель',
  hybrid: 'Hybrid',
  electric: 'Цахилгаан',
  lpg: 'Газ',
  hydrogen: 'Устөрөгч',
  cng: 'Газ (CNG)',
}
const FUEL_EN = {
  gasoline: 'Gasoline', diesel: 'Diesel', hybrid: 'Hybrid',
  electric: 'Electric', lpg: 'LPG', hydrogen: 'Hydrogen', cng: 'CNG',
}
const TRANS_MN = {
  auto: 'Автомат',
  manual: 'Механик',
  cvt: 'CVT',
  semi_auto: 'Хагас автомат',
  dct: 'DCT',
}
const TRANS_EN = { auto: 'Auto', manual: 'Manual', cvt: 'CVT', semi_auto: 'Semi-Auto', dct: 'DCT' }
const BODY_MN = {
  sedan: 'Седан',
  suv: 'SUV',
  hatchback: 'Хэтчбэк',
  coupe: 'Купе',
  wagon: 'Вагон',
  minivan: 'Мини вэн',
  van: 'Вэн',
  truck: 'Ачааны',
  convertible: 'Кабриолет',
  crossover: 'Кроссовер',
  pickup: 'Пикап',
  bus: 'Автобус',
  compact: 'Жижиг',
  midsize: 'Дунд хэмжээний седан',
  fullsize: 'Том седан',
  mini: 'Мини / Хотын жижиг',
  sports: 'Спорт',
  unknown: '—',
}
const BODY_EN = {
  sedan: 'Sedan', suv: 'SUV', hatchback: 'Hatchback', coupe: 'Coupe',
  wagon: 'Wagon', minivan: 'Minivan', van: 'Van', truck: 'Truck',
  convertible: 'Convertible', crossover: 'Crossover', pickup: 'Pickup',
  bus: 'Bus', compact: 'Compact', midsize: 'Midsize Sedan',
  fullsize: 'Full-size Sedan', mini: 'Mini', sports: 'Sports', unknown: '—',
}
const COLOR_MN = {
  white: 'Цагаан', black: 'Хар', gray: 'Саарал', silver: 'Мөнгөн',
  blue: 'Хөх', red: 'Улаан', orange: 'Улбар шар', brown: 'Бор',
  beige: 'Беж', yellow: 'Шар', green: 'Ногоон', purple: 'Нил',
  pink: 'Ягаан', gold: 'Алтан', pearl: 'Сувдан цагаан',
  navy: 'Гүн хөх', maroon: 'Бордов', tan: 'Шаргал', burgundy: 'Бордов',
  unknown: '—',
}
const COLOR_EN = {
  white: 'White', black: 'Black', gray: 'Gray', silver: 'Silver',
  blue: 'Blue', red: 'Red', orange: 'Orange', brown: 'Brown',
  beige: 'Beige', yellow: 'Yellow', green: 'Green', purple: 'Purple',
  pink: 'Pink', gold: 'Gold', pearl: 'Pearl', navy: 'Navy',
  maroon: 'Maroon', tan: 'Tan', burgundy: 'Burgundy', unknown: '—',
}
const REGION_MN = {
  Seoul: 'Сөүл', Busan: 'Бусан', Daegu: 'Тэгү', Incheon: 'Инчон',
  Daejeon: 'Тэжон', Gwangju: 'Гванжү', Ulsan: 'Ульсан', Sejong: 'Сэжон',
  Gyeonggi: 'Кёнги', Gangwon: 'Канвон', Jeju: 'Жэжү',
  Gyeongnam: 'Кёнсан Намбу',
  Gyeongbuk: 'Кёнсан Хойт',
  Jeonnam: 'Жолла Намбу',
  Jeonbuk: 'Жолла Хойт',
  Chungnam: 'Чүнчон Намбу',
  Chungbuk: 'Чүнчон Хойт',
}

const lc = (s) => (s == null ? '' : String(s).toLowerCase())
const fuel = (v, lang) => (lang === 'mn' ? FUEL_MN : FUEL_EN)[lc(v)] || titleCase(v)
const trans = (v, lang) => (lang === 'mn' ? TRANS_MN : TRANS_EN)[lc(v)] || titleCase(v)
const body = (v, lang) => (lang === 'mn' ? BODY_MN : BODY_EN)[lc(v)] || titleCase(v)
const color = (v, lang) => (lang === 'mn' ? COLOR_MN : COLOR_EN)[lc(v)] || titleCase(v)
const region = (v, lang) => {
  if (!v) return ''
  const friendly = (lang === 'mn' ? REGION_MN : null)?.[v] || v
  return lang === 'mn' ? `БНСУ, ${friendly}` : `${friendly}, South Korea`
}

// Carapis brand/model come in mixed case (e.g. "Bmw"). Convert to nice
// Title Case but keep all-caps brands (BMW, KGM, GMC) properly.
function titleCase(s) {
  if (!s) return s
  const ALL_CAPS = new Set(['BMW', 'GMC', 'KGM', 'BYD', 'DS'])
  return String(s)
    .split(/\s+/)
    .map((w) => {
      if (!w) return w
      const upper = w.toUpperCase()
      if (ALL_CAPS.has(upper)) return upper
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

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

function normalizeList(v) {
  const brand = titleCase(v.brand?.name || '')
  const model = titleCase(v.model?.name || '')
  const displayName = v.display_name ? titleCase(v.display_name.replace(/\(\d+\)/, '').trim()) + (v.year ? ` (${v.year})` : '') : `${brand} ${model}`.trim()
  return {
    id: v.id,
    encar_id: v.listing_id || v.id,
    title: displayName,
    brand,
    model,
    badge: v.trim || '',
    badge_detail: v.generation || '',
    year: v.year || 0,
    // Frontend toMnt() expects KRW prices in 万원 (10,000 KRW units).
    price: v.price ? Math.round(Number(v.price) / 10000) : 0,
    original_price_krw: Number(v.price) || 0,
    currency: 'KRW',
    mileage: v.mileage || 0,
    displacement: v.engine_cc || 0,
    fuelType: fuel(v.fuel_type, 'en'),
    fuel_type: fuel(v.fuel_type, 'en'),
    fuel_mn: fuel(v.fuel_type, 'mn'),
    transmission: trans(v.transmission, 'en'),
    transmission_mn: trans(v.transmission, 'mn'),
    color: color(v.color, 'en'),
    color_mn: color(v.color, 'mn'),
    body_type: body(v.body_type, 'en'),
    body_type_mn: body(v.body_type, 'mn'),
    seat_count: v.seat_count || 0,
    location: region(v.region, 'en'),
    location_mn: region(v.region, 'mn'),
    image: absoluteUrlToProxyUrl(v.main_photo_url || v.preview_photos?.[0]?.url || ''),
    images: (v.preview_photos || []).map((p) => absoluteUrlToProxyUrl(p.url)),
  }
}

function normalizeDetail(v) {
  const brand = titleCase(v.brand?.name || '')
  const model = titleCase(v.model?.name || '')
  const displayName = v.display_name ? titleCase(v.display_name.replace(/\(\d+\)/, '').trim()) + (v.year ? ` (${v.year})` : '') : `${brand} ${model}`.trim()
  return {
    id: v.id,
    encar_id: v.listing_id || v.id,
    title: displayName,
    brand,
    model,
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
    fuelType: fuel(v.fuel_type, 'en'),
    fuel_type: fuel(v.fuel_type, 'en'),
    fuel_mn: fuel(v.fuel_type, 'mn'),
    transmission: trans(v.transmission, 'en'),
    transmission_mn: trans(v.transmission, 'mn'),
    color: color(v.color, 'en'),
    color_mn: color(v.color, 'mn'),
    body_type: body(v.body_type, 'en'),
    body_type_mn: body(v.body_type, 'mn'),
    seat_count: v.seat_count || 0,
    vin: v.vin || '',
    location: region(v.region, 'en'),
    location_mn: region(v.region, 'mn'),
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

// Body types we consider "Тусгай ангилал" (commercial / utility).
const SPECIAL_BODY_TYPES = ['truck', 'van', 'minivan', 'pickup', 'bus']

function buildListUrl(query, opts = {}) {
  // strip cache-buster
  delete query.v
  const u = new URL(`${CARAPIS_BASE}/vehicles/`)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)))
  u.searchParams.set('page', page)
  u.searchParams.set('page_size', limit)
  if (query.brand) u.searchParams.set('brand', String(query.brand).toLowerCase())
  if (query.model) u.searchParams.set('model', String(query.model).toLowerCase())
  if (query.yearFrom) u.searchParams.set('min_year', query.yearFrom)
  if (query.yearTo) u.searchParams.set('max_year', query.yearTo)
  if (query.priceFrom) u.searchParams.set('min_price', Math.round(Number(query.priceFrom) * 10000))
  if (query.priceTo) u.searchParams.set('max_price', Math.round(Number(query.priceTo) * 10000))
  if (query.fuelType) u.searchParams.set('fuel_type', String(query.fuelType).toLowerCase())
  if (query.transmission) u.searchParams.set('transmission', String(query.transmission).toLowerCase())
  if (query.maxMileage) u.searchParams.set('max_mileage', query.maxMileage)
  if (opts.bodyType) u.searchParams.set('body_type', opts.bodyType)
  return u.toString()
}

router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', CACHE_HEADER)

    // Тусгай ангилал: fetch each commercial body_type in parallel
    // and merge into one combined list. Sort & paginate locally.
    if (req.query.vehicleType === 'special') {
      const results = await Promise.all(
        SPECIAL_BODY_TYPES.map((bt) =>
          cachedGet(buildListUrl({ ...req.query, page: 1, limit: 100 }, { bodyType: bt }))
            .catch(() => ({ results: [] }))
        )
      )
      const merged = results.flatMap((r) => r.results || []).map(normalizeList)
      // Sort newest first (by year then mileage)
      merged.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.mileage || 0) - (b.mileage || 0))
      const page = Math.max(1, Number(req.query.page || 1))
      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
      const start = (page - 1) * limit
      return res.json({
        cars: merged.slice(start, start + limit),
        total: merged.length,
        page,
        totalPages: Math.max(1, Math.ceil(merged.length / limit)),
      })
    }

    const raw = await cachedGet(buildListUrl(req.query))
    res.json({
      cars: (raw.results || []).map(normalizeList),
      total: raw.count || 0,
      page: raw.page || Number(req.query.page || 1),
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
