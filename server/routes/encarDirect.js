const express = require('express')
const { searchVehicles, searchTrucks, getVehicle } = require('../lib/encar')
const { translateModel, learn: learnModel } = require('../lib/encarModelDict')
const ExchangeRate = require('../models/ExchangeRate')
const {
  BRAND_EN_TO_KO,
  BRAND_KO_TO_EN,
  FUEL_KO_TO_EN,
  FUEL_EN_TO_KO,
  TRANS_KO_TO_EN,
  TRANS_EN_TO_KO,
  COLOR_EN_TO_KO,
  COLOR_KO_TO_EN,
  BODY_KO_TO_EN,
  REGION_KO_TO_MN,
  encodeQueryValue,
} = require('../lib/encarMaps')

const router = express.Router()

// 24 цагийн browser+CDN cache. Backend нь Encar-ийн хариуг 24h хадгалдаг тул
// хэрэглэгчдийн хооронд хуваалцана.
const CACHE_HEADER = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
const ENCAR_CDN = 'https://ci.encar.com'
// impolicy=widthRate&rw=… дамжуулахад 640×360 thumbnail-ийн оронд бүтэн HD
// зургийг буцаана. Жагсаалтын thumbnail-д param-гүй (жижиг) URL ашиглана.
const HD_SUFFIX = '?impolicy=widthRate&rw=1200'

// ===== Exchange rate (USD price filter → 만원 хөрвүүлэлт) =====
let rateCache = { wonToMnt: 2.8, usdToMnt: 3450, time: 0 }
async function getRates() {
  if (Date.now() - rateCache.time < 10 * 60 * 1000) return rateCache
  try {
    const r = await ExchangeRate.findOne().sort({ updatedAt: -1 }).lean()
    if (r && r.wonToMnt && r.usdToMnt) {
      rateCache = { wonToMnt: r.wonToMnt, usdToMnt: r.usdToMnt, time: Date.now() }
    } else {
      rateCache.time = Date.now()
    }
  } catch {
    rateCache.time = Date.now()
  }
  return rateCache
}

// USD → 만원 (Encar Price нэгж). Frontend нь priceFrom/priceTo-г MNT-аас USD
// руу хөрвүүлж илгээдэг тул эргүүлж 만원 болгоно.
function usdToManwon(usd, rates) {
  if (!usd || !rates.usdToMnt || !rates.wonToMnt) return null
  return Math.max(0, Math.round((Number(usd) * rates.usdToMnt) / rates.wonToMnt / 10000))
}

// ===== Encar query DSL builder =====
// leaf(key,val) → "Key.<encoded-val>."  утгыг URL-safe болгож encode хийнэ
// group(op,kids) → "(Op.kid1_.kid2_.kid3)"  (kids нь "_." -аар холбогдоно)
// Бүтцийн хаалт/цэгүүд literal хэвээр — query-г ДАХИН encode хийхгүй (encar.js).
const leaf = (k, v) => `${k}.${encodeQueryValue(v)}.`
const rawLeaf = (k, v) => `${k}.${v}.` // range, CarType зэрэг ASCII-safe бүтцийн утга
const group = (op, kids) => `(${op}.` + kids.join('_.') + ')'

function categoryGroup(brandKo, modelName) {
  const carType = rawLeaf('CarType', 'A')
  if (modelName) {
    const inner = group('C', [leaf('Manufacturer', brandKo), leaf('Model', modelName)])
    return group('C', [carType, inner])
  }
  return group('C', [carType, leaf('Manufacturer', brandKo)])
}

function yearRange(from, to) {
  // Encar Year нь YYYYMM (жишээ 202211). Frontend YYYY илгээнэ.
  const lo = from ? `${from}00` : ''
  const hi = to ? `${to}12` : ''
  if (!lo && !hi) return null
  return `range(${lo}..${hi})`
}

function numRange(min, max) {
  if (min == null && max == null) return null
  return `range(${min != null ? min : ''}..${max != null ? max : ''})`
}

