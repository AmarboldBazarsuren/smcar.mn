// Browser-side reverse lookup: given a Carapis vehicle (which hides the
// real Encar listing_id on the free tier), search api.encar.com for an
// exact match by brand + year + mileage + price and return Encar's carId.
//
// Encar's CORS policy specifically allows https://smcar.mn so the
// user's browser can hit api.encar.com directly while our VPS IP is
// blocked.
//
// Match philosophy: prefer FALSE NEGATIVES over false positives. If we
// can't confidently identify the listing we return null and let the UI
// fall back to a search URL — much better than deep-linking to the
// wrong car.

// English brand → Korean name as it appears in Encar's Manufacturer
// field. Foreign brands ("BMW", "Audi") stay in Latin.
const KOREAN_BRAND: Record<string, string> = {
  Hyundai: '현대',
  Kia: '기아',
  Genesis: '제네시스',
  KGM: 'KG모빌리티(쌍용)',
  Ssangyong: '쌍용',
  'Renault Samsung': '르노삼성',
  'Renault Korea': '르노코리아',
  'Renault Korea Motors': '르노코리아',
  Daewoo: '대우',
  Chevrolet: '쉐보레(GM대우)',
  Samsung: '삼성',
}

interface Car {
  brand?: string
  model?: string
  year?: number
  mileage?: number
  price?: number // 万원
}

interface SearchHit {
  Id: string
  Manufacturer: string
  Model: string
  Badge?: string
  BadgeDetail?: string
  Year: number
  Mileage: number
  Price: number
}

function buildDslQuery(car: Car, range: { miMin: number; miMax: number }): string {
  const mfg = (car.brand && KOREAN_BRAND[car.brand]) || car.brand || ''
  const yearFrom = `${car.year}01`
  const yearTo = `${car.year}12`
  const parts = [`CarType.A.`]
  if (mfg) parts.push(`Manufacturer.${mfg}.`)
  parts.push(`Year.range(${yearFrom}..${yearTo}).`)
  parts.push(`Mileage.range(${range.miMin}..${range.miMax}).`)
  return `(And.${parts.join('_.')})`
}

async function fetchEncarMatches(car: Car, range: { miMin: number; miMax: number }): Promise<SearchHit[]> {
  const q = buildDslQuery(car, range)
  const sr = '|ModifiedDate|0|100'
  const url = `https://api.encar.com/search/car/list/general?count=true&q=${encodeURIComponent(q)}&sr=${encodeURIComponent(sr)}`
  try {
    const res = await fetch(url, { credentials: 'omit' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.SearchResults) ? data.SearchResults : []
  } catch {
    return []
  }
}

// A "strong" match must hit both mileage AND price closely. One alone
// is not enough — there are plenty of listings sharing one or the other.
const MILEAGE_TOLERANCE = 200       // km
const PRICE_TOLERANCE_MANWON = 10   // 100,000 KRW

function isStrongMatch(car: Car, hit: SearchHit): boolean {
  if (!car.mileage || !car.price || !hit.Mileage || !hit.Price) return false
  const kmDiff = Math.abs(hit.Mileage - car.mileage)
  const priceDiff = Math.abs(hit.Price - car.price)
  return kmDiff <= MILEAGE_TOLERANCE && priceDiff <= PRICE_TOLERANCE_MANWON
}

// Combined distance for picking between several strong matches.
function distance(car: Car, hit: SearchHit): number {
  const kmDiff = Math.abs((hit.Mileage || 0) - (car.mileage || 0))
  const priceDiff = Math.abs((hit.Price || 0) - (car.price || 0))
  // Weight km and price comparably (1 만원 ≈ 200 km of value)
  return kmDiff / 200 + priceDiff / 1
}

export async function findEncarCarId(car: Car): Promise<string | null> {
  if (!car?.year || !car?.mileage || !car?.price) return null
  const targetKm = car.mileage
  // Cast a slightly wider net than MILEAGE_TOLERANCE so we don't miss
  // listings whose mileage drifted a bit since Carapis last scraped.
  const range = { miMin: Math.max(0, targetKm - 500), miMax: targetKm + 500 }
  const hits = await fetchEncarMatches(car, range)
  if (hits.length === 0) return null
  const strong = hits.filter((h) => isStrongMatch(car, h))
  if (strong.length === 0) return null
  // Pick the one closest in combined km+price distance.
  strong.sort((a, b) => distance(car, a) - distance(car, b))
  return strong[0].Id
}

export function encarDetailUrl(carId: string): string {
  return `https://fem.encar.com/cars/detail/${carId}`
}
