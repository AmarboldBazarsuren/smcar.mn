// Browser-side reverse lookup: given a Carapis vehicle (free-tier
// hides listing_id), search api.encar.com for an exact match by
// year + mileage + price and return Encar's numeric carId.
//
// Encar's CORS policy allows https://smcar.mn so we can call their
// search API directly from the user's browser, bypassing our VPS
// IP block.
//
// Approach (this version):
//   1. CarType.A and CarType.N catalogues sit in parallel namespaces
//      (Korean vs imported brands). We run BOTH queries in parallel
//      and merge.
//   2. DSL Manufacturer filter is broken/undocumented — we filter
//      year+mileage on the server, then filter brand client-side
//      against an alias map (Carapis 'Jaguar' ↔ Encar '재규어' etc).
//   3. A match counts only when mileage AND price are both within
//      tight tolerances — false negatives are preferred over false
//      positives.

// English brand → list of strings any of which Encar's Manufacturer
// field may contain. We use 'includes' rather than equality so
// suffixes like 'KG모빌리티(쌍용)' match 'KG모빌리티'.
const BRAND_ALIASES: Record<string, string[]> = {
  // Korean
  Hyundai: ['현대', 'Hyundai'],
  Kia: ['기아', 'Kia'],
  Genesis: ['제네시스', 'Genesis'],
  KGM: ['KG모빌리티', '쌍용', 'KGM'],
  Ssangyong: ['쌍용', 'Ssangyong'],
  'Renault Samsung': ['르노삼성', 'Renault Samsung'],
  'Renault Korea': ['르노코리아', '르노', 'Renault'],
  Daewoo: ['대우', 'Daewoo'],
  Chevrolet: ['쉐보레', 'Chevrolet', 'GM대우'],
  // Foreign — German
  BMW: ['BMW'],
  'Mercedes-Benz': ['벤츠', '메르세데스', 'Mercedes-Benz', 'Mercedes', '메르세데스-벤츠'],
  Audi: ['아우디', 'Audi'],
  Volkswagen: ['폭스바겐', 'Volkswagen'],
  Porsche: ['포르쉐', 'Porsche'],
  Mini: ['미니', 'MINI', 'Mini'],
  Smart: ['스마트', 'Smart'],
  Opel: ['오펠', 'Opel'],
  // Foreign — British
  Jaguar: ['재규어', 'Jaguar'],
  'Land Rover': ['랜드로버', 'Land Rover'],
  Bentley: ['벤틀리', 'Bentley'],
  'Rolls-Royce': ['롤스로이스', 'Rolls-Royce', 'Rolls Royce'],
  'Aston Martin': ['애스턴마틴', 'Aston Martin'],
  McLaren: ['맥라렌', 'McLaren'],
  Lotus: ['로터스', 'Lotus'],
  // Foreign — Japanese
  Toyota: ['도요타', '토요타', 'Toyota'],
  Lexus: ['렉서스', 'Lexus'],
  Honda: ['혼다', 'Honda'],
  Nissan: ['닛산', 'Nissan'],
  Infiniti: ['인피니티', 'Infiniti'],
  Mazda: ['마쯔다', '마즈다', 'Mazda'],
  Subaru: ['스바루', 'Subaru'],
  Mitsubishi: ['미쯔비시', '미쓰비시', 'Mitsubishi'],
  // Foreign — American
  Ford: ['포드', 'Ford'],
  Cadillac: ['캐딜락', 'Cadillac'],
  Lincoln: ['링컨', 'Lincoln'],
  Jeep: ['지프', 'Jeep'],
  Chrysler: ['크라이슬러', 'Chrysler'],
  Dodge: ['닷지', 'Dodge'],
  RAM: ['램', 'RAM'],
  Tesla: ['테슬라', 'Tesla'],
  // Foreign — Italian
  Fiat: ['피아트', 'Fiat'],
  'Alfa Romeo': ['알파로메오', 'Alfa Romeo'],
  Ferrari: ['페라리', 'Ferrari'],
  Lamborghini: ['람보르기니', 'Lamborghini'],
  Maserati: ['마세라티', 'Maserati'],
  // Foreign — French
  Peugeot: ['푸조', 'Peugeot'],
  Citroen: ['시트로엥', 'Citroen'],
  DS: ['DS'],
  // Foreign — Swedish
  Volvo: ['볼보', 'Volvo'],
  Polestar: ['폴스타', 'Polestar'],
  // Foreign — Chinese
  BYD: ['BYD', '비야디'],
}