function buildQuery(q, rates) {
  const kids = [rawLeaf('Hidden', 'N')]

  const brandKo = q.brand ? BRAND_EN_TO_KO[String(q.brand).trim().toLowerCase()] || null : null
  // model-ийг Encar-ийн харуулсан нэрээр (жагсаалтаас ирсэн) шууд дамжуулна.
  const modelName = q.model ? String(q.model).trim() : null
  if (brandKo) kids.push(categoryGroup(brandKo, modelName))

  const yr = yearRange(q.yearFrom, q.yearTo)
  if (yr) kids.push(rawLeaf('Year', yr))

  const minMan = usdToManwon(q.priceFrom, rates)
  const maxMan = usdToManwon(q.priceTo, rates)
  const pr = numRange(minMan, maxMan)
  if (pr) kids.push(rawLeaf('Price', pr))

  const ml = numRange(
    q.minMileage ? Number(q.minMileage) : null,
    q.maxMileage ? Number(q.maxMileage) : null
  )
  if (ml) kids.push(rawLeaf('Mileage', ml))

  if (q.fuelType) {
    const ko = FUEL_EN_TO_KO[String(q.fuelType).trim().toLowerCase()]
    if (ko) kids.push(leaf('FuelType', ko))
  }
  if (q.transmission) {
    const ko = TRANS_EN_TO_KO[String(q.transmission).trim().toLowerCase()]
    if (ko) kids.push(leaf('Transmission', ko))
  }
  if (q.color) {
    const ko = COLOR_EN_TO_KO[String(q.color).trim().toLowerCase()]
    if (ko) kids.push(leaf('Color', ko))
  }
  // Зөвхөн осолгүй: Encar нь "Record" condition-той (тоо бүртгэлтэй) машинуудыг
  // шүүх боломжтой — гэхдээ нарийн DSL шаардана. Одоохондоо алгасна.

  return group('And', kids)
}

// ===== Тусгай ангилал (ачааны машин) =====
// Truck API нь зорчигчийн машинаас тусдаа facet-той: CarType wrapper БАЙХГҮЙ
// (Manufacturer-ийг шууд leaf болгоно), Kia нь "기아(아시아)", model нэрс нь
// солонгосоор олон хувилбартай (포터 Ⅱ/포터, 봉고Ⅲ/더 뉴 봉고Ⅲ…) тул Or-group
// ашиглана. Year/Price/Mileage range нь car API-тай ИЖИЛ форматтай.
const TRUCK_BRAND_EN_TO_KO = {
  hyundai: '현대',
  kia: '기아(아시아)',
  'tata daewoo': '타타대우',
  'tata-daewoo': '타타대우',
  daewoo: '타타대우',
}
const TRUCK_BRAND_KO_TO_EN = {
  현대: 'Hyundai',
  '기아(아시아)': 'Kia',
  타타대우: 'Tata Daewoo',
}
// Frontend chip (англи) → Encar-ийн солонгос Model утгуудын жагсаалт (Or-group).
const TRUCK_MODEL_EN_TO_KO = {
  porter: ['포터 Ⅱ', '포터'],
  bongo: ['봉고Ⅲ', '더 뉴 봉고Ⅲ', '봉고프론티어'],
  mighty: ['올 뉴 마이티', 'e마이티', '마이티 큐티', '마이티'],
  'mega truck': ['메가트럭'],
  megatruck: ['메가트럭'],
  xcient: ['엑시언트'],
}
// Encar солонгос Model → англи дэлгэцийн нэр (жагсаалтад харуулна).
const TRUCK_MODEL_KO_TO_EN = {
  '포터 Ⅱ': 'Porter II',
  포터: 'Porter',
  봉고Ⅲ: 'Bongo III',
  '더 뉴 봉고Ⅲ': 'Bongo III',
  봉고프론티어: 'Bongo Frontier',
  메가트럭: 'Mega Truck',
  마이티: 'Mighty',
  '올 뉴 마이티': 'Mighty',
  e마이티: 'e-Mighty',
  '마이티 큐티': 'Mighty QT',
  뉴파워트럭: 'New Power Truck',
  엑시언트: 'Xcient',
  '프리마 중형트럭': 'Prima',
  '노부스 중형트럭': 'Novus',
}

