const fs = require('fs')
const path = require('path')

const BASE = 'https://api.carapis.com/apix'
const KEY = process.env.CARAPIS_API_KEY

const CACHE_TTL = 24 * 60 * 60 * 1000        // 24 цаг — машинуудын мэдээлэл өдөрт нэг л шинэчлэгдэнэ
const STALE_TTL = 7 * 24 * 60 * 60 * 1000    // 7 хоног stale-while-revalidate
const cache = new Map()
const inflight = new Map()

// Persistent disk cache — pm2 restart-д бүх машинаа дахин fetch хийхгүй.
// 30 секунд тутамд disk-руу flush, асуудалтай үед боломж бий бол сэргэнэ.
const CACHE_DIR = path.join(__dirname, '..', '.cache')
const CACHE_FILE = path.join(CACHE_DIR, 'carapis-cache.json')
try { fs.mkdirSync(CACHE_DIR, { recursive: true }) } catch {}
try {
  const raw = fs.readFileSync(CACHE_FILE, 'utf8')
  const data = JSON.parse(raw)
  let n = 0
  for (const [k, v] of Object.entries(data)) {
    if (v && v.time && Date.now() - v.time < STALE_TTL) {
      cache.set(k, v); n++
    }
  }
  console.log(`[carapis cache] loaded ${n} entries from disk`)
} catch {}
let dirty = false
setInterval(() => {
  if (!dirty || cache.size === 0) return
  try {
    const obj = {}
    for (const [k, v] of cache.entries()) obj[k] = v
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj))
    dirty = false
  } catch (e) {
    console.warn('[carapis cache] disk write fail:', e.message)
  }
}, 30000).unref()

function authHeaders() {
  const h = { accept: 'application/json' }
  if (KEY) h.authorization = `Bearer ${KEY}`
  return h
}

async function rawFetch(url, timeoutMs = 15000) {
  const r = await fetch(url, { headers: authHeaders(), signal: AbortSignal.timeout(timeoutMs) })
  if (!r.ok) throw new Error(`carapis ${r.status} ${url}`)
  return r.json()
}

async function cachedGet(url, timeoutMs = 15000) {
  const hit = cache.get(url)
  const now = Date.now()
  if (hit && now - hit.time < CACHE_TTL) return hit.data
  if (hit && now - hit.time < STALE_TTL && !inflight.has(url)) {
    // stale: serve cached, revalidate in background
    const p = rawFetch(url, timeoutMs)
      .then((d) => { cache.set(url, { data: d, time: Date.now() }); dirty = true; return d })
      .catch((e) => { console.error('carapis revalidate fail:', e.message); return hit.data })
      .finally(() => inflight.delete(url))
    inflight.set(url, p)
    return hit.data
  }
  if (inflight.has(url)) return inflight.get(url)
  const p = rawFetch(url, timeoutMs)
    .then((d) => { cache.set(url, { data: d, time: Date.now() }); dirty = true; return d })
    .catch((e) => { if (hit) { console.error('upstream fail, expired cache:', e.message); return hit.data } throw e })
    .finally(() => inflight.delete(url))
  inflight.set(url, p)
  return p
}

function buildUrl(path, params = {}) {
  const u = new URL(BASE + path)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    u.searchParams.set(k, v)
  }
  return u.toString()
}

async function listVehicles(params = {}) {
  return cachedGet(buildUrl('/catalog_api/vehicles/', params))
}

async function getVehicle(id) {
  return cachedGet(buildUrl(`/catalog_api/vehicles/${id}/`))
}

module.exports = { listVehicles, getVehicle }
