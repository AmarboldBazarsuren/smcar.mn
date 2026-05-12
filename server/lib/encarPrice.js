// Encar mobile API-аас зөвхөн үнийг татна. Бусад data (бренд, model, photo) бүгд
// Carapis-аас ирдэг — энэ нь зөвхөн price_krw-ийг найдвартай олж авах
// бараа. Carapis-ийн price_usd нь зарим машинд буруу label-тай (Encar 만원
// утгыг "price_usd" гэж label хийсэн), тиймээс жинхэнэ үнэ хэрэгтэй
// үед эх үүсвэр рүү шууд хүрэх ёстой.
//
// Endpoint: https://api.encar.com/v1/readside/vehicle/{listing_id}
// Response: { advertisement: { price: 6700 }, category: { originPrice: ... } }
// price нь 만원 (10,000 KRW нэгж) тул × 10000 хийж бүтэн KRW гарга.

const ENCAR_API = 'https://api.encar.com/v1/readside/vehicle'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

const CACHE_TTL = 24 * 60 * 60 * 1000   // 24 цаг — Encar-аас үнэ ховор өөрчилөгддөг
const STALE_TTL = 7 * 24 * 60 * 60 * 1000
const cache = new Map()
const inflight = new Map()

async function rawFetch(listingId) {
  const url = `${ENCAR_API}/${listingId}`
  const r = await fetch(url, {
    headers: { 'User-Agent': UA, accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
  })
  if (!r.ok) throw new Error(`encar ${r.status}`)
  const j = await r.json()
  const manwon = Number(j?.advertisement?.price)
  if (!manwon || !isFinite(manwon)) return null
  return {
    priceKrw: Math.round(manwon * 10000),
    priceManwon: manwon,
    originPriceKrw: Number(j?.category?.originPrice) || null,
    salesStatus: j?.advertisement?.status || '',
    oneLineText: j?.advertisement?.oneLineText || '',
  }
}

// Encar-аас listing_id-аар үнэ ав. Cache HIT хурдан (μs), MISS ~250ms.
async function getEncarPrice(listingId) {
  if (!listingId) return null
  const lid = String(listingId)
  const hit = cache.get(lid)
  const now = Date.now()
  if (hit && now - hit.time < CACHE_TTL) return hit.data
  if (hit && now - hit.time < STALE_TTL && !inflight.has(lid)) {
    const p = rawFetch(lid)
      .then((d) => { cache.set(lid, { data: d, time: Date.now() }); return d })
      .catch((e) => { console.warn('encar revalidate fail:', e.message); return hit.data })
      .finally(() => inflight.delete(lid))
    inflight.set(lid, p)
    return hit.data
  }
  if (inflight.has(lid)) return inflight.get(lid)
  const p = rawFetch(lid)
    .then((d) => { cache.set(lid, { data: d, time: Date.now() }); return d })
    .catch((e) => {
      if (hit) { console.warn('encar fail, expired cache:', e.message); return hit.data }
      console.warn('encar fail:', e.message)
      return null // Encar дуудлага амжилтгүй → null fallback (Carapis price хадгалагдана)
    })
    .finally(() => inflight.delete(lid))
  inflight.set(lid, p)
  return p
}

module.exports = { getEncarPrice }
