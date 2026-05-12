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
const { absoluteUrlToProxyUrl } = require('./photoProxy')
const { resolveEncarCarId, fetchEncarDetail, fetchEncarOptions, getCachedEncarCarId, findUuidByEncarCarId } = require('../lib/encarLookup')

// Carapis IDs are UUIDs ("d1b31a20-1e6d-…"); Encar carIds are pure
// digits ("41992910"). Use the shape to decide which lookup to run.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function looksLikeEncarCarId(id) {
  return typeof id === 'string' && /^\d+$/.test(id)
}

const router = express.Router()

// ===== Brand name → Carapis slug =====
// Frontend passes friendly names like "Mercedes" / "Land Rover".
// Carapis slugs are kebab-case ("mercedes-benz", "land-rover"). For most
// brands a simple slugify works; the alias map covers known mismatches.

const BRAND_ALIASES = {
  mercedes: 'mercedes-benz',
  benz: 'mercedes-benz',
  vw: 'volkswagen',
  rolls: 'rolls-royce',
  range: 'land-rover',
  rangerover: 'land-rover',
  landrover: 'land-rover',
}

function slugifyBrand(s) {
  if (!s) return s
  const key = String(s).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return BRAND_ALIASES[key.replace(/-/g, '')] || BRAND_ALIASES[key] || key
}

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
// Also handles hyphenated names so "Mercedes-Benz S-Class" stays
// proper-cased on both sides of the dash.
function titleCase(s) {
  if (!s) return s
  const ALL_CAPS = new Set([
    // Brands
    'BMW', 'GMC', 'KGM', 'BYD', 'DS',
    // Mercedes-Benz model lines
    'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'GLK',
    'CLA', 'CLS', 'CLE', 'SLK', 'SLC', 'AMG',
    'EQA', 'EQB', 'EQC', 'EQE', 'EQS',
    // Audi
    'TT', 'TTS', 'RS', 'SQ',
    // Lexus / Infiniti / Genesis trim codes
    'RX', 'NX', 'ES', 'IS', 'LS', 'LC', 'GS', 'GX', 'LX', 'UX',
    'QX', 'EX', 'JX', 'FX', 'KX',
    'EV', 'EV6', 'EV9', 'EV3',
    // Korean specials
    'SM3', 'SM5', 'SM6', 'SM7', 'QM3', 'QM5', 'QM6', 'XM3',
    'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80',
    'K3', 'K5', 'K7', 'K8', 'K9',
    // Generic trim acronyms
    'XLT', 'SXT', 'SLT', 'LTD', 'GT', 'GTI', 'GLI', 'XDR', 'AWD', 'FWD', 'RWD',
  ])
  const capWord = (w) => {
    if (!w) return w
    const upper = w.toUpperCase()
    if (ALL_CAPS.has(upper)) return upper
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  }
  return String(s)
    .split(/\s+/)
    .map((token) => token.split('-').map(capWord).join('-'))
    .join(' ')
}

// When CARAPIS_API_KEY is set we hit the authenticated /catalog_private
// namespace (Starter+ tiers) which exposes VIN, listing_id, listing_url,
// description, features, watermark-free photos, etc. Without a key we
// fall back to /catalog_public which masks those fields.
const HAS_KEY = !!process.env.CARAPIS_API_KEY
const CARAPIS_BASE = HAS_KEY
  ? 'https://api.carapis.com/apix/catalog_private'
  : 'https://api.carapis.com/apix/catalog_public'
