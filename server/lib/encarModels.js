// Korean model + badge phrases → English.
// Encar's list endpoint returns Korean for these fields; the detail
// endpoint already has English equivalents in `category.*EnglishName`.
//
// Strategy: replace longest substrings first so "더 뉴" prefixes and
// common Korean tokens get translated before short ones.

const PHRASES = [
  // Generation/refresh prefixes — frequent in Korean model names
  ['올 뉴', 'All New'],
  ['더 뉴', 'The New'],
  ['더뉴', 'The New'],
  ['뉴', 'New'],
  ['디 올 뉴', 'The All New'],
  ['더 더 뉴', 'The All New'],

  // Body type words
  ['시리즈', 'Series'],
  ['세단', 'Sedan'],
  ['쿠페', 'Coupe'],
  ['컨버터블', 'Convertible'],
  ['카브리올레', 'Cabriolet'],
  ['해치백', 'Hatchback'],
  ['왜건', 'Wagon'],
  ['에스테이트', 'Estate'],
  ['스포츠', 'Sport'],
  ['스포츠백', 'Sportback'],
  ['스포츠 카', 'Sports Car'],
  ['하이브리드', 'Hybrid'],
  ['플러그인', 'Plug-In'],
  ['전기차', 'EV'],
  ['일렉트릭', 'Electric'],
  ['프리미엄', 'Premium'],
  ['초이스', 'Choice'],
  ['리미티드', 'Limited'],
  ['시그니처', 'Signature'],
  ['셀렉션', 'Selection'],
  ['플러스', 'Plus'],
  ['익스클루시브', 'Exclusive'],
  ['스탠다드', 'Standard'],
  ['엘리트', 'Elite'],
  ['모던', 'Modern'],
  ['스타일', 'Style'],
  ['프레스티지', 'Prestige'],
  ['칼리그래피', 'Calligraphy'],
  ['캘리그래피', 'Calligraphy'],
  ['인스퍼레이션', 'Inspiration'],
  ['익스트림', 'Extreme'],
  ['그란', 'Gran'],
  ['투어링', 'Touring'],
  ['아반떼', 'Avante'],

  // === Hyundai ===
  ['그랜저', 'Grandeur'],
  ['쏘나타', 'Sonata'],
  ['소나타', 'Sonata'],
  ['아반떼', 'Avante'],
  ['엘란트라', 'Elantra'],
  ['엑센트', 'Accent'],
  ['벨로스터', 'Veloster'],
  ['투싼', 'Tucson'],
  ['싼타페', 'Santa Fe'],
  ['팰리세이드', 'Palisade'],
  ['아이오닉', 'Ioniq'],
  ['코나', 'Kona'],
  ['베뉴', 'Venue'],
  ['스타리아', 'Staria'],
  ['포터', 'Porter'],
  ['갤로퍼', 'Galloper'],
  ['캐스퍼', 'Casper'],
  ['넥쏘', 'Nexo'],
  ['에쿠스', 'Equus'],
  ['제네시스', 'Genesis'],
  ['카스타', 'Casta'],

  // === Kia ===
  ['모닝', 'Morning'],
  ['레이', 'Ray'],
  ['스토닉', 'Stonic'],
  ['쏘렌토', 'Sorento'],
  ['소렌토', 'Sorento'],
  ['스포티지', 'Sportage'],
  ['모하비', 'Mohave'],
  ['카니발', 'Carnival'],
  ['프라이드', 'Pride'],
  ['포르테', 'Forte'],
  ['옵티마', 'Optima'],
  ['스팅어', 'Stinger'],
  ['니로', 'Niro'],
  ['셀토스', 'Seltos'],
  ['텔루라이드', 'Telluride'],
  ['봉고', 'Bongo'],

  // === Genesis ===
  ['에코다이내믹', 'Eco Dynamics'],

  // === Chevrolet / Daewoo ===
  ['스파크', 'Spark'],
  ['크루즈', 'Cruze'],
  ['아베오', 'Aveo'],
  ['말리부', 'Malibu'],
  ['임팔라', 'Impala'],
  ['올란도', 'Orlando'],
  ['캡티바', 'Captiva'],
  ['트레일블레이저', 'Trailblazer'],
  ['트래버스', 'Traverse'],
  ['타호', 'Tahoe'],
  ['이쿼녹스', 'Equinox'],
  ['트랙스', 'Trax'],
  ['콜로라도', 'Colorado'],

  // === Renault Samsung / KGM ===
  ['SM3', 'SM3'],
  ['SM5', 'SM5'],
  ['SM6', 'SM6'],
  ['SM7', 'SM7'],
  ['QM3', 'QM3'],
  ['QM5', 'QM5'],
  ['QM6', 'QM6'],
  ['XM3', 'XM3'],
  ['렉스턴', 'Rexton'],
  ['코란도', 'Korando'],
  ['티볼리', 'Tivoli'],
  ['토레스', 'Torres'],

  // === BMW (Korean kept in some text)
  ['액티브 투어러', 'Active Tourer'],
  ['그란 투리스모', 'Gran Turismo'],

  // === Mercedes-Benz ===
  ['클래스', 'Class'],
  ['마이바흐', 'Maybach'],

  // === Misc ===
  ['신형', 'New'],
  ['구형', 'Old'],
  ['풀체인지', 'Full-Change'],
  ['페이스리프트', 'Facelift'],
  ['디젤', 'Diesel'],
  ['가솔린', 'Gasoline'],
  ['전기', 'Electric'],
  ['수소', 'Hydrogen'],
  ['LPG', 'LPG'],
  ['터보', 'Turbo'],
  ['수동', 'Manual'],
  ['오토', 'Auto'],
  ['세대', 'Gen'],
  ['모델', 'Model'],
  ['고급형', 'Luxury'],
  ['표준형', 'Standard'],
  ['승용', 'Passenger'],
  ['디럭스', 'Deluxe'],
  ['컴포트', 'Comfort'],
  ['플래티넘', 'Platinum'],
  ['프라임', 'Prime'],
  ['익스플로러', 'Explorer'],
  ['센스', 'Sense'],
  ['모노', 'Mono'],
  ['로얄', 'Royal'],
  ['디스커버리', 'Discovery'],
  ['레더', 'Leather'],
  ['패키지', 'Package'],
  ['옵션', 'Option'],
  ['에디션', 'Edition'],
  ['스페셜', 'Special'],
  ['라인', 'Line'],
  ['칸', 'Khan'],
  ['센터', 'Center'],
  ['뷰티풀', 'Beautiful'],
  ['플래그십', 'Flagship'],
  ['크롬', 'Chrome'],
  ['컴팩트', 'Compact'],
  ['젠틀', 'Gentle'],
  ['로드스터', 'Roadster'],
  ['파노라마', 'Panoramic'],
  ['미드나잇', 'Midnight'],
  ['데이라이트', 'Daylight'],
  ['플래닛', 'Planet'],
  ['스마트', 'Smart'],
  ['컴포트라인', 'Comfortline'],
  ['트렌드라인', 'Trendline'],
  ['하이라인', 'Highline'],
  ['알티튜드', 'Altitude'],
  ['시티', 'City'],
  ['컨트리', 'Country'],
  ['디럭스', 'Deluxe'],
  ['그란데', 'Grande'],
  ['파이오니어', 'Pioneer'],
  ['액티브', 'Active'],
  ['디자인', 'Design'],
  ['콤포트', 'Comfort'],
  ['아드밴스', 'Advance'],
  ['아트라', 'Atra'],
  ['파이널', 'Final'],
  ['클럽', 'Club'],
  ['하이브', 'Hive'],
  ['빅터', 'Victor'],
  ['플라티눔', 'Platinum'],
  ['세븐', 'Seven'],
  ['에코', 'Eco'],
  ['모터스포츠', 'Motorsport'],
  ['트랙', 'Track'],
  ['리얼', 'Real'],
  ['패밀리', 'Family'],
  ['앤솔로지', 'Anthology'],
  ['프롤로그', 'Prologue'],
  ['에피소드', 'Episode'],
  ['타임', 'Time'],
  ['프리스타일', 'Freestyle'],
  ['넘버', 'Number'],
  ['파워', 'Power'],
  ['시그너스', 'Cygnus'],
]

// Sort by length so longer matches replace first.
const SORTED = [...PHRASES].sort((a, b) => b[0].length - a[0].length)

function translateModelText(text) {
  if (!text) return text
  let out = text
  for (const [kr, en] of SORTED) {
    if (out.indexOf(kr) !== -1) {
      out = out.split(kr).join(en)
    }
  }
  // Clean up double spaces from replacements
  return out.replace(/\s+/g, ' ').trim()
}

// Probe whether a string still contains Korean characters.
// Covers Hangul syllables (가-힣) and the Jamo blocks too.
function hasKorean(s) {
  return /[ᄀ-ᇿ㄰-㆏가-힣]/.test(String(s || ''))
}

module.exports = { translateModelText, hasKorean }
