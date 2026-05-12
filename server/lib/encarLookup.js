// Backend Encar lookup + detail fetch.
//
// Encar's Cloudflare block on our VPS IP lifted around 2026-05-12, so
// we can hit api.encar.com directly from Node. This module:
//   1. Matches a Carapis vehicle (year + mileage + price + car type)
//      to the corresponding Encar listing using Encar's own search DSL.
//   2. Fetches the Encar detail JSON for an Encar carId.
//   3. Persists the Carapis-UUID → Encar-carId mapping forever on disk
//      so we only pay the lookup cost once per car.
//
// Matched IDs are also cached when null (lookup failed) so we don't
// keep retrying the same impossible match.

const fs = require('fs')
const path = require('path')

const MAP_FILE = path.join(__dirname, '..', '.cache', 'carapis-to-encar.json')
const DETAIL_CACHE = new Map() // encar carId → { data, time }
const DETAIL_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

let map = {}
try {
  if (fs.existsSync(MAP_FILE)) map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'))
} catch (e) { console.error('[encar map] load fail:', e.message) }

let dirty = false
function persistMap() {
  if (!dirty) return
  try {
    fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true })
    fs.writeFileSync(MAP_FILE, JSON.stringify(map))
    dirty = false
  } catch (e) { console.error('[encar map] persist fail:', e.message) }
}
setInterval(persistMap, 30 * 1000).unref()
process.on('SIGTERM', persistMap)
process.on('SIGINT', persistMap)
process.on('beforeExit', persistMap)

// Frontend Brand name → Korean brand string used by Encar.
const BRAND_ALIASES = {
  Hyundai: ['현대'],
  Kia: ['기아'],
  Genesis: ['제네시스'],
  KGM: ['KG모빌리티', '쌍용', 'KGM'],
  Ssangyong: ['쌍용'],
  'Renault Samsung': ['르노삼성'],
  'Renault Korea': ['르노코리아', '르노'],
  Daewoo: ['대우'],
  Chevrolet: ['쉐보레', 'GM대우'],
  BMW: ['BMW'],
  'Mercedes-Benz': ['벤츠', '메르세데스', 'Mercedes-Benz'],
  Audi: ['아우디'],
  Volkswagen: ['폭스바겐'],
  Porsche: ['포르쉐'],
  Mini: ['미니', 'MINI'],
  Jaguar: ['재규어'],
  'Land Rover': ['랜드로버'],
  Bentley: ['벤틀리'],
  'Rolls-Royce': ['롤스로이스'],
  Toyota: ['도요타', '토요타'],
  Lexus: ['렉서스'],
  Honda: ['혼다'],
  Nissan: ['닛산'],
  Infiniti: ['인피니티'],
  Mazda: ['마쯔다', '마즈다'],
  Subaru: ['스바루'],
  Mitsubishi: ['미쯔비시', '미쓰비시'],
  Ford: ['포드'],
  Cadillac: ['캐딜락'],
  Lincoln: ['링컨'],
  Jeep: ['지프'],
  Chrysler: ['크라이슬러'],
  Tesla: ['테슬라'],
  Fiat: ['피아트'],
  'Alfa Romeo': ['알파로메오'],
  Ferrari: ['페라리'],
  Lamborghini: ['람보르기니'],
  Maserati: ['마세라티'],
  Volvo: ['볼보'],
  Peugeot: ['푸조'],
  Citroen: ['시트로엥'],
}

const KOREAN_BRANDS = new Set([
  'Hyundai', 'Kia', 'Genesis', 'KGM', 'Ssangyong',
  'Renault Samsung', 'Renault Korea', 'Daewoo', 'Chevrolet',
])

const COMMERCIAL_BODIES = new Set([
  'truck', 'van', 'minivan', 'pickup', 'bus',
  'Truck', 'Van', 'Minivan', 'Pickup', 'Bus',
  'Ачааны', 'Вэн', 'Мини вэн', 'Пикап', 'Автобус',
])

function brandMatches(carBrand, encarMfg) {
  if (!carBrand || !encarMfg) return false
  const aliases = BRAND_ALIASES[carBrand] || [carBrand]
  return aliases.some((a) => encarMfg.includes(a))
}

function carTypeFor(car) {
  if (car.body_type && COMMERCIAL_BODIES.has(car.body_type)) return 'Y'
  if (car.brand && KOREAN_BRANDS.has(car.brand)) return 'A'
  return 'N'
}

const ENCAR_HEADERS = {
  accept: 'application/json',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  origin: 'https://smcar.mn',
  referer: 'https://www.encar.com/',
}

