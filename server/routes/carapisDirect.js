const express = require('express')
const { listVehicles, getVehicle, getValuation } = require('../lib/carapis')

const router = express.Router()
const CACHE_HEADER = 'public, max-age=300, stale-while-revalidate=86400'

// ===== Normalisation =====

function titleCase(s) {
  if (!s) return ''
  return String(s).split(/[\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

// Carapis fuel_type-ийг frontend label руу хөрвүүлэх.
// Frontend нь "Gasoline", "Diesel", "Electric", "Hybrid", "LPG" хүлээж байна.
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

function normalize(v) {
  const photos = Array.isArray(v.photos) ? v.photos : []
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
    location: 'South Korea',
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
  }
}

// ===== Routes =====

// GET /api/cars — жагсаалт
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    // Carapis API дээр одоохондоо зөвхөн page, page_size, ordering, search
    // дэмжигдэж байна. Бусад frontend filter (brand, year, fuel...) нь Carapis-аас
    // нөлөөгүй — Денис filter syntax буцааж өгөх хүртэл no-op.
    const raw = await listVehicles({
      page,
      page_size: limit,
      search: req.query.search || undefined,
      ordering: req.query.ordering || undefined,
    })
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars: (raw.results || []).map(normalize),
      total: raw.count || 0,
      page: raw.page || page,
      totalPages: raw.pages || 1,
    })
  } catch (err) {
    console.error('carapis list error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/stats — нийт машины тоо
router.get('/stats', async (_req, res) => {
  try {
    const raw = await listVehicles({ page_size: 1 })
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

// GET /api/cars/:id — нэг машины detail
router.get('/:id', async (req, res) => {
  try {
    const raw = await getVehicle(req.params.id)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalize(raw))
  } catch (err) {
    if (/404/.test(err.message)) return res.status(404).json({ error: 'unknown carId' })
    console.error('carapis detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/:id/full — detail + AI valuation
router.get('/:id/full', async (req, res) => {
  try {
    const raw = await getVehicle(req.params.id)
    const base = normalize(raw)
    let valuation = null
    try {
      valuation = await getValuation(req.params.id)
    } catch (e) {
      // valuation бэлэн биш бол detail-ыг буцаа
      console.warn('valuation fail:', e.message)
    }
    res.set('Cache-Control', CACHE_HEADER)
    res.json({ ...base, valuation })
  } catch (err) {
    if (/404/.test(err.message)) return res.status(404).json({ error: 'unknown carId' })
    console.error('carapis detail/full error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// POST /api/cars/pricing-breakdown — placeholder.
// Frontend нь үнэ + татварыг өөрөө client-side бодож байна (CarDetail.new.tsx),
// энэ endpoint нь хуучин API surface-ыг хадгалахын тулд л үлдсэн.
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
