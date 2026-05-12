const express = require('express')
const { listVehicles, getVehicle, getValuation } = require('../lib/carapis')

const router = express.Router()
const CACHE_HEADER = 'public, max-age=300, stale-while-revalidate=86400'

// Encar listing_id (8-9 digit) ↔ Carapis UUID resolver.
// Carapis нь listing_id-аар хайх боломжгүй (filter ажиллахгүй, search нь
// text field-ээр хайдаг). Тиймээс жагсаалт буцаах болгонд бүх машинд
// map-аа шинэчилнэ. Хэрэглэгч жагсаалтаас машин сонгох тохиолдолд
// resolve амжилттай. Direct deep-link (refresh, share) үед map дотор
// байхгүй машинд 404 буцаана.
const listingToUuid = new Map()
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const LISTING_RE = /^\d{6,}$/

function rememberListing(carapisVehicle) {
  if (!carapisVehicle) return
  const lid = carapisVehicle.listing_id
  const uuid = carapisVehicle.id
  if (lid && uuid) listingToUuid.set(String(lid), uuid)
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
  return String(s).split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

const FUEL_MAP = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  electric: 'Electric',
  hybrid: 'Hybrid',
  lpg: 'LPG',
}

function fuelLabel(s) {
  return FUEL_MAP[String(s || '').toLowerCase()] || titleCase(s)
}

function transmissionLabel(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'auto' || v === 'automatic') return 'Automatic'
  if (v === 'manual') return 'Manual'
  return titleCase(s)
}

function buildTitle(v) {
  const brand = titleCase(v.brand_name || '')
  const model = titleCase(v.model_name || '')
  const base = `${brand} ${model}`.trim()
  return v.year ? `${base} (${v.year})` : base
}

// Carapis photos нь шинээр {url, thumb_url, is_main, photo_type, position, ...}
// object[] хэлбэртэй ирдэг болсон. Хуучин string[] хэлбэрийг ч дэмжинэ.
function photoUrls(photos) {
  if (!Array.isArray(photos)) return []
  return photos
    .map((p) => (typeof p === 'string' ? p : p && p.url))
    .filter(Boolean)
}

function normalize(v) {
  const photos = photoUrls(v.photos)
  return {
    id: v.id,
    title: buildTitle(v),
    brand: titleCase(v.brand_name || ''),
    model: titleCase(v.model_name || ''),
    year: v.year || 0,
    price: Number(v.price_usd) || 0,
    currency: 'USD',
    mileage: Number(v.mileage) || 0,
    fuelType: fuelLabel(v.fuel_type),
    transmission: transmissionLabel(v.transmission),
    location: v.region || 'South Korea',
    image: photos[0] || '',
    images: photos,
    type: '',
    body_type: v.body_type || '',
    color: v.color || '',
    encar_id: v.listing_id || v.id,
    listing_url: v.listing_url || '',
    vin: v.vin || '',
    description: v.description || '',
    trim: v.trim || '',
    // Шинэ Carapis field-үүд (2026-05-13 update). Frontend convention-аар нэрлэе.
    displacement: Number(v.engine_cc) || 0,
    vehicle_no: v.vehicle_no || '',
    original_msrp: v.original_msrp ? Number(v.original_msrp) : null,
    drive_type: v.drive_type || '',
    seat_count: v.seat_count || null,
    has_accident: !!v.has_accident,
    has_recall: !!v.has_recall,
    has_simple_repair: !!v.has_simple_repair,
    dealer_type: dealerLabel(v.seller_type), // SpecGrid `car.dealer_type` хайдаг
    is_undervalued: !!v.is_undervalued,
    valuation_score: v.valuation_score == null ? null : Number(v.valuation_score),
    is_new_vehicle: !!v.is_new_vehicle,
    advertisement_status: v.is_available ? 'ADVERTISE' : '',
  }
}

function dealerLabel(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'private' || v === 'personal') return 'PERSONAL'
  if (v === 'dealer' || v === 'company') return 'DEALER'
  return ''
}

// Frontend-аас ирсэн query-г Carapis param-руу зураглах.
// Хийгдсэн filter-ууд (Денис 2026-05-13 fix):
//   brand, min_year, max_year, min_price, max_price (USD),
//   fuel_type, body_type, transmission, max_mileage, search, ordering,
//   source (default 'encar' учир бид зөвхөн Encar listing-ийг үзүүлдэг)
function buildCarapisParams(q) {
  const params = {
    page: Math.max(1, Number(q.page || 1)),
    page_size: Math.min(100, Math.max(1, Number(q.limit || 20))),
    source: q.source || 'encar',
  }
  if (q.brand) params.brand = String(q.brand).toLowerCase()
  if (q.model) params.model = q.model
  if (q.yearFrom) params.min_year = q.yearFrom
  if (q.yearTo) params.max_year = q.yearTo
  if (q.priceFrom) params.min_price = q.priceFrom
  if (q.priceTo) params.max_price = q.priceTo
  if (q.fuelType) params.fuel_type = String(q.fuelType).toLowerCase()
  if (q.transmission) params.transmission = String(q.transmission).toLowerCase()
  if (q.body_type) params.body_type = String(q.body_type).toLowerCase()
  if (q.maxMileage) params.max_mileage = q.maxMileage
  if (q.search) params.search = q.search
  // ordering: frontend нь sortBy=year|price|mileage + sortOrder=asc|desc
  // Carapis нь Django REST style "-field" буюу "field" дэмжинэ.
  if (q.sortBy) {
    const FIELD = { year: 'year', price: 'price_usd', mileage: 'mileage', scraped_at: 'first_seen_at' }
    const field = FIELD[String(q.sortBy)]
    if (field) {
      const sign = String(q.sortOrder || 'desc') === 'asc' ? '' : '-'
      params.ordering = sign + field
      // Carapis-ийн DRF ordering нь NULL-ыг хамгийн их гэж үздэг учир -year
      // үед year=null машинууд эхэндээ гарна. Хэрвээ filter дамжуулаагүй
      // нөхцөлд default min_year=1990 нэмж энэ муухай эффектийг хасна.
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

// GET /api/cars/:id/full — detail + AI valuation (parallel fetch)
router.get('/:id/full', async (req, res) => {
  try {
    const uuid = resolveCarId(req.params.id)
    if (!uuid) return res.status(404).json({ error: 'unknown carId' })
    const [raw, valuation] = await Promise.all([
      getVehicle(uuid),
      getValuation(uuid).catch((e) => { console.warn('valuation fail:', e.message); return null }),
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

// POST /api/cars/pricing-breakdown — placeholder (frontend бодолтоо хийдэг)
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
