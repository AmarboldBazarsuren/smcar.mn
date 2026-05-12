const BASE = 'https://api.carapis.com/apix'
const KEY = process.env.CARAPIS_API_KEY

const CACHE_TTL = 5 * 60 * 1000          // 5 минут freshness
const STALE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 хоног stale-while-revalidate
const cache = new Map()
const inflight = new Map()

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
      .then((d) => { cache.set(url, { data: d, time: Date.now() }); return d })
      .catch((e) => { console.error('carapis revalidate fail:', e.message); return hit.data })
      .finally(() => inflight.delete(url))
    inflight.set(url, p)
    return hit.data
  }
  if (inflight.has(url)) return inflight.get(url)
  const p = rawFetch(url, timeoutMs)
    .then((d) => { cache.set(url, { data: d, time: Date.now() }); return d })
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

async function getValuation(id) {
  // LLM cold-start 30+ секунд хүртэл байж магадгүй. Valuation нь тусдаа
  // endpoint болсон тул frontend нь tail load хийдэг — 25s timeout өгөөд
  // Carapis-ын LLM-ийг warm болох цаг өгнө. Хүрсэний дараа cache hit.
  return cachedGet(buildUrl(`/catalog_analytics/public/vehicles/${id}/`), 25000)
}

module.exports = { listVehicles, getVehicle, getValuation }
