// Render Carapis's English markdown description as a styled block with
// the common phrases swapped to Mongolian. Best-effort translation —
// the dictionary covers the boilerplate Carapis emits; anything unknown
// stays in English so the meaning still comes through.

interface Props {
  text?: string
  carTitle?: string
}

// Longest phrases first so multi-word terms match before their parts.
const PHRASES: [RegExp, string][] = (
  [
    // Section headers
    [/\bHighlights?\b/g, 'Гол мэдээлэл'],
    [/\bFeatures?\b/g, 'Тоноглол'],
    [/\bSpecifications?\b/g, 'Техникийн үзүүлэлт'],
    [/\bSpecs\b/g, 'Үзүүлэлт'],
    [/\bCondition\b/g, 'Байдал'],
    [/\bOverview\b/g, 'Тойм'],
    [/\bDetails\b/g, 'Дэлгэрэнгүй'],
    [/\bDescription\b/g, 'Тайлбар'],
    [/\bBenefits\b/g, 'Давуу талууд'],
    [/\bWhy choose\b/gi, 'Яагаад сонгох'],
    [/\bAbout this vehicle\b/gi, 'Энэ машины тухай'],

    // Status phrases
    [/\bOne previous owner with no accident history\b/gi, 'Нэг л эзэмшигчтэй, ослын түүхгүй'],
    [/\bNo accident history\b/gi, 'Ослын түүхгүй'],
    [/\bAccident[- ]free\b/gi, 'Зам тээврийн осолд ороогүй'],
    [/\bOne owner\b/gi, 'Нэг л эзэмшигчтэй байсан'],
    [/\bOne previous owner\b/gi, 'Нэг л өмнөх эзэмшигчтэй'],
    [/\bSingle owner\b/gi, 'Нэг эзэмшигчтэй'],
    [/\bGenuine mileage\b/gi, 'Бодит явсан км'],
    [/\bLow mileage\b/gi, 'Бага явсан'],
    [/\bWell[- ]maintained\b/gi, 'Сайн арчилгаатай'],
    [/\bImpressive condition\b/gi, 'Гайхамшигтай байдал'],
    [/\bExcellent condition\b/gi, 'Маш сайн байдал'],
    [/\bGood condition\b/gi, 'Сайн байдал'],
    [/\bMint condition\b/gi, 'Шинэ шиг'],
    [/\bOriginal packaging\b/gi, 'Үйлдвэрийн анхны байдал'],
    [/\bOriginal dealership\b/gi, 'Албан ёсны дилерийн'],
    [/\bService completion\b/gi, 'үйлчилгээ хийгдсэн'],
    [/\bRegular service\b/gi, 'Тогтмол үйлчилгээтэй'],
    [/\bService history\b/gi, 'Үйлчилгээний түүх'],
    [/\b(\d+)[- ]point inspection\b/gi, '$1 цэгийн үзлэг'],
    [/\bInspection passed\b/gi, 'Үзлэг хийгдсэн'],
    [/\bInspection report\b/gi, 'Үзлэгийн тайлан'],
    [/\bWarranty included\b/gi, 'Баталгаатай'],
    [/\bExtended warranty\b/gi, 'Сунгасан баталгаа'],
    [/\bQuick Delivery Available\b/gi, 'Шуурхай хүргэлттэй'],
    [/\bReady for export\b/gi, 'Экспортод бэлэн'],
    [/\bImmediate delivery\b/gi, 'Шууд хүргэлт'],

    // Vehicle terms
    [/\bPremium Sedan\b/gi, 'Премиум седан'],
    [/\bLuxury Sedan\b/gi, 'Тансаг седан'],
    [/\bMidsize Sedan\b/gi, 'Дунд хэмжээний седан'],
    [/\bFull[- ]size SUV\b/gi, 'Том SUV'],
    [/\bCompact SUV\b/gi, 'Жижиг SUV'],
    [/\bLuxury SUV\b/gi, 'Тансаг SUV'],
    [/\bSports car\b/gi, 'Спорт машин'],
    [/\bLuxurious interior\b/gi, 'Тансаг салон'],
    [/\bSpacious interior\b/gi, 'Уужим салон'],
    [/\bComfortable ride\b/gi, 'Эвтэйхэн жолоодлого'],
    [/\bSmooth ride\b/gi, 'Жигд жолоодлого'],
    [/\bFuel[- ]efficient\b/gi, 'Шатахуун хэмнэлттэй'],
    [/\bFuel efficiency\b/gi, 'Шатахуун хэмнэлт'],
    [/\bHigh performance\b/gi, 'Өндөр гүйцэтгэлтэй'],
    [/\bAll[- ]wheel drive\b/gi, '4-н дугуйн хөтлөгч'],
    [/\bFront[- ]wheel drive\b/gi, 'Урд хөтлөгч'],
    [/\bRear[- ]wheel drive\b/gi, 'Арын хөтлөгч'],
    [/\bAutomatic transmission\b/gi, 'Автомат хайрцагтай'],
    [/\bManual transmission\b/gi, 'Механик хайрцагтай'],
    [/\bHybrid powertrain\b/gi, 'Хосолсон хөдөлгүүртэй'],
    [/\bElectric vehicle\b/gi, 'Цахилгаан машин'],
    [/\bGasoline engine\b/gi, 'Бензин хөдөлгүүртэй'],
    [/\bDiesel engine\b/gi, 'Дизель хөдөлгүүртэй'],

    // Equipment items
    [/\bLeather seats\b/gi, 'Арьсан суудалтай'],
    [/\bHeated seats\b/gi, 'Халаалттай суудалтай'],
    [/\bVentilated seats\b/gi, 'Агааржуулалттай суудалтай'],
    [/\bMemory seats\b/gi, 'Санамжтай суудалтай'],
    [/\bPanoramic sunroof\b/gi, 'Панорам шилэн люктэй'],
    [/\bSunroof\b/gi, 'Люктэй'],
    [/\bLED headlights?\b/gi, 'LED урд гэрэлтэй'],
    [/\bLED headlamps?\b/gi, 'LED урд гэрэлтэй'],
    [/\bNavigation system\b/gi, 'Навигацтай'],
    [/\bRear[- ]view camera\b/gi, 'Хойд харах камертай'],
    [/\bBackup camera\b/gi, 'Ухрахын камертай'],
    [/\bParking sensors?\b/gi, 'Зогсоолын мэдрэгчтэй'],
    [/\bSmart key\b/gi, 'Ухаалаг түлхүүртэй'],
    [/\bBluetooth\b/gi, 'Bluetooth'],
    [/\bCruise control\b/gi, 'Хурд тогтворжуулагчтай'],
    [/\bClimate control\b/gi, 'Климат контролтой'],
    [/\bHead[- ]up display\b/gi, 'HUD дэлгэцтэй'],

    // Connectors / glue words
    [/\bEquipped with\b/gi, 'Тоноглогдсон'],
    [/\bComes with\b/gi, 'Тоноглогдсон'],
    [/\bFor You\b/gi, 'Танд зориулсан'],
    [/\bImpressive\b/gi, 'Гайхамшигтай'],
    [/\bExcellent\b/gi, 'Маш сайн'],
    [/\bOutstanding\b/gi, 'Гайхалтай'],
    [/\bAmazing\b/gi, 'Гайхамшигтай'],
    [/\bAvailable\b/gi, 'Бэлэн'],
    [/\bIncluded\b/gi, 'Багтсан'],
    [/\bPerfect for\b/gi, 'Тохиромжтой'],
    [/\bIdeal for\b/gi, 'Тохиромжтой'],

    // Numbers / units
    [/\b(\d[\d,]*) km\b/gi, '$1 км'],
    [/\b(\d[\d,]*) cc\b/gi, '$1 cc'],
  ] as [RegExp, string][]
).sort((a, b) => b[0].source.length - a[0].source.length)

