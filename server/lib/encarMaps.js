// Encar API-аас ирэх солонгос утгуудыг англи/монгол руу хөрвүүлэх,
// мөн frontend-ийн англи filter утгуудыг Encar query DSL-ийн солонгос
// нэр рүү буцааж хөрвүүлэх dictionary-ууд.
//
// Бүх нэрсийг Encar iNav facet metadata-аас (2026-06-11) шууд гаргаж авсан
// тул query-д яг тааруулж байгаа. Encar query DSL дотор хаалтны хаалтыг ")"
// тэмдгийг "_" болгож escape хийдэг (жишээ: "쉐보레(GM대우)" → "쉐보레(GM대우_").

// ===== Manufacturer: English (frontend) → Korean (Encar query) =====
const BRAND_EN_TO_KO = {
  hyundai: '현대',
  genesis: '제네시스',
  kia: '기아',
  chevrolet: '쉐보레(GM대우)',
  'gm daewoo': '쉐보레(GM대우)',
  daewoo: '쉐보레(GM대우)',
  renault: '르노코리아(삼성)',
  'renault korea': '르노코리아(삼성)',
  'renault samsung': '르노코리아(삼성)',
  samsung: '르노코리아(삼성)',
  'kg mobility': 'KG모빌리티(쌍용)',
  ssangyong: 'KG모빌리티(쌍용)',
  bmw: 'BMW',
  byd: 'BYD',
  gmc: 'GMC',
  nissan: '닛산',
  daihatsu: '다이하쯔',
  dodge: '닷지',
  toyota: '도요타',
  lamborghini: '람보르기니',
  'land rover': '랜드로버',
  landrover: '랜드로버',
  lexus: '렉서스',
  lotus: '로터스',
  'rolls-royce': '롤스로이스',
  'rolls royce': '롤스로이스',
  lincoln: '링컨',
  maserati: '마세라티',
  maybach: '마이바흐',
  mazda: '마쯔다',
  mclaren: '맥라렌',
  mini: '미니',
  mitsubishi: '미쯔비시',
  'mercedes-benz': '벤츠',
  mercedes: '벤츠',
  benz: '벤츠',
  bentley: '벤틀리',
  volvo: '볼보',
  bugatti: '부가티',
  saab: '사브',
  subaru: '스바루',
  suzuki: '스즈키',
  smart: '스마트',
  scion: '사이언',
  citroen: '시트로엥/DS',
  ds: '시트로엥/DS',
  audi: '아우디',
  'alfa romeo': '알파 로메오',
  'aston martin': '애스턴마틴',
  acura: '어큐라',
  infiniti: '인피니티',
  jaguar: '재규어',
  jeep: '지프',
  cadillac: '캐딜락',
  chrysler: '크라이슬러',
  tesla: '테슬라',
  ferrari: '페라리',
  ford: '포드',
  porsche: '포르쉐',
  volkswagen: '폭스바겐',
  vw: '폭스바겐',
  polestar: '폴스타',
  peugeot: '푸조',
  fiat: '피아트',
  hummer: '험머',
  honda: '혼다',
}

// ===== Manufacturer: Korean (Encar) → English (display) =====
const BRAND_KO_TO_EN = {
  현대: 'Hyundai',
  제네시스: 'Genesis',
  기아: 'Kia',
  '쉐보레(GM대우)': 'Chevrolet',
  쉐보레: 'Chevrolet',
  '르노코리아(삼성)': 'Renault',
  르노: 'Renault',
  'KG모빌리티(쌍용)': 'KG Mobility',
  BMW: 'BMW',
  BYD: 'BYD',
  GMC: 'GMC',
  닛산: 'Nissan',
  다이하쯔: 'Daihatsu',
  닷지: 'Dodge',
  도요타: 'Toyota',
  람보르기니: 'Lamborghini',
  랜드로버: 'Land Rover',
  렉서스: 'Lexus',
  로터스: 'Lotus',
  롤스로이스: 'Rolls-Royce',
  링컨: 'Lincoln',
  마세라티: 'Maserati',
  마이바흐: 'Maybach',
  마쯔다: 'Mazda',
  맥라렌: 'McLaren',
  미니: 'Mini',
  미쯔비시: 'Mitsubishi',
  벤츠: 'Mercedes-Benz',
  벤틀리: 'Bentley',
  볼보: 'Volvo',
  사브: 'Saab',
  스바루: 'Subaru',
  스즈키: 'Suzuki',
  스마트: 'Smart',
  사이언: 'Scion',
  '시트로엥/DS': 'Citroen',
  아우디: 'Audi',
  '알파 로메오': 'Alfa Romeo',
  애스턴마틴: 'Aston Martin',
  어큐라: 'Acura',
  인피니티: 'Infiniti',
  재규어: 'Jaguar',
  지프: 'Jeep',
  캐딜락: 'Cadillac',
  크라이슬러: 'Chrysler',
  테슬라: 'Tesla',
  페라리: 'Ferrari',
  포드: 'Ford',
  포르쉐: 'Porsche',
  폭스바겐: 'Volkswagen',
  폴스타: 'Polestar',
  푸조: 'Peugeot',
  피아트: 'Fiat',
  험머: 'Hummer',
  혼다: 'Honda',
}