const DETAIL_PATH = HAS_KEY ? '' : '/detail' // private uses /{id}/, public uses /detail/{id}/
console.log(`[carapis] using ${HAS_KEY ? 'PRIVATE (auth)' : 'PUBLIC (no key)'} catalog`)

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
  if (process.env.CARAPIS_API_KEY) headers.authorization = `Bearer ${process.env.CARAPIS_API_KEY}`
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
  if (r.ok) return r.json()
  // 429 on /catalog_private means we've burnt through the Starter
  // per-minute budget. /catalog_public has its own quota — fall back
  // there so the site keeps working. We lose description and valuation
  // but base data is intact.
  if (r.status === 429 && url.includes('/catalog_private/')) {
    // List URL: ...catalog_private/vehicles/?<query>     → ...catalog_public/vehicles/?<query>
    // Detail URL: ...catalog_private/vehicles/<uuid>/   → ...catalog_public/vehicles/detail/<uuid>/
    const isList = url.includes('/vehicles/?') || url.endsWith('/vehicles/')
    const publicUrl = isList
      ? url.replace('/catalog_private/vehicles/', '/catalog_public/vehicles/')
      : url.replace('/catalog_private/vehicles/', '/catalog_public/vehicles/detail/')
    try {
      const r2 = await fetch(publicUrl, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15000) })
      if (r2.ok) return r2.json()
    } catch {}
  }
  throw new Error(`carapis ${r.status}`)
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
  // listing_id may be set when public catalog responds (kbchachacha
  // and other non-Encar sources expose it freely). But for Encar
  // listings on Starter the field is masked, so we fall back to a
  // cached Encar carId we've resolved before, then to the UUID.
  // We do NOT treat listing_id from non-Encar sources as an Encar
  // carId — it belongs to a different platform entirely.
  const sourceCode = v.source?.code || 'encar'
  const cachedCarId = sourceCode === 'encar' ? getCachedEncarCarId(v.id) : null
  const sourceListingId = sourceCode === 'encar' ? (v.listing_id || null) : null
  return {
    id: v.id,
    encar_id: sourceListingId || cachedCarId || v.id,
    source: sourceCode,
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

// Carapis premium tiers return a `features` field. The exact shape isn't
// documented yet — could be string[] like ["Sunroof","Navigation"] or
// object[] like [{name, category, name_mn}]. Handle both, fall back to
// an empty group set when missing/free-tier.
function featureGroups(features, lang) {
  if (!Array.isArray(features) || features.length === 0) return { groups: [] }
  const CAT_TITLES = {
    exterior: { en: 'Exterior & Lighting', mn: 'Гадна хийц ба гэрэлтүүлэг' },
    safety: { en: 'Safety & Driver Assist', mn: 'Аюулгүй байдал ба жолоодлогын туслах систем' },
    comfort: { en: 'Comfort & Multimedia', mn: 'Тав тух ба мультимедиа' },
    seats: { en: 'Seats & Interior', mn: 'Суудал ба салон' },
    other: { en: 'Other equipment', mn: 'Бусад тоноглол' },
  }
  const buckets = { exterior: [], safety: [], comfort: [], seats: [], other: [] }
  features.forEach((f, i) => {
    const label = typeof f === 'string' ? f : (f[lang === 'mn' ? 'name_mn' : 'name'] || f.name || String(f))
    const cat = (typeof f === 'object' && f.category && buckets[f.category]) ? f.category : 'other'
    buckets[cat].push({ code: String(i), label })
  })
  const groups = []
  for (const key of ['exterior', 'safety', 'comfort', 'seats', 'other']) {
    if (buckets[key].length === 0) continue
    groups.push({ key, title: CAT_TITLES[key][lang] || CAT_TITLES[key].en, items: buckets[key] })
  }
  return { groups }
}

function normalizeDetail(v) {
  const brand = titleCase(v.brand?.name || '')
  const model = titleCase(v.model?.name || '')
  const displayName = v.display_name ? titleCase(v.display_name.replace(/\(\d+\)/, '').trim()) + (v.year ? ` (${v.year})` : '') : `${brand} ${model}`.trim()
  // Same as normalizeList: only forward listing_id as encar_id when
  // the source is actually Encar. KBChaChaCha etc. expose their own
  // platform-specific listing_id which would otherwise be served as
  // a (broken) Encar carId.
  const sourceCode = v.source?.code || 'encar'
  const detailListingId = sourceCode === 'encar' ? (v.listing_id || null) : null
  const sourceListingUrl = sourceCode !== 'encar' ? (v.listing_url || null) : null
  // Carapis sometimes returns an absurdly low `price` for near-new listings
  // (e.g. ₩2.88M for a 2026 Kia Morning with 6 km). When that happens
  // `original_msrp` carries the real factory price. Fall back to MSRP only
  // when mileage is tiny AND the gap is huge — leave normal used-car
  // discounts alone.
  const rawPrice = Number(v.price) || 0
  const msrp = Number(v.original_msrp) || 0
  const mileage = Number(v.mileage) || 0
  const effectivePrice = (mileage <= 1000 && msrp > 0 && rawPrice > 0 && rawPrice < msrp * 0.3) ? msrp : rawPrice
  return {
    id: v.id,
    encar_id: detailListingId || v.id,
    source: sourceCode,
    listing_url: sourceListingUrl || '',
    title: displayName,
    brand,
    model,
    grade: v.trim || '',
    trim: v.trim || '',
    badge: v.trim || '',
    badge_detail: v.generation || '',
    year: v.year || 0,
    price: effectivePrice ? Math.round(effectivePrice / 10000) : 0,
    original_price_krw: effectivePrice,
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
    options: featureGroups(v.features, 'en'),
    options_mn: featureGroups(v.features, 'mn'),
    diagnosis: !!v.inspection_passed,
    pre_verified: !!v.is_verified,
    extend_warranty: v.warranty_type && v.warranty_type !== 'none',
    status: v.status === 'active' ? 'ADVERTISE' : v.status,
    one_line: v.description || '',
    scraped_at: v.first_seen_at,
  }
}

// ===== Enrichment with Encar live data =====
// Carapis snapshot data has known gaps (no VIN, no listing_url, garbage
// prices on RENT_SUCCESSION listings, watermarked photos). Now that
// api.encar.com is reachable from the VPS again, we fetch the real
// Encar detail and merge it on top. Mapping cache is forever; detail
// cache is 7 days. Encar match misses (~5-15%) get cached as null so
// we don't retry.

// apicars.info option categories → our internal group keys.
const OPT_CAT_TO_GROUP = {
  '01': 'exterior', // Exterior / Interior
  '02': 'safety',
  '03': 'comfort',  // Convenience / Multimedia
  '04': 'seats',
}
const GROUP_TITLES = {
  exterior: { en: 'Exterior & Lighting', mn: 'Гадна хийц ба гэрэлтүүлэг' },
  safety: { en: 'Safety & Driver Assist', mn: 'Аюулгүй байдал ба жолоодлогын туслах систем' },
  comfort: { en: 'Comfort & Multimedia', mn: 'Тав тух ба мультимедиа' },
  seats: { en: 'Seats & Interior', mn: 'Суудал ба салон' },
}

function buildOptionsFromApicars(apicarsData, lang) {
  if (!apicarsData?.categories?.length) return { groups: [] }
  const groups = []
  for (const cat of apicarsData.categories) {
    const groupKey = OPT_CAT_TO_GROUP[cat.category?.key] || 'other'
    const title = GROUP_TITLES[groupKey]?.[lang] || cat.category?.value || ''
    const items = (cat.options || []).map((o, i) => ({
      code: o.optionCd || String(i),
      // We don't have a Mongolian translation of option names yet. The
      // English label is the universal display for now; future work
      // could pre-translate the 62 known option names.
      label: o.optionName || o.originalName || '',
    }))
    if (items.length) groups.push({ key: groupKey, title, items })
  }
  return { groups }
}

async function enrichDetail(base) {
  // base = the Carapis-normalized car object from normalizeDetail
  if (!base?.id) return base
  // Skip Encar enrichment for non-Encar sources (kbchachacha etc.).
  // We'd never find a match on api.encar.com for those listings, and
  // any "first hit" would link to a different car. listing_url for
  // those was already set in normalizeDetail from the public catalog.
  if (base.source && base.source !== 'encar') return base
  let encarCarId = null
  let detail = null
  let options = null
  try {
    encarCarId = await resolveEncarCarId(base)
  } catch (e) { console.error('[enrich] resolveEncarCarId:', e.message) }
  // Once we know the carId, fire the detail + options fetches in
  // parallel — they don't depend on each other. Cuts the cold-path
  // detail page latency roughly in half (was ~3s serial, now ~1.5s).
  if (encarCarId) {
    const [detailRes, optionsRes] = await Promise.allSettled([
      fetchEncarDetail(encarCarId),
      fetchEncarOptions(encarCarId),
    ])
    if (detailRes.status === 'fulfilled') detail = detailRes.value
    if (optionsRes.status === 'fulfilled') options = optionsRes.value
  }

  const enriched = { ...base }

  if (encarCarId) {
    enriched.encar_id = encarCarId
    enriched.listing_url = `https://fem.encar.com/cars/detail/${encarCarId}`
  }

  if (detail) {
    // VIN — Encar sometimes exposes it; keep Carapis's value otherwise.
    if (detail.vin) enriched.vin = String(detail.vin)
    // Photos: leave Carapis's images alone. Encar matches occasionally
    // resolve to a similar-looking listing, in which case overwriting
    // photos shows the wrong car. Carapis photos always correspond to
    // the listing the user is actually viewing (watermark and all).
    // Real price. Encar's advertisement.price is in 만원. For
    // RENT_SUCCESSION the advertised number is a tiny advance fee and
    // category.originPrice (MSRP) is the right thing to show.
    const adType = detail.advertisement?.advertisementType
    const advPrice = Number(detail.advertisement?.price) || 0
    const originPrice = Number(detail.category?.originPrice) || 0
    let chosenManwon = advPrice
    if (adType === 'RENT_SUCCESSION' && originPrice > 0) chosenManwon = originPrice
    if (chosenManwon > 0) {
      enriched.price = chosenManwon
      enriched.original_price_krw = chosenManwon * 10000
    }
    enriched.is_rent_succession = adType === 'RENT_SUCCESSION'
    // Don't overwrite location with Encar's Korean street address —
    // Carapis already maps the city to "БНСУ, Тэжон" etc. which is
    // what the rest of the UI expects.
  }

  if (options) {
    enriched.options = buildOptionsFromApicars(options, 'en')
    enriched.options_mn = buildOptionsFromApicars(options, 'mn')
  }

  return enriched
}

const CACHE_HEADER = 'public, max-age=172800, stale-while-revalidate=604800'

// Body types we consider "Тусгай ангилал" (commercial / utility).
const SPECIAL_BODY_TYPES = ['truck', 'van', 'minivan', 'pickup', 'bus']

// Frontend sortBy field name → Carapis ordering field name.
// Carapis bug (2026-05-12): `-` (desc) prefix only works correctly on
// first_seen_at; on year/mileage/price the `-` sort puts NULL-valued
// rows first. Forward `desc` only for first_seen_at and fall back to
// ascending for the others so the result is at least usable.
const ORDER_FIELD = { scraped_at: 'first_seen_at', year: 'year', mileage: 'mileage' }
const DESC_OK = new Set(['first_seen_at'])

function buildListUrl(query, opts = {}) {
  // strip cache-buster
  delete query.v
  const u = new URL(`${CARAPIS_BASE}/vehicles/`)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)))
  u.searchParams.set('page', page)
  u.searchParams.set('page_size', limit)
  // We only want Encar listings. Carapis aggregates from a bunch of
  // Korean and Japanese platforms (kbchachacha, goonet_exchange,
  // carsensor, …); without this filter a search for e.g. Lexus NX
  // returns rivers and gulliver listings the user can't actually
  // buy from us. Drops the catalog from 26,863 to 20,638 cars.
  u.searchParams.set('source', 'encar')
  if (query.brand) u.searchParams.set('brand', slugifyBrand(query.brand))
  if (query.model) u.searchParams.set('model', String(query.model).toLowerCase().replace(/\s+/g, '-'))
  if (query.yearFrom) u.searchParams.set('min_year', query.yearFrom)
  if (query.yearTo) u.searchParams.set('max_year', query.yearTo)
  // min_price / max_price are USD per Carapis docs — frontend already converts MNT → USD.
  if (query.priceFrom) u.searchParams.set('min_price', Math.round(Number(query.priceFrom)))
  if (query.priceTo) u.searchParams.set('max_price', Math.round(Number(query.priceTo)))
  if (query.fuelType) u.searchParams.set('fuel_type', String(query.fuelType).toLowerCase())
  if (query.transmission) u.searchParams.set('transmission', String(query.transmission).toLowerCase())
  if (query.maxMileage) u.searchParams.set('max_mileage', query.maxMileage)
  if (opts.bodyType) u.searchParams.set('body_type', opts.bodyType)
  // ordering: Carapis accepts `field` (asc) or `-field` (desc), but `-`
  // is buggy on most fields — see DESC_OK above.
  const orderField = ORDER_FIELD[String(query.sortBy || '')]
  if (orderField) {
    const wantsDesc = String(query.sortOrder || 'desc') !== 'asc'
    const useDesc = wantsDesc && DESC_OK.has(orderField)
    u.searchParams.set('ordering', useDesc ? `-${orderField}` : orderField)
  }
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
    const u = `${CARAPIS_BASE}/vehicles/?source=encar&page_size=1`
    const raw = await cachedGet(u)
    res.set('Cache-Control', CACHE_HEADER)
    res.json({ totalCars: raw.count || 0, highestCarNumber: raw.count || 0, carsByWebsite: [{ website: 'carapis', count: raw.count || 0 }] })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// Detail routes accept either a Carapis UUID or an Encar carId (pure