function translate(text: string): string {
  let out = text
  for (const [re, mn] of PHRASES) out = out.replace(re, mn)
  return out
}

// Strip the leading title line ("## <car title> - <tagline>") so we
// don't show the same car name twice.
function stripLeadingTitle(text: string, carTitle = ''): string {
  const firstLine = text.split(/\r?\n/, 1)[0] || ''
  if (!firstLine.startsWith('##')) return text
  // Always drop the first '## ...' line — it's a redundant marketing
  // headline ("BMW 5 Series 2023 - Premium Sedan for You").
  void carTitle
  return text.replace(/^##.*\r?\n+/, '')
}

// Tiny markdown renderer — handles ###/## headings and `- ` bullets.
function parseBlocks(text: string) {
  const lines = text.split(/\r?\n/)
  type Block =
    | { type: 'h2' | 'h3' | 'p'; text: string }
    | { type: 'list'; items: string[] }
  const blocks: Block[] = []
  let listBuf: string[] = []
  const flushList = () => {
    if (listBuf.length) {
      blocks.push({ type: 'list', items: listBuf })
      listBuf = []
    }
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushList(); continue }
    if (line.startsWith('### ')) { flushList(); blocks.push({ type: 'h3', text: line.slice(4) }); continue }
    if (line.startsWith('## ')) { flushList(); blocks.push({ type: 'h2', text: line.slice(3) }); continue }
    if (line.startsWith('- ')) { listBuf.push(line.slice(2)); continue }
    flushList()
    blocks.push({ type: 'p', text: line })
  }
  flushList()
  return blocks
}

export default function CarDescription({ text, carTitle }: Props) {
  if (!text || !text.trim()) return null
  const translated = translate(stripLeadingTitle(text, carTitle))
  if (!translated.trim()) return null
  const blocks = parseBlocks(translated)
  if (blocks.length === 0) return null
  return (
    <div>
      <h2 className="text-[20px] font-bold mb-4">Нэмэлт мэдээлэл</h2>
      <div className="bg-gradient-to-br from-red-50 via-white to-white border border-red-100 rounded-2xl p-6 space-y-4">
        {blocks.map((b, i) => {
          if (b.type === 'h2') {
            return (
              <h3 key={i} className="text-[18px] font-bold text-gray-900">
                {b.text}
              </h3>
            )
          }
          if (b.type === 'h3') {
            return (
              <h4 key={i} className="text-[15px] font-bold text-red-700 uppercase tracking-wider mt-2">
                {b.text}
              </h4>
            )
          }
          if (b.type === 'list') {
            return (
              <ul key={i} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-[14.5px] text-gray-700">
                    <span className="mt-0.5 text-red-500 font-bold">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )
          }
          return (
            <p key={i} className="text-[14.5px] text-gray-700 leading-relaxed">
              {b.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}
