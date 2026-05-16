const ENCAR_CDN = 'https://ci.encar.com'
const ENCAR_API = 'https://api.encar.com/v1/readside/vehicle'
// Encar нь impolicy=widthRate&rw=… дамжуулахад жижиг 640×360 thumbnail-ийн
// оронд бүтэн 2200×1238 эх зургийг буцаадаг (rw утга нэгэн адил). Param-гүй
// URL бол 28KB thumbnail; param-тай нь ~1.7MB бүтэн чанар.
const HD_SUFFIX = '?impolicy=widthRate&rw=1280'

// 24 цагийн in-memory cache. Detail хуудас Carapis-ийн 24h cache-тэй ижил
// хугацаагаар хадгална. listingId → {time, photos[]}.
const cache = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000
const inflight = new Map()

// Encar мобайл API нь "Mozilla/5.0" гэх мэт хэвлэгдсэн User-Agent шаардана.
// CORS browser-аас зөвшөөрдөг, server-аас бас ажилладаг.
async function rawFetch(listingId) {
  const r = await fetch(`${ENCAR_API}/${listingId}`, {
    headers: {
      accept: 'application/json',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error(`encar ${r.status}`)
  const data = await r.json()
  const list = Array.isArray(data.photos) ? data.photos : []
  // Code-аар sort хийнэ (001, 002, ... 020): эхний хэдэн зураг гадаргуу, дараах нь дотор.
  const sorted = list
    .filter((p) => p && p.path)
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
  return sorted.map((p) => ({
    url: ENCAR_CDN + p.path + HD_SUFFIX,
    thumb_url: ENCAR_CDN + p.path,
  }))
}

async function fetchEncarPhotos(listingId) {
  if (!listingId) return []
  const key = String(listingId)
  const hit = cache.get(key)
  const now = Date.now()
  if (hit && now - hit.time < CACHE_TTL) return hit.photos
  if (inflight.has(key)) return inflight.get(key)
  const p = rawFetch(key)
    .then((photos) => {
      cache.set(key, { photos, time: Date.now() })
      return photos
    })
    .catch((e) => {
      // Encar fail хийсэн ч quietly fallback хийнэ — Carapis-ийн зургуудыг
      // үлдээж frontend-руу буцаана.
      console.warn(`[encar photos] ${key} fail: ${e.message}`)
      return []
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

module.exports = { fetchEncarPhotos }
