// Korean → English + Mongolian translations for the small set of fields
// Encar returns in Korean (fuel, color, transmission, body type).
// Brand/model/grade come back in English already, so they pass through.

const FUEL = {
  '가솔린': { en: 'Gasoline', mn: 'Бензин' },
  '디젤': { en: 'Diesel', mn: 'Дизель' },
  'LPG': { en: 'LPG', mn: 'Газ' },
  '하이브리드': { en: 'Hybrid', mn: 'Hybrid Хосолсон' },
  '전기': { en: 'Electric', mn: 'Цахилгаан' },
  '수소': { en: 'Hydrogen', mn: 'Устөрөгч' },
  '가솔린(LPG겸용)': { en: 'Gasoline/LPG', mn: 'Бензин/Газ' },
  '가솔린(CNG겸용)': { en: 'Gasoline/CNG', mn: 'Бензин/CNG' },
}

const TRANSMISSION = {
  '오토': { en: 'Auto', mn: 'Автомат' },
  '수동': { en: 'Manual', mn: 'Механик' },
  'CVT': { en: 'CVT', mn: 'CVT' },
  '세미오토': { en: 'Semi-Auto', mn: 'Хагас автомат' },
  'DCT': { en: 'DCT', mn: 'DCT' },
}

const COLOR = {
  '흰색': { en: 'White', mn: 'Цагаан' },
  '검정색': { en: 'Black', mn: 'Хар' },
  '회색': { en: 'Gray', mn: 'Саарал' },
  '은색': { en: 'Silver', mn: 'Мөнгөн' },
  '은회색': { en: 'Silver Gray', mn: 'Мөнгөн саарал' },
  '진주색': { en: 'Pearl', mn: 'Сувдан цагаан' },
  '진주투톤': { en: 'Pearl Two-Tone', mn: 'Сувдан хос өнгө' },
  '파랑색': { en: 'Blue', mn: 'Хөх' },
  '청색': { en: 'Blue', mn: 'Хөх' },
  '빨강색': { en: 'Red', mn: 'Улаан' },
  '주황색': { en: 'Orange', mn: 'Улбар шар' },
  '갈색': { en: 'Brown', mn: 'Бор' },
  '베이지색': { en: 'Beige', mn: 'Беж' },
  '노랑색': { en: 'Yellow', mn: 'Шар' },
  '연두색': { en: 'Light Green', mn: 'Цайвар ногоон' },
  '초록색': { en: 'Green', mn: 'Ногоон' },
  '청록색': { en: 'Teal', mn: 'Хөхвөр ногоон' },
  '하늘색': { en: 'Sky Blue', mn: 'Тэнгэрийн' },
  '보라색': { en: 'Purple', mn: 'Нил' },
  '분홍색': { en: 'Pink', mn: 'Ягаан' },
  '쥐색': { en: 'Gray', mn: 'Саарал' },
  '카키색': { en: 'Khaki', mn: 'Хаки' },
  '와인색': { en: 'Wine', mn: 'Бордов' },
  '골드': { en: 'Gold', mn: 'Алтан' },
  '기타': { en: 'Other', mn: 'Бусад' },
}

const BODY = {
  '소형차': { en: 'Compact', mn: 'Жижиг' },
  '준중형차': { en: 'Compact Sedan', mn: 'Дунд жижиг суудлын' },
  '중형차': { en: 'Midsize Sedan', mn: 'Дунд хэмжээний седан' },
  '준대형차': { en: 'Large Sedan', mn: 'Том седан' },
  '대형차': { en: 'Full-size Sedan', mn: 'Бүрэн хэмжээний седан' },
  '경차': { en: 'Mini', mn: 'Мини / Хотын жижиг автомашин' },
  'SUV': { en: 'SUV', mn: 'SUV' },
  '소형SUV': { en: 'Compact SUV', mn: 'Жижиг SUV' },
  '준중형SUV': { en: 'Midsize SUV', mn: 'Дунд жижиг SUV' },
  '중형SUV': { en: 'Midsize SUV', mn: 'Дунд SUV' },
  '대형SUV': { en: 'Full-size SUV', mn: 'Том SUV' },
  '스포츠카': { en: 'Sports', mn: 'Спорт машин' },
  '컨버터블': { en: 'Convertible', mn: 'Кабриолет' },
  '쿠페': { en: 'Coupe', mn: 'Купе' },
  '왜건': { en: 'Wagon', mn: 'Вагон' },
  '해치백': { en: 'Hatchback', mn: 'Хэтчбэк' },
  'RV': { en: 'RV', mn: 'RV' },
  '미니밴': { en: 'Minivan', mn: 'Мини вэн' },
  '승합': { en: 'Van', mn: 'Вэн' },
  '버스': { en: 'Bus', mn: 'Автобус' },
  '트럭': { en: 'Truck', mn: 'Ачааны' },
}

