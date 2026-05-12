const express = require('express')
const { listVehicles, getVehicle, getValuation } = require('../lib/carapis')

const router = express.Router()
const CACHE_HEADER = 'public, max-age=300, stale-while-revalidate=86400'

// Encar listing_id (8-9 digit) ↔ Carapis UUID resolver. Carapis нь
// listing_id-аар хайх боломжгүй; жагсаалт буцаах болгонд бүх машинд
// map-аа шинэчилнэ. Жагсаалтаас сонгох flow-д амжилттай. Direct deep-
// link map дотор байхгүй машинд 404 буцаана.
const listingToUuid = new Map()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LISTING_RE = /^\d{6,}$/

function rememberListing(v) {
  if (!v) return
  const lid = v.listing_id
  if (lid && v.id) listingToUuid.set(String(lid), v.id)
}

function resolveCarId(raw) {
  if (!raw) return null
  if (UUID_RE.test(raw)) return raw
  if (LISTING_RE.test(raw)) return listingToUuid.get(raw) || null
  return null
}

// ===== Normalisation =====

function titleCase(s) {
  if (!s) return ''
  return String(s)
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

const FUEL_MAP = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
  plug_hybrid: 'Plug-in Hybrid',
  lpg: 'LPG',
  cng: 'CNG',
  hydrogen: 'Hydrogen',
}

function fuelLabel(s) {
  return FUEL_MAP[String(s || '').toLowerCase()] || titleCase(s)
}

const TRANS_MAP = {
  auto: 'Automatic',
  automatic: 'Automatic',
  manual: 'Manual',
  cvt: 'CVT',
  semi_auto: 'Semi-Automatic',
  dct: 'DCT',
}

function transmissionLabel(s) {
  return TRANS_MAP[String(s || '').toLowerCase()] || titleCase(s)
}

function dealerLabel(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'private' || v === 'personal') return 'PERSONAL'
  if (v === 'dealer' || v === 'company') return 'DEALER'
  return ''
}

function buildTitle(v) {
  const brand = titleCase(v.brand_name || '')
  const model = titleCase(v.model_name || '')
  const base = `${brand} ${model}`.trim()
  return v.year ? `${base} (${v.year})` : base
}

// Carapis photos нь object array: {url, thumb_url, is_main, photo_type,
// position, width, height}. Хуучин string[] хэлбэрийг ч дэмжинэ. Position-
// аар sort + is_main-ыг эхэндээ оруулна.
function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return []
  const items = photos
    .map((p) => {
      if (typeof p === 'string') return { url: p, thumb_url: p, is_main: false, position: 0, photo_type: '' }
      if (!p || !p.url) return null
      return {
        url: p.url,
        thumb_url: p.thumb_url || p.url,
        is_main: !!p.is_main,
        position: Number(p.position) || 0,
        photo_type: p.photo_type || '',
      }
    })
    .filter(Boolean)
  // is_main эхэндээ, дараа position-аар
  items.sort((a, b) => {
    if (a.is_main !== b.is_main) return a.is_main ? -1 : 1
    return a.position - b.position
  })
  return items
}

function normalize(v) {
  const photoList = normalizePhotos(v.photos)
  const urls = photoList.map((p) => p.url)
  const thumbs = photoList.map((p) => p.thumb_url)
  return {
    id: v.id,
    title: buildTitle(v),
    brand: titleCase(v.brand_name || ''),
    model: titleCase(v.model_name || ''),
    trim: v.trim || '',
    generation: v.generation || '',
    year: v.year || 0,
    price: Number(v.price_usd) || 0,
    currency: 'USD',
    mileage: Number(v.mileage) || 0,
    fuelType: fuelLabel(v.fuel_type),
    transmission: transmissionLabel(v.transmission),
    location: v.region || 'South Korea',
    region: v.region || '',
    source: v.source_slug || 'encar',
    image: urls[0] || '',
    images: urls,
    thumbnails: thumbs,
    photos: photoList,
    type: '',
    body_type: v.body_type || '',
    color: v.color || '',
    encar_id: v.listing_id || v.id,
    listing_url: v.listing_url || '',
    vin: v.vin || '',
    description: v.description || '',
    displacement: Number(v.engine_cc) || 0,
    vehicle_no: v.vehicle_no || '',
    drive_type: v.drive_type || '',
    seat_count: v.seat_count || null,
    has_accident: !!v.has_accident,
    has_recall: !!v.has_recall,
    has_simple_repair: !!v.has_simple_repair,
    recall_fulfilled: !!v.recall_fulfilled,
    inspection_passed: v.inspection_passed === true ? true : v.inspection_passed === false ? false : null,
    warranty_type: v.warranty_type || '',
    owner_count: v.owner_count || null,
    dealer_type: dealerLabel(v.seller_type),
    is_undervalued: !!v.is_undervalued,
    valuation_score: v.valuation_score == null ? null : Number(v.valuation_score),
    is_new_vehicle: !!v.is_new_vehicle,
    is_verified: !!v.is_verified,
    is_masked: !!v.is_masked,
    advertisement_status: v.is_available ? 'ADVERTISE' : '',
    first_seen_at: v.first_seen_at || null,
    last_seen_at: v.last_seen_at || null,
    status_changed_at: v.status_changed_at || null,
  }
}

// ===== Filters =====
// Carapis docs (2026-05-13)-ийн дагуу зөвшөөрөгдсөн query параметрүүд:
//   body_type, brand, color, fuel_type, has_accident, inspection_passed,
//   is_new_vehicle, max_mileage, max_price, max_year, min_mileage,
//   min_price, min_year, model, ordering, page, page_size, search,
//   source, transmission