// Encar splits listings into three CarType buckets:
//   A = Korean passenger cars
//   N = imported passenger cars
//   Y = commercial vehicles (trucks/vans/buses) regardless of origin
// The car could live in any of them — we query all three in parallel
// because we can't reliably guess which one applies for every listing
// (e.g. a Kia Bongo is a Korean brand but a truck, so lives in Y).

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
  Year: number
  Mileage: number
  Price: number
}

function brandMatches(carBrand: string, encarMfg: string): boolean {
  if (!carBrand || !encarMfg) return false
  const aliases = BRAND_ALIASES[carBrand] || [carBrand]
  return aliases.some((a) => encarMfg.includes(a))
}

type CarType = 'A' | 'N' | 'Y'
const CAR_TYPES: CarType[] = ['A', 'N', 'Y']

function buildDslQuery(year: number, miMin: number, miMax: number, carType: CarType): string {
  return `(And.CarType.${carType}._.Year.range(${year}01..${year}12)._.Mileage.range(${miMin}..${miMax}).)`
}

async function fetchEncarPage(year: number, miMin: number, miMax: number, carType: CarType): Promise<SearchHit[]> {
  const q = buildDslQuery(year, miMin, miMax, carType)
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

// Acceptance thresholds (loose). We're filtered by year + brand already;
// among that subset we just want the closest km+price hit. False
// positives within the same model/year/price band are essentially
// indistinguishable from the user's POV anyway.
const MAX_MILEAGE_DIFF = 5000        // km
const MAX_PRICE_DIFF_MANWON = 100    // 1,000,000 KRW

function distance(car: Car, hit: SearchHit): number {
  const kmDiff = Math.abs((hit.Mileage || 0) - (car.mileage || 0))
  const priceDiff = Math.abs((hit.Price || 0) - (car.price || 0))
  // Combine: treat 1 万원 ≈ 100 km of "value distance"
  return kmDiff / 100 + priceDiff
}

function withinTolerance(car: Car, hit: SearchHit): boolean {
  if (!car.mileage || !car.price || !hit.Mileage || !hit.Price) return false
  return (
    Math.abs(hit.Mileage - car.mileage) <= MAX_MILEAGE_DIFF &&
    Math.abs(hit.Price - car.price) <= MAX_PRICE_DIFF_MANWON
  )
}

export async function findEncarCarId(car: Car): Promise<string | null> {
  if (!car?.brand || !car?.year || !car?.mileage || !car?.price) return null

  const targetKm = car.mileage
  // Wide DSL range — actual listing's mileage may drift up since
  // Carapis last scraped, and Encar listings sometimes round.
  const miMin = Math.max(0, targetKm - 5000)
  const miMax = targetKm + 5000

  // Query all three CarType catalogues in parallel — the listing could
  // live in A (Korean passenger), N (imported passenger), or
  // Y (commercial/trucks like Bongo, Porter).
  const pages = await Promise.all(
    CAR_TYPES.map((ct) => fetchEncarPage(car.year!, miMin, miMax, ct))
  )
  const hits = pages.flat()
  const branded = hits.filter((h) => brandMatches(car.brand!, h.Manufacturer))

  // Keep only hits inside the loose mileage+price box.
  const candidates = branded.filter((h) => withinTolerance(car, h))
  if (candidates.length === 0) return null

  // Pick the absolute closest among the survivors.
  candidates.sort((a, b) => distance(car, a) - distance(car, b))
  return candidates[0].Id
}

export function encarDetailUrl(carId: string): string {
  return `https://fem.encar.com/cars/detail/${carId}`
}