// Search api.encar.com for the listing that matches a Carapis vehicle.
// Returns the Encar carId string or null.
async function findEncarCarId(car) {
  if (!car?.year || !car?.brand) return null
  const year = car.year
  const km = car.mileage || 0
  const manwon = Math.round((Number(car.original_price_krw) || 0) / 10000) || (car.price || 0)
  const kmRange = km > 5000 ? 500 : 200
  const miMin = Math.max(0, km - kmRange)
  const miMax = km + kmRange
  const prRange = 5
  const prMin = Math.max(0, manwon - prRange)
  const prMax = manwon + prRange
  const ct = carTypeFor(car)
  const parts = ['Hidden.N.', `CarType.${ct}.`]
  parts.push(`Year.range(${year}01..${year}12).`)
  if (km) parts.push(`Mileage.range(${miMin}..${miMax}).`)
  if (manwon) parts.push(`Price.range(${prMin}..${prMax}).`)
  const q = `(And.${parts.join('_.')})`
  const sr = '|ModifiedDate|0|20'
  const url =
    `https://api.encar.com/search/car/list/general?count=true` +
    `&q=${encodeURIComponent(q)}&sr=${encodeURIComponent(sr)}`
  try {
    const r = await fetch(url, { headers: ENCAR_HEADERS, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return null
    const data = await r.json()
    const hits = Array.isArray(data?.SearchResults) ? data.SearchResults : []
    if (hits.length === 0) return null
    const matchByBrand = hits.find((h) => brandMatches(car.brand, h.Manufacturer))
    return String((matchByBrand || hits[0]).Id)
  } catch (e) {
    console.error('[encar lookup] search fail:', e.message)
    return null
  }
}

// Fetch the Encar detail JSON for a carId, with in-memory cache.
async function fetchEncarDetail(carId) {
  if (!carId) return null
  const hit = DETAIL_CACHE.get(carId)
  if (hit && Date.now() - hit.time < DETAIL_TTL) return hit.data
  try {
    const url = `https://api.encar.com/v1/readside/vehicle/${carId}`
    const r = await fetch(url, { headers: ENCAR_HEADERS, signal: AbortSignal.timeout(12000) })
    if (!r.ok) return null
    const data = await r.json()
    DETAIL_CACHE.set(carId, { data, time: Date.now() })
    if (DETAIL_CACHE.size > 5000) DETAIL_CACHE.delete(DETAIL_CACHE.keys().next().value)
    return data
  } catch (e) {
    console.error('[encar detail] fetch fail:', e.message)
    return null
  }
}

// Synchronous map-only lookup. Use this in hot paths like normalizeList
// where calling Encar's search per car would be way too slow. Returns
// null both when the mapping is unknown and when a previous lookup
// already determined the car has no match.
function getCachedEncarCarId(uuid) {
  if (!uuid) return null
  return map[uuid] || null
}

// Reverse index (Encar carId → Carapis UUID) for resolving short
// `/cars/<carId>` URLs back to the Carapis UUID we actually need to
// fetch detail from. The forward map is the source of truth; we
// rebuild the inverse lazily and invalidate whenever forward map
// changes via the `inverseStale` flag.
let inverse = null
let inverseStale = true
function rebuildInverse() {
  inverse = {}
  for (const [uuid, cid] of Object.entries(map)) {
    if (cid) inverse[String(cid)] = uuid
  }
  inverseStale = false
}
function findUuidByEncarCarId(carId) {
  if (!carId) return null
  if (inverseStale) rebuildInverse()
  return inverse[String(carId)] || null
}

// Public: given a normalized Carapis car object, return the matching
// Encar carId (cached forever on disk). Returns null when no match.
async function resolveEncarCarId(car) {
  if (!car?.id) return null
  if (Object.prototype.hasOwnProperty.call(map, car.id)) return map[car.id]
  const carId = await findEncarCarId(car)
  map[car.id] = carId // store null too, so we don't keep retrying misses
  dirty = true
  inverseStale = true
  return carId
}

// Public: convenience — resolve carId and fetch detail in one call.
async function fetchEncarForCar(car) {
  const carId = await resolveEncarCarId(car)
  if (!carId) return { carId: null, detail: null }
  const detail = await fetchEncarDetail(carId)
  return { carId, detail }
}

// ===== apicars.info free options endpoint =====
// `https://apicars.info/api/encar-options/vehicle/<carId>` returns the
// equipment grid (62 known options, English labels) for any active
// Encar listing. No auth. Cache results aggressively.
const OPTIONS_CACHE = new Map()
const OPTIONS_TTL = 14 * 24 * 60 * 60 * 1000 // 14 days

async function fetchEncarOptions(carId) {
  if (!carId) return null
  const hit = OPTIONS_CACHE.get(carId)
  if (hit && Date.now() - hit.time < OPTIONS_TTL) return hit.data
  try {
    const r = await fetch(`https://apicars.info/api/encar-options/vehicle/${carId}`, {
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return null
    const json = await r.json()
    if (!json?.success) return null
    OPTIONS_CACHE.set(carId, { data: json.data, time: Date.now() })
    if (OPTIONS_CACHE.size > 5000) OPTIONS_CACHE.delete(OPTIONS_CACHE.keys().next().value)
    return json.data
  } catch (e) {
    console.error('[encar options] fetch fail:', e.message)
    return null
  }
}

module.exports = {
  resolveEncarCarId,
  fetchEncarDetail,
  fetchEncarForCar,
  fetchEncarOptions,
  getCachedEncarCarId,
  findUuidByEncarCarId,
}