// Or-group: (Or.Model.v1_.Model.v2). Утгуудыг тус бүр leaf болгоно.
const orGroup = (key, values) => group('Or', values.map((v) => leaf(key, v)))

function buildTruckQuery(q, rates) {
  const kids = [rawLeaf('Hidden', 'N')]

  const brandKo = q.brand
    ? TRUCK_BRAND_EN_TO_KO[String(q.brand).trim().toLowerCase()] || null
    : null
  if (brandKo) kids.push(leaf('Manufacturer', brandKo))

  if (q.model) {
    const variants = TRUCK_MODEL_EN_TO_KO[String(q.model).trim().toLowerCase()]
    if (variants && variants.length) {
      kids.push(variants.length === 1 ? leaf('Model', variants[0]) : orGroup('Model', variants))
    } else {
      // Тодорхойлоогүй бол ирсэн утгыг шууд (солонгос) Model гэж үзнэ.
      kids.push(leaf('Model', String(q.model).trim()))
    }
  }

  const yr = yearRange(q.yearFrom, q.yearTo)
  if (yr) kids.push(rawLeaf('Year', yr))

  const minMan = usdToManwon(q.priceFrom, rates)
  const maxMan = usdToManwon(q.priceTo, rates)
  const pr = numRange(minMan, maxMan)
  if (pr) kids.push(rawLeaf('Price', pr))

  const ml = numRange(
    q.minMileage ? Number(q.minMileage) : null,
    q.maxMileage ? Number(q.maxMileage) : null
  )
  if (ml) kids.push(rawLeaf('Mileage', ml))

  return group('And', kids)
}

// Encar-ийн хүлээн зөвшөөрдөг sort token-ууд. Year нь зөвхөн буурах эрэмбэтэй
// (YearAsc/YearDesc буруу нэр), тиймээс хоёр чиглэлд "Year"-ийг ашиглана.
const SORT_MAP = {
  scraped_at: { asc: 'ModifiedDate', desc: 'ModifiedDate' },
  price: { asc: 'PriceAsc', desc: 'PriceDesc' },
  year: { asc: 'Year', desc: 'Year' },
  mileage: { asc: 'MileageAsc', desc: 'MileageDesc' },
}
function sortToken(sortBy, sortOrder) {
  const m = SORT_MAP[String(sortBy || 'scraped_at')] || SORT_MAP.scraped_at
  return m[String(sortOrder || 'desc') === 'asc' ? 'asc' : 'desc']
}

// ===== Photo builders =====
function listPhotos(v) {
  const arr = Array.isArray(v.Photos) ? v.Photos : []
  const sorted = arr
    .filter((p) => p && p.location)
    .sort((a, b) => (Number(a.ordering) || 0) - (Number(b.ordering) || 0))
  const items = sorted.map((p) => ({
    url: ENCAR_CDN + p.location + HD_SUFFIX,
    thumb_url: ENCAR_CDN + p.location,
  }))
  if (items.length === 0 && v.Photo) {
    // Photo нь "/carpicture.../12345678_" суурь зам — 001.jpg нэмж нэг зураг.
    const u = `${ENCAR_CDN}${v.Photo}001.jpg`
    items.push({ url: u + HD_SUFFIX, thumb_url: u })
  }
  return items
}

function detailPhotos(d) {
  const arr = Array.isArray(d.photos) ? d.photos : []
  const sorted = arr
    .filter((p) => p && p.path)
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
  return sorted.map((p, i) => ({
    url: ENCAR_CDN + p.path + HD_SUFFIX,
    thumb_url: ENCAR_CDN + p.path,
    is_main: i === 0,
    position: i,
    photo_type: p.type || '',
  }))
}

// ===== Normalisation: list item → Car =====
function yearFromYm(ym, formYear) {
  const n = parseInt(String(ym).slice(0, 4), 10)
  if (n >= 1900) return n
  const f = parseInt(formYear, 10)
  return f >= 1900 ? f : 0
}

