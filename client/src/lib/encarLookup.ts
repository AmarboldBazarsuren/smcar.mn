// Browser-side reverse lookup: given a Carapis vehicle (which hides the
// real Encar listing_id on the free tier), search api.encar.com for a
// close match by brand + year + mileage and return Encar's carId. This
// works only from the user's browser because Encar's CORS policy
// specifically allows https://smcar.mn and the user's IP isn't blocked
// (our VPS IP is).

// English brand → Korean name as it appears in Encar's Manufacturer field.
// Foreign brands ("BMW", "Audi", ...) stay in Latin — Encar indexes them
// that way.
const KOREAN_BRAND: Record<string, string> = {
  Hyundai: '현대',
  Kia: '기아',
  Genesis: '제네시스',
  KGM: 'KG모빌리티(쌍용)',
  Ssangyong: '쌍용',
  'Renault Samsung': '르노삼성',
  'Renault Korea': '르노코리아',
  Daewoo: '대우',
  Chevrolet: '쉐보레',
  Samsung: '삼성',
}

interface Car {
  brand?: string
  model?: string
  year?: number
  mileage?: number
  price?: number // 만원
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
  // Year is yyyyMM in Encar
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
  const sr = '|ModifiedDate|0|50'
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

function normalize(s: string | undefined | null): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim()
}

function modelMatchScore(carModel: string, hit: SearchHit): number {
  const a = normalize(carModel)
  const b = normalize(hit.Model)
  if (!a || !b) return 0
  if (a === b) return 100
  // Word-overlap heuristic
  const wordsA = new Set(a.split(/\s+/))
  const wordsB = new Set(b.split(/\s+/))
  let overlap = 0
  wordsA.forEach((w) => { if (wordsB.has(w)) overlap++ })
  return (overlap / Math.max(wordsA.size, wordsB.size)) * 80
}

function priceMatchScore(targetManwon: number | undefined, hit: SearchHit): number {
  if (!targetManwon || !hit.Price) return 0
  const diff = Math.abs(hit.Price - targetManwon)
  if (diff <= 5) return 50  // within 50,000 KRW
  if (diff <= 50) return 30
  if (diff <= 200) return 15
  return 0
}

function mileageMatchScore(targetKm: number | undefined, hit: SearchHit): number {
  if (!targetKm || !hit.Mileage) return 0
  const diff = Math.abs(hit.Mileage - targetKm)
  if (diff <= 100) return 30
  if (diff <= 500) return 20
  if (diff <= 2000) return 10
  return 0
}

export async function findEncarCarId(car: Car): Promise<string | null> {
  if (!car?.year) return null
  const targetKm = car.mileage || 0
  // Try progressively widening mileage windows
  const windows = [
    { miMin: Math.max(0, targetKm - 200), miMax: targetKm + 200 },
    { miMin: Math.max(0, targetKm - 2000), miMax: targetKm + 2000 },
    { miMin: Math.max(0, targetKm - 10000), miMax: targetKm + 10000 },
  ]
  for (const win of windows) {
    const hits = await fetchEncarMatches(car, win)
    if (!hits.length) continue
    // Score each hit
    const scored = hits
      .map((h) => ({
        h,
        score:
          (h.Mileage === targetKm ? 100 : 0) +
          modelMatchScore(car.model || '', h) +
          priceMatchScore(car.price, h) +
          mileageMatchScore(targetKm, h),
      }))
      .sort((a, b) => b.score - a.score)
    if (scored.length === 0) continue
    const best = scored[0]
    // Require some level of confidence
    if (best.score >= 30) return best.h.Id
  }
  return null
}

export function encarDetailUrl(carId: string): string {
  return `https://fem.encar.com/cars/detail/${carId}`
}