// digits). When the request comes in with an Encar carId we look up
// the matching UUID from our reverse map and fetch Carapis with that.
// If the carId isn't in the map yet, return 404 — only cars whose
// lookup already ran can be reached via the short URL.
function resolveCarapisUuid(rawId) {
  if (!rawId) return null
  if (looksLikeEncarCarId(rawId)) return findUuidByEncarCarId(rawId)
  return rawId // assume it's already a UUID (or whatever Carapis expects)
}

router.get('/:id', async (req, res) => {
  try {
    const uuid = resolveCarapisUuid(req.params.id)
    if (!uuid) return res.status(404).json({ error: 'unknown carId' })
    const raw = await cachedGet(`${CARAPIS_BASE}/vehicles${DETAIL_PATH}/${uuid}/`)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(normalizeDetail(raw))
  } catch (err) {
    console.error('carapis detail error:', err.message)
    res.status(502).json({ error: err.message })
  }
})

router.get('/:id/full', async (req, res) => {
  try {
    const uuid = resolveCarapisUuid(req.params.id)
    if (!uuid) return res.status(404).json({ error: 'unknown carId' })
    const raw = await cachedGet(`${CARAPIS_BASE}/vehicles${DETAIL_PATH}/${uuid}/`)
    const base = normalizeDetail(raw)
    const enriched = await enrichDetail(base)
    res.set('Cache-Control', CACHE_HEADER)
    res.json(enriched)
  } catch (err) {
    console.error('carapis detail/full error:', err.message)
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

module.exports = router