function normalizeList(v, truck = false) {
  const id = String(v.Id)
  const brand = truck
    ? TRUCK_BRAND_KO_TO_EN[v.Manufacturer] || BRAND_KO_TO_EN[v.Manufacturer] || v.Manufacturer || ''
    : BRAND_KO_TO_EN[v.Manufacturer] || v.Manufacturer || ''
  // Солонгос загвар нэрийг толиор англи болгоно; мэдэгдэхгүй бол солонгосоор
  // үлдээнэ (detail үзэхэд аяндаа суралцана). Ачааны машинд тусдаа толь.
  const model = truck
    ? TRUCK_MODEL_KO_TO_EN[v.Model] || v.Model || ''
    : translateModel(v.Manufacturer, v.Model) || v.Model || ''
  const year = yearFromYm(v.Year, v.FormYear)
  const priceMan = Number(v.Price) || 0
  const photos = listPhotos(v)
  const urls = photos.map((p) => p.url)
  const thumbs = photos.map((p) => p.thumb_url)
  const title = `${brand} ${model}`.trim() + (year ? ` (${year})` : '')
  return {
    id,
    title,
    brand,
    model,
    trim: v.Badge || '',
    generation: '',
    year,
    price: priceMan,
    currency: 'KRW',
    price_krw: priceMan * 10000,
    mileage: Number(v.Mileage) || 0,
    fuelType: FUEL_KO_TO_EN[v.FuelType] != null ? FUEL_KO_TO_EN[v.FuelType] : v.FuelType || '',
    transmission: TRANS_KO_TO_EN[v.Transmission] != null ? TRANS_KO_TO_EN[v.Transmission] : v.Transmission || '',
    location: REGION_KO_TO_MN[v.OfficeCityState] || v.OfficeCityState || 'South Korea',
    region: v.OfficeCityState || '',
    source: 'encar',
    image: thumbs[0] || '',
    images: urls,
    thumbnails: thumbs,
    photos: photos.map((p, i) => ({ url: p.url, thumb_url: p.thumb_url, is_main: i === 0, position: i, photo_type: '' })),
    type: truck ? 'special' : '',
    body_type: truck ? 'Truck' : '',
    color: '',
    encar_id: id,
    listing_url: `http://www.encar.com/dc/dc_cardetailview.do?carid=${id}`,
    dealer_type: '',
    advertisement_status: 'ADVERTISE',
  }
}

// ===== Normalisation: detail → Car =====
function normalizeDetail(d, id) {
  const cat = d.category || {}
  const spec = d.spec || {}
  const ad = d.advertisement || {}
  const contact = d.contact || {}
  // Жагсаалтын толийг энэ detail-аас аяндаа баяжуулна (нэмэлт request-гүй).
  learnModel(cat.manufacturerName, cat.modelName, cat.modelGroupEnglishName)
  // Жагсаалттай нийцүүлэхийн тулд эхлээд цэвэр map (KG Mobility, Mercedes-Benz)
  // ашиглана; Encar-ийн manufacturerEnglishName заримдаа доогуур зураастай
  // муухай байдаг (жишээ "KG_Mobility_Ssangyong").
  const brand =
    BRAND_KO_TO_EN[cat.manufacturerName] ||
    TRUCK_BRAND_KO_TO_EN[cat.manufacturerName] ||
    cat.manufacturerEnglishName ||
    cat.manufacturerName ||
    ''
  // Ачааны машинд modelGroupEnglishName ирдэггүй — тусгай толиор англи болгоно.
  const model = cat.modelGroupEnglishName || TRUCK_MODEL_KO_TO_EN[cat.modelName] || cat.modelName || ''
  const trim = cat.gradeEnglishName || cat.gradeName || ''
  const year = yearFromYm(cat.yearMonth, cat.formYear)
  const priceMan = Number(ad.price) || 0
  const photos = detailPhotos(d)
  const urls = photos.map((p) => p.url)
  const thumbs = photos.map((p) => p.thumb_url)
  const dealer =
    contact.userType === 'DEALER' || spec.tradeType === 'D'
      ? 'DEALER'
      : spec.tradeType === 'P'
        ? 'PERSONAL'
        : ''
  const title = `${brand} ${model}`.trim() + (year ? ` (${year})` : '')
  return {
    id: String(id),
    title,
    brand,
    model,
    trim,
    generation: cat.gradeDetailEnglishName || cat.gradeDetailName || '',
    year,
    price: priceMan,
    currency: 'KRW',
    price_krw: priceMan * 10000,
    original_price_krw: cat.originPrice ? Number(cat.originPrice) * 10000 : undefined,
    mileage: Number(spec.mileage) || 0,
    fuelType: FUEL_KO_TO_EN[spec.fuelName] != null ? FUEL_KO_TO_EN[spec.fuelName] : spec.fuelName || '',
    transmission: TRANS_KO_TO_EN[spec.transmissionName] != null ? TRANS_KO_TO_EN[spec.transmissionName] : spec.transmissionName || '',
    location: 'South Korea',
    region: '',
    source: 'encar',
    image: thumbs[0] || '',
    images: urls,
    thumbnails: thumbs,
    photos,
    type: '',
    body_type: BODY_KO_TO_EN[spec.bodyName] || spec.bodyName || '',
    color: COLOR_KO_TO_EN[spec.colorName] || spec.colorName || '',
    encar_id: String(id),
    listing_url: `http://www.encar.com/dc/dc_cardetailview.do?carid=${id}`,
    vin: '',
    description: ad.oneLineText || '',
    displacement: Number(spec.displacement) || 0,
    seat_count: spec.seatCount || null,
    dealer_type: dealer,
    advertisement_status: ad.status || 'ADVERTISE',
  }
}

