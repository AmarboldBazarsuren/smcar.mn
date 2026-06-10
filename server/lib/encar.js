const fs = require('fs')
const path = require('path')

// Encar-ийн жинхэнэ нийтийн API. /search/.../premium нь бүх ~220,000 зарыг
// (count + 만원 үнэ + thumbnail) буцаана. /v1/readside/vehicle/{id} нь нэг
// машины бүрэн мэдээлэл (англи нэр, MSRP, бүх зураг).
const SEARCH_BASE = 'https://api.encar.com/search/car/list/premium'
const DETAIL_BASE = 'https://api.encar.com/v1/readside/vehicle'
const DETAIL_INCLUDE =
  'ADVERTISEMENT,CATEGORY,CONDITION,CONTACT,MANAGE,OPTIONS,PHOTOS,SPEC,PARTNERSHIP,CENTER,VIEW'

// Encar mobile/web API нь хэвлэгдсэн browser User-Agent + Referer шаардана.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 цаг — машины мэдээлэл өдөрт нэг л шинэчлэгдэнэ
const STALE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 хоног stale-while-revalidate
const cache = new Map()
const inflight = new Map()

// Persistent disk cache — pm2 restart-д бүх зарыг дахин fetch хийхгүй.
const CACHE_DIR = path.join(__dirname, '..', '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'encar-cache.json')
try { fs.mkdirSync(CACHE_DIR, { recursive: true }) } catch {}
try {
  const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  let n = 0
  for (const [k, v] of Object.entries(data)) {
    if (v && v.time && Date.now() - v.time < STALE_TTL) { cache.set(k, v); n++ }
  }
  console.log(`[encar cache] loaded ${n} entries from disk`)
} catch {}
let dirty = false
setInterval(() => {
  if (!dirty || cache.size === 0) return
  try {
    // Дискэн дээр хэт томрохоос сэргийлж зөвхөн сүүлийн 5000 entry хадгална.
    const entries = [...cache.entries()]
    if (entries.length > 5000) {
      entries.sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
      cache.clear()
      for (const [k, v] of entries.slice(0, 5000)) cache.set(k, v)
    }
    const obj = {}
    for (const [k, v] of cache.entries()) obj[k] = v
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj))
    dirty = false
  } catch (e) {
    console.warn('[encar cache] disk write fail:', e.message)
  }
}, 30000).unref()

function headers() {
  return {
    accept: 'application/json',
    'user-agent': UA,
    referer: 'http://www.encar.com/',
  }
}

async function rawFetch(url, timeoutMs) {
  const r = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`encar ${r.status} ${url}`)
  return r.json()
}

async function cachedGet(url, timeoutMs = 12000) {
  const hit = cache.get(url)
  const now = Date.now()
  if (hit && now - hit.time < CACHE_TTL) return hit.data
  if (hit && now - hit.time < STALE_TTL && !inflight.has(url)) {
    // stale: cached-ийг шууд буцааж, background-д шинэчилнэ
    const p = rawFetch(url, timeoutMs)
      .then((d) => { cache.set(url, { data: d, time: Date.now() }); dirty = true; return d })
      .catch((e) => { console.error('encar revalidate fail:', e.message); return hit.data })
      .finally(() => inflight.delete(url))
    inflight.set(url, p)
    return hit.data
  }
  if (inflight.has(url)) return inflight.get(url)
  const p = rawFetch(url, timeoutMs)
    .then((d) => { cache.set(url, { data: d, time: Date.now() }); dirty = true; return d })
    .catch((e) => { if (hit) { console.error('encar upstream fail, expired cache:', e.message); return hit.data } throw e })
    .finally(() => inflight.delete(url))
  inflight.set(url, p)
  return p
}

// q: Encar query DSL string. Утгууд нь аль хэдийн URL-safe encode хийгдсэн,
// бүтцийн тэмдгүүд (хаалт/цэг) literal байх ёстой тул q-г ДАХИН encode ХИЙХГҮЙ.
// sr доторх "|"-г л encode хийнэ.
function buildSearchUrl({ q, sort = 'ModifiedDate', offset = 0, count = 20 }) {
  const sr = `|${sort}|${offset}|${count}`
  return `${SEARCH_BASE}?count=true&q=${q}&sr=${encodeURIComponent(sr)}`
}

async function searchVehicles(opts) {
  return cachedGet(buildSearchUrl(opts))
}

async function getVehicle(id) {
  return cachedGet(`${DETAIL_BASE}/${encodeURIComponent(id)}?include=${DETAIL_INCLUDE}`)
}

module.exports = { searchVehicles, getVehicle, buildSearchUrl }
