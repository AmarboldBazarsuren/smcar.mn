// Encar deep-link helper.
//
// Strategy change (2026-05-12): we stop trying to identify THE single
// listing on Encar — Carapis's price/mileage drift from Encar's live
// values made every confidence threshold either too tight (no match)
// or too loose (wrong match). The cross-API matching loop is gone.
//
// Instead we build a URL that opens Encar's own search list pre-filtered
// to year + (Korean) brand keyword + a narrow mileage/price band. The
// typical result is 1-5 listings, one of which is the exact car. The
// investor / user picks visually — far more reliable than guessing.
//
// Encar's search URL format:
//   https://www.encar.com/dc/dc_carsearchlist.do?carType=<kor|for>
//     &searchType=keyword&keyword=<korean brand model year>
//     #!{"action":"(And.Hidden.N._.CarType.<T>._.Year.range(...)
//        ._.Mileage.range(...)._.Price.range(...).)","sort":"ModifiedDate","page":1,"limit":20}

// Korean brand names for keyword search.
const BRAND_KR: Record<string, string> = {
  Hyundai: '현대',
  Kia: '기아',
  Genesis: '제네시스',
  KGM: 'KG모빌리티',
  Ssangyong: '쌍용',
  'Renault Samsung': '르노삼성',
  'Renault Korea': '르노코리아',
  Daewoo: '대우',
  Chevrolet: '쉐보레',
  BMW: 'BMW',
  'Mercedes-Benz': '벤츠',
  Audi: '아우디',
  Volkswagen: '폭스바겐',
  Porsche: '포르쉐',
  Mini: 'MINI',
  Jaguar: '재규어',
  'Land Rover': '랜드로버',
  Bentley: '벤틀리',
  'Rolls-Royce': '롤스로이스',
  Toyota: '도요타',
  Lexus: '렉서스',
  Honda: '혼다',
  Nissan: '닛산',
  Infiniti: '인피니티',
  Mazda: '마쯔다',
  Subaru: '스바루',
  Mitsubishi: '미쯔비시',
  Ford: '포드',
  Cadillac: '캐딜락',
  Lincoln: '링컨',
  Jeep: '지프',
  Chrysler: '크라이슬러',
  Tesla: '테슬라',
  Fiat: '피아트',
  'Alfa Romeo': '알파로메오',
  Ferrari: '페라리',
  Lamborghini: '람보르기니',
  Maserati: '마세라티',
  Volvo: '볼보',
  Peugeot: '푸조',
  Citroen: '시트로엥',
}

const KOREAN_BRANDS = new Set([
  'Hyundai', 'Kia', 'Genesis', 'KGM', 'Ssangyong',
  'Renault Samsung', 'Renault Korea', 'Daewoo', 'Chevrolet',
])

interface Car {
  brand?: string
  model?: string
  year?: number
  mileage?: number     // km
  price?: number       // 万원
  body_type?: string
}

// Body types that live in Encar's CarType.Y commercial catalogue.
const COMMERCIAL_BODIES = new Set([
  'truck', 'van', 'minivan', 'pickup', 'bus',
  'Truck', 'Van', 'Minivan', 'Pickup', 'Bus',
  'Ачааны', 'Вэн', 'Мини вэн', 'Пикап', 'Автобус',
])

function carTypeFor(car: Car): 'A' | 'N' | 'Y' {
  if (car.body_type && COMMERCIAL_BODIES.has(car.body_type)) return 'Y'
  if (car.brand && KOREAN_BRANDS.has(car.brand)) return 'A'
  return 'N'
}

// Build a precise Encar search URL pre-filtered to a narrow window.
// Year is exact; mileage/price wrap a small range around the known
// values. The investor sees 1-5 results and picks the matching photo.
export function buildPreciseEncarUrl(car: Car): string {
  const year = car.year || 0
  const km = car.mileage || 0
  const manwon = car.price || 0

  // Mileage window: ±500 km when high-mileage, ±200 km when low.
  const kmRange = km > 5000 ? 500 : 200
  const miMin = Math.max(0, km - kmRange)
  const miMax = km + kmRange

  // Price window: ±5 万원 (±50,000 KRW) is tight enough that we usually
  // narrow to a couple of listings yet loose enough to absorb minor
  // staleness in Carapis's snapshot.
  const priceRange = 5
  const prMin = Math.max(0, manwon - priceRange)
  const prMax = manwon + priceRange

  const ct = carTypeFor(car)
  const dslParts = ['Hidden.N.', `CarType.${ct}.`]
  if (year) dslParts.push(`Year.range(${year}01..${year}12).`)
  if (km) dslParts.push(`Mileage.range(${miMin}..${miMax}).`)
  if (manwon) dslParts.push(`Price.range(${prMin}..${prMax}).`)
  const action = `(And.${dslParts.join('_.')})`

  const hash = JSON.stringify({
    action,
    toggle: {},
    layer: '',
    sort: 'ModifiedDate',
    page: 1,
    limit: 20,
    searchKey: '',
    loginCheck: false,
  })

  // Keyword for keyword-search index too (brand-in-Korean + model + year).
  const kw = [BRAND_KR[car.brand || ''] || car.brand, car.model, car.year]
    .filter(Boolean)
    .join(' ')

  const carTypeParam = ct === 'A' ? 'kor' : ct === 'N' ? 'for' : 'truck'
  const params = new URLSearchParams({
    carType: carTypeParam,
    searchType: 'keyword',
    keyword: kw,
  })

  return (
    `https://www.encar.com/dc/dc_carsearchlist.do?${params.toString()}` +
    `#!${encodeURI(hash)}`
  )
}