// Korean city + district abbreviations → friendly Mongolian.
const REGION = {
  '서울': { en: 'Seoul', mn: 'Сөүл' },
  '경기': { en: 'Gyeonggi', mn: 'Кёнги' },
  '인천': { en: 'Incheon', mn: 'Инчон' },
  '부산': { en: 'Busan', mn: 'Бусан' },
  '대구': { en: 'Daegu', mn: 'Тэгү' },
  '대전': { en: 'Daejeon', mn: 'Тэжон' },
  '광주': { en: 'Gwangju', mn: 'Гванжү' },
  '울산': { en: 'Ulsan', mn: 'Ульсан' },
  '세종': { en: 'Sejong', mn: 'Сэжон' },
  '강원': { en: 'Gangwon', mn: 'Канвон' },
  '충북': { en: 'N. Chungcheong', mn: 'Хойд Чүнчон' },
  '충남': { en: 'S. Chungcheong', mn: 'Өмнөд Чүнчон' },
  '전북': { en: 'N. Jeolla', mn: 'Хойд Жолла' },
  '전남': { en: 'S. Jeolla', mn: 'Өмнөд Жолла' },
  '경북': { en: 'N. Gyeongsang', mn: 'Хойд Кёнсан' },
  '경남': { en: 'S. Gyeongsang', mn: 'Өмнөд Кёнсан' },
  '제주': { en: 'Jeju', mn: 'Жэжү' },
}

function region(text, lang = 'mn') {
  if (!text) return text
  // First token is the province/city
  const first = text.trim().split(/\s+/)[0]
  const hit = REGION[first]
  if (!hit) return text
  const friendly = hit[lang] || hit.en
  return lang === 'mn' ? `БНСУ, ${friendly} (${text})` : `${friendly}, South Korea`
}

// Korean brand → English. List endpoint returns Korean only; detail has Englih.
const BRAND = {
  '현대': 'Hyundai',
  '기아': 'Kia',
  '제네시스': 'Genesis',
  '삼성': 'Renault Samsung',
  '르노삼성': 'Renault Samsung',
  '르노코리아': 'Renault Korea',
  'KG모빌리티(쌍용)': 'KGM',
  '쌍용': 'Ssangyong',
  '쉐보레(GM대우)': 'Chevrolet',
  '쉐보레': 'Chevrolet',
  '대우': 'Daewoo',
  'BMW': 'BMW',
  '벤츠': 'Mercedes-Benz',
  '메르세데스-벤츠': 'Mercedes-Benz',
  '아우디': 'Audi',
  '폭스바겐': 'Volkswagen',
  '푸조': 'Peugeot',
  '시트로엥': 'Citroen',
  'DS': 'DS',
  '도요타': 'Toyota',
  '토요타': 'Toyota',
  '렉서스': 'Lexus',
  '혼다': 'Honda',
  '닛산': 'Nissan',
  '인피니티': 'Infiniti',
  '마쯔다': 'Mazda',
  '마즈다': 'Mazda',
  '스바루': 'Subaru',
  '미쓰비시': 'Mitsubishi',
  '미니': 'Mini',
  'MINI': 'Mini',
  '포드': 'Ford',
  '캐딜락': 'Cadillac',
  '링컨': 'Lincoln',
  '지프': 'Jeep',
  '크라이슬러': 'Chrysler',
  '닷지': 'Dodge',
  '램': 'RAM',
  '볼보': 'Volvo',
  '재규어': 'Jaguar',
  '랜드로버': 'Land Rover',
  '포르쉐': 'Porsche',
  '페라리': 'Ferrari',
  '람보르기니': 'Lamborghini',
  '마세라티': 'Maserati',
  '벤틀리': 'Bentley',
  '롤스로이스': 'Rolls-Royce',
  '애스턴마틴': 'Aston Martin',
  '맥라렌': 'McLaren',
  '로터스': 'Lotus',
  '테슬라': 'Tesla',
  '루시드': 'Lucid',
  '리비안': 'Rivian',
  'BYD': 'BYD',
  '비야디': 'BYD',
  '폴스타': 'Polestar',
  '스마트': 'Smart',
  '오펠': 'Opel',
  '피아트': 'Fiat',
  '알파로메오': 'Alfa Romeo',
  '람보르기니': 'Lamborghini',
  '부가티': 'Bugatti',
}

function lookup(map, value, lang = 'en') {
  if (!value) return value
  const hit = map[value]
  if (!hit) return value
  return hit[lang] || value
}

function brand(v) {
  if (!v) return v
  if (BRAND[v]) return BRAND[v]
  // Try without parenthetical suffix: "쉐보레(GM대우)" → "쉐보레"
  const cleaned = v.replace(/\(.*\)$/, '').trim()
  return BRAND[cleaned] || v
}

module.exports = {
  brand,
  region,
  fuel: (v, lang) => lookup(FUEL, v, lang),
  transmission: (v, lang) => lookup(TRANSMISSION, v, lang),
  color: (v, lang) => lookup(COLOR, v, lang),
  body: (v, lang) => lookup(BODY, v, lang),
  BRAND_MAP: BRAND,
}