// ===== Fuel: Korean → English (display) =====
const FUEL_KO_TO_EN = {
  가솔린: 'Gasoline',
  디젤: 'Diesel',
  전기: 'Electric',
  '가솔린+전기': 'Hybrid',
  '디젤+전기': 'Hybrid',
  'LPG+전기': 'Hybrid',
  '수소+전기': 'Hybrid',
  '가솔린+LPG': 'LPG',
  '가솔린+CNG': 'Gasoline',
  'LPG(일반인 구입)': 'LPG',
  LPG: 'LPG',
  수소: 'Hydrogen',
  CNG: 'CNG',
  기타: '',
}

// ===== Fuel: English (frontend filter) → Korean (Encar query) =====
const FUEL_EN_TO_KO = {
  gasoline: '가솔린',
  diesel: '디젤',
  electric: '전기',
  hybrid: '가솔린+전기',
  lpg: 'LPG(일반인 구입)',
  hydrogen: '수소',
  cng: 'CNG',
}

// ===== Transmission: Korean → English =====
const TRANS_KO_TO_EN = {
  오토: 'Automatic',
  수동: 'Manual',
  세미오토: 'Semi-Automatic',
  CVT: 'CVT',
  기타: '',
}

// ===== Transmission: English (frontend filter) → Korean (Encar query) =====
const TRANS_EN_TO_KO = {
  auto: '오토',
  automatic: '오토',
  manual: '수동',
  cvt: 'CVT',
}

// ===== Color: English (frontend filter) → Korean (Encar query) =====
// Encar нь олон нарийн өнгөтэй — frontend-ийн үндсэн өнгө бүрийг хамгийн
// түгээмэл Encar өнгөтэй тааруулна.
const COLOR_EN_TO_KO = {
  white: '흰색',
  black: '검정색',
  gray: '쥐색',
  grey: '쥐색',
  silver: '은색',
  blue: '청색',
  red: '빨간색',
  green: '녹색',
  yellow: '노란색',
  brown: '갈색',
  beige: '연금색',
  gold: '금색',
  orange: '주황색',
  purple: '보라색',
  pink: '분홍색',
}

// ===== Color: Korean → English (display) =====
const COLOR_KO_TO_EN = {
  흰색: 'White',
  검정색: 'Black',
  쥐색: 'Gray',
  청색: 'Blue',
  은색: 'Silver',
  은회색: 'Silver',
  진주색: 'Pearl',
  빨간색: 'Red',
  하늘색: 'Sky Blue',
  녹색: 'Green',
  갈색: 'Brown',
  담녹색: 'Green',
  노란색: 'Yellow',
  연금색: 'Beige',
  명은색: 'Silver',
  연두색: 'Light Green',
  은하색: 'Silver',
  주황색: 'Orange',
  자주색: 'Purple',
  청옥색: 'Turquoise',
  보라색: 'Purple',
  분홍색: 'Pink',
  금색: 'Gold',
}

// ===== Body type: Korean → English =====
const BODY_KO_TO_EN = {
  경차: 'Compact',
  소형차: 'Subcompact',
  준중형차: 'Compact',
  중형차: 'Sedan',
  준대형차: 'Sedan',
  대형차: 'Sedan',
  스포츠카: 'Coupe',
  SUV: 'SUV',
  RV: 'Minivan',
  승합차: 'Van',
  화물차: 'Truck',
  버스: 'Bus',
  특장차: 'Truck',
}

// ===== Region: Korean → Mongolian (display) =====
const REGION_KO_TO_MN = {
  서울: 'Сөүл',
  경기: 'Гёнги',
  인천: 'Инчон',
  부산: 'Бусан',
  대구: 'Тэгу',
  광주: 'Гванжу',
  대전: 'Тэжон',
  울산: 'Ульсан',
  세종: 'Сэжон',
  강원: 'Гануон',
  충북: 'Чунбук',
  충남: 'Чуннам',
  전북: 'Жонбук',
  전남: 'Жоннам',
  경북: 'Гёнбук',
  경남: 'Гённам',
  제주: 'Жэжу',
}

// Encar query DSL-ийн VALUE хэсгийг URL-д шууд тавихад бэлэн болгож encode
// хийнэ. Солонгос үсэг → %xx, "+" → %2B (саармагжуулна), мөн хамгийн чухал
// нь хаалтуудыг %28/%29 болгоно — ингэснээр Encar parser тэдгээрийг бүтцийн
// хаалт биш, утгын хэсэг гэж үзнэ (жишээ: "쉐보레(GM대우)" брэнд). encode
// хийсэн value-уудыг агуулсан query-г ДАХИН encode хийхгүй.
function encodeQueryValue(s) {
  return encodeURIComponent(String(s == null ? '' : s))
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\./g, '%2E')
}

module.exports = {
  BRAND_EN_TO_KO,
  BRAND_KO_TO_EN,
  FUEL_KO_TO_EN,
  FUEL_EN_TO_KO,
  TRANS_KO_TO_EN,
  TRANS_EN_TO_KO,
  COLOR_EN_TO_KO,
  COLOR_KO_TO_EN,
  BODY_KO_TO_EN,
  REGION_KO_TO_MN,
  encodeQueryValue,
}