// ===== Routes =====

// GET /api/cars — жагсаалт
router.get('/', async (req, res) => {
  try {
    const rates = await getRates()
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)))
    const offset = (page - 1) * limit
    const sort = sortToken(req.query.sortBy, req.query.sortOrder)

    // Тусгай ангилал (ачааны машин: Porter, Bongo, Mighty…) тусдаа truck API-аас.
    if (req.query.vehicleType === 'special') {
      const q = buildTruckQuery(req.query, rates)
      const raw = await searchTrucks({ q, sort, offset, count: limit })
      const results = Array.isArray(raw.SearchResults) ? raw.SearchResults : []
      const total = Number(raw.Count) || 0
      res.set('Cache-Control', CACHE_HEADER)
      return res.json({
        cars: results.map((v) => normalizeList(v, true)),
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      })
    }

    const q = buildQuery(req.query, rates)
    const raw = await searchVehicles({ q, sort, offset, count: limit })
    const results = Array.isArray(raw.SearchResults) ? raw.SearchResults : []
    const total = Number(raw.Count) || 0
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      cars: results.map((v) => normalizeList(v)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (err) {
    console.error('encar list error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

// GET /api/cars/stats — нийт зарын тоо
router.get('/stats', async (_req, res) => {
  try {
    const raw = await searchVehicles({ q: '(And.Hidden.N.)', sort: 'ModifiedDate', offset: 0, count: 1 })
    const total = Number(raw.Count) || 0
    res.set('Cache-Control', CACHE_HEADER)
    res.json({
      totalCars: total,
      highestCarNumber: total,
      carsByWebsite: [{ website: 'encar', count: total }],
    })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

async function detailHandler(req, res) {
  try {
    const id = String(req.params.id)
    if (!/^\d{6,}$/.test(id)) return res.status(404).json({ error: 'unknown carId' })
    const raw = await getVehicle(id)
    if (!raw || !raw.category) return res.status(404).json({ error: 'unknown carId' })
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(raw, id))
  } catch (err) {
    if (/40[34]/.test(err.message)) return res.status(404).json({ error: 'unknown carId' })
    console.error('encar detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
}

// GET /api/cars/:id — detail (id нь Encar listing дугаар)
router.get('/:id', detailHandler)
// GET /api/cars/:id/full — back-compat alias
router.get('/:id/full', detailHandler)

// POST /api/cars/pricing-breakdown — placeholder (frontend өөрөө тооцоолно)
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
// Тестэд зориулж цэвэр функцуудыг экспортолно.
module.exports._internal = { buildQuery, buildTruckQuery, sortToken, normalizeList, normalizeDetail, usdToManwon }