// Frontend нь "Mercedes" эсвэл "Mercedes-Benz" дамжуулдаг. Carapis нь
// slug — lowercase, space → dash — хүлээж байна. Богино alias-уудыг
// official slug-руу зураглаж нэмэгдсэн нэрсийг dashify.
const BRAND_ALIAS = {
  mercedes: 'mercedes-benz',
  benz: 'mercedes-benz',
  vw: 'volkswagen',
  'rolls royce': 'rolls-royce',
  rollsroyce: 'rolls-royce',
  'land rover': 'land-rover',
  'aston martin': 'aston-martin',
  'renault samsung': 'renault-samsung',
  'renault korea': 'renault-korea',
}
function slugifyBrand(s) {
  const lower = String(s || '').trim().toLowerCase()
  if (BRAND_ALIAS[lower]) return BRAND_ALIAS[lower]
  return lower.replace(/\s+/g, '-')
}

function passthroughBool(v) {
  if (v === undefined || v === '') return undefined
  if (v === true || v === 'true' || v === '1') return 'true'
  if (v === false || v === 'false' || v === '0') return 'false'
  return undefined
}

function buildCarapisParams(q) {
  const params = {
    page: Math.max(1, Number(q.page || 1)),
    page_size: Math.min(100, Math.max(1, Number(q.limit || 20))),
    source: q.source || 'encar',
  }
  if (q.brand) params.brand = slugifyBrand(q.brand)
  if (q.model) params.model = q.model
  if (q.color) params.color = String(q.color).toLowerCase()
  if (q.yearFrom) params.min_year = q.yearFrom
  if (q.yearTo) params.max_year = q.yearTo
  if (q.priceFrom) params.min_price = q.priceFrom
  if (q.priceTo) params.max_price = q.priceTo
  if (q.fuelType) params.fuel_type = String(q.fuelType).toLowerCase()
  if (q.transmission) params.transmission = String(q.transmission).toLowerCase()
  if (q.body_type) params.body_type = String(q.body_type).toLowerCase()
  if (q.minMileage) params.min_mileage = q.minMileage
  if (q.maxMileage) params.max_mileage = q.maxMileage
  if (q.search) params.search = q.search
  const hasAcc = passthroughBool(q.hasAccident)
  if (hasAcc !== undefined) params.has_accident = hasAcc
  const insp = passthroughBool(q.inspectionPassed)
  if (insp !== undefined) params.inspection_passed = insp
  const isNew = passthroughBool(q.isNewVehicle)
  if (isNew !== undefined) params.is_new_vehicle = isNew
  // ordering
  if (q.sortBy) {
    const FIELD = { year: 'year', price: 'price_usd', mileage: 'mileage', scraped_at: 'first_seen_at' }
    const field = FIELD[String(q.sortBy)]
    if (field) {
      const sign = String(q.sortOrder || 'desc') === 'asc' ? '' : '-'
      params.ordering = sign + field
      // DRF nullable ordering — null-уудыг -year үед хамгийн их гэж үздэг.
      // min_year=1990 нэмэх энэ муухай эффектийг бууруулна.
      if (field === 'year' && sign === '-' && !params.min_year) params.min_year = 1990
    }
  }
  return params
}

// ===== Routes =====

// GET /api/cars — жагсаалт
router.get('/', async (req, res) => {
  try {
    const raw = await listVehicles(buildCarapisParams(req.query))
    const results = raw.results || []
    results.forEach(rememberListing)
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars: results.map(normalize),
      total: raw.count || 0,
      page: raw.page || 1,
      totalPages: raw.pages || 1,
    })
  } catch (err) {
    console.error('carapis list error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/stats — нийт машины тоо (Encar listing)
router.get('/stats', async (_req, res) => {
  try {
    const raw = await listVehicles({ page_size: 1, source: 'encar' })
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      totalCars: raw.count || 0,
      highestCarNumber: raw.count || 0,
      carsByWebsite: [{ website: 'carapis', count: raw.count || 0 }],
    })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/:id — detail (id нь UUID эсвэл Encar listing_id)
router.get('/:id', async (req, res) => {
  try {
    const uuid = resolveCarId(req.params.id)
    if (!uuid) return res.status(404).json({ error: 'unknown carId' })
    const raw = await getVehicle(uuid)
    rememberListing(raw)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalize(raw))
  } catch (err) {
    if (/404/.test(err.message)) return res.status(404).json({ error: 'unknown carId' })
    console.error('carapis detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/:id/full — detail + AI valuation (parallel + valuation timeout 3s)
router.get('/:id/full', async (req, res) => {
  try {
    const uuid = resolveCarId(req.params.id)
    if (!uuid) return res.status(404).json({ error: 'unknown carId' })
    const [raw, valuation] = await Promise.all([
      getVehicle(uuid),
      getValuation(uuid).catch((e) => {
        if (!/timeout/i.test(e.message)) console.warn('valuation fail:', e.message)
        return null
      }),
    ])
    rememberListing(raw)
    res.set('Cache-Control', CACHE_HEADER)
    res.json({ ...normalize(raw), valuation })
  } catch (err) {
    if (/404/.test(err.message)) return res.status(404).json({ error: 'unknown carId' })
    console.error('carapis detail/full error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// POST /api/cars/pricing-breakdown — placeholder
// Frontend нь үнэ + татварыг өөрөө client-side бодож байна.
router.post('/pricing-breakdown', (req, res) => {
  const price = Number(req.body?.originalPrice) || 0
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
