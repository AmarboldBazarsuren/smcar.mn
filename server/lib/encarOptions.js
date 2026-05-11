// Common Encar option codes → label + category
// Codes are best-effort based on commonly observed values; unknown codes
// fall through with code as the label.

const CATEGORIES = {
  exterior: { en: 'Exterior & Lighting', mn: 'Гадна тал, гэрэлтүүлэг' },
  safety: { en: 'Safety & Driver Assist', mn: 'Аюулгүй байдал, туслах систем' },
  comfort: { en: 'Comfort & Multimedia', mn: 'Тав тух, мультимедиа' },
  seats: { en: 'Seats & Interior', mn: 'Суудал, салон' },
  drivetrain: { en: 'Drivetrain', mn: 'Хөдөлгүүр, хайрцаг' },
}

const OPTIONS = {
  '001': { cat: 'exterior', en: 'Sunroof', mn: 'Люк' },
  '002': { cat: 'exterior', en: 'Panoramic Sunroof', mn: 'Панорам люк' },
  '004': { cat: 'comfort', en: 'Steering Wheel Controls', mn: 'Жолооны товчлуурууд' },
  '005': { cat: 'safety', en: 'Rear-view Camera', mn: 'Ухрахын камер' },
  '006': { cat: 'safety', en: 'Rear Parking Sensor', mn: 'Арын мэдрэгч' },
  '007': { cat: 'safety', en: 'Front Parking Sensor', mn: 'Урд мэдрэгч' },
  '008': { cat: 'comfort', en: 'Navigation', mn: 'Навигац' },
  '014': { cat: 'safety', en: 'Cruise Control', mn: 'Круз контрол' },
  '015': { cat: 'safety', en: 'Auto Parking', mn: 'Автомат зогсоол' },
  '017': { cat: 'exterior', en: 'LED Headlamps', mn: 'LED гэрэл' },
  '018': { cat: 'exterior', en: 'HID Headlamps', mn: 'HID гэрэл' },
  '019': { cat: 'seats', en: 'Heated Seats', mn: 'Халаалттай суудал' },
  '020': { cat: 'seats', en: 'Ventilated Seats', mn: 'Агааржуулалттай суудал' },
  '021': { cat: 'seats', en: 'Memory Seats', mn: 'Санамжтай суудал' },
  '022': { cat: 'seats', en: 'Power Seats', mn: 'Цахилгаан суудал' },
  '023': { cat: 'seats', en: 'Leather Seats', mn: 'Арьсан суудал' },
  '024': { cat: 'safety', en: 'Driver Airbag', mn: 'Жолоочийн дэр' },
  '025': { cat: 'safety', en: 'Passenger Airbag', mn: 'Зорчигчийн дэр' },
  '026': { cat: 'safety', en: 'Side Airbags', mn: 'Хажуугийн дэр' },
  '027': { cat: 'safety', en: 'Curtain Airbags', mn: 'Хөшгийн дэр' },
  '030': { cat: 'safety', en: 'ABS', mn: 'ABS' },
  '031': { cat: 'safety', en: 'Traction Control', mn: 'Гулсалтын хяналт' },
  '032': { cat: 'safety', en: 'Stability Control', mn: 'Тогтворжуулагч' },
  '033': { cat: 'safety', en: 'Lane Departure Warning', mn: 'Эгнээний анхааруулга' },
  '034': { cat: 'safety', en: 'Around View Monitor', mn: '360° камер' },
  '035': { cat: 'safety', en: 'Blind Spot Monitor', mn: 'Сохор цэгийн мэдрэгч' },
  '040': { cat: 'comfort', en: 'Auto Climate Control', mn: 'Автомат агааржуулагч' },
  '055': { cat: 'exterior', en: 'Auto-folding Mirrors', mn: 'Автомат толь эвхэлт' },
  '056': { cat: 'comfort', en: 'Climate Control', mn: 'Цаг агаарын хяналт' },
  '057': { cat: 'comfort', en: 'Smart Key', mn: 'Ухаалаг түлхүүр' },
  '058': { cat: 'exterior', en: 'LED Tail Lamps', mn: 'LED арын гэрэл' },
  '059': { cat: 'exterior', en: 'Daytime Running Lights', mn: 'Өдрийн гэрэл' },
  '063': { cat: 'comfort', en: 'Head-Up Display', mn: 'HUD дэлгэц' },
  '068': { cat: 'comfort', en: 'Bluetooth', mn: 'Bluetooth' },
  '071': { cat: 'comfort', en: 'Powered Trunk', mn: 'Цахилгаан тэвш' },
  '072': { cat: 'exterior', en: 'Panoramic Sunroof', mn: 'Панорам люк' },
  '074': { cat: 'exterior', en: 'Power-folding Mirrors', mn: 'Цахилгаан толь' },
  '075': { cat: 'comfort', en: 'Wireless Charging', mn: 'Утасгүй цэнэглэгч' },
  '077': { cat: 'comfort', en: 'Full Auto AC', mn: 'Бүрэн автомат AC' },
  '081': { cat: 'comfort', en: 'Dual-zone Climate', mn: 'Хос бүсийн агаар' },
  '082': { cat: 'comfort', en: 'Digital Clock', mn: 'Цифр цаг' },
  '084': { cat: 'seats', en: 'Heated Steering Wheel', mn: 'Халаалттай жолоо' },
  '085': { cat: 'comfort', en: 'USB Port', mn: 'USB' },
  '086': { cat: 'comfort', en: 'AUX Input', mn: 'AUX' },
  '094': { cat: 'safety', en: 'Smart Cruise Control', mn: 'Ухаалаг круз' },
  '096': { cat: 'safety', en: 'Lane Keep Assist', mn: 'Эгнээ хадгалагч' },
  '097': { cat: 'safety', en: 'Driving Assist', mn: 'Жолоодлогын туслах' },
  '1017': { cat: 'safety', en: 'Advanced Parking Sensor', mn: 'Дэвшилтэт мэдрэгч' },
}

function expand(options = {}, lang = 'en') {
  const standard = options.standard || []
  const choice = options.choice || []
  const all = [...standard, ...choice]
  const buckets = { exterior: [], safety: [], comfort: [], seats: [], drivetrain: [] }
  const unknown = []
  for (const code of all) {
    const def = OPTIONS[code]
    if (!def) {
      unknown.push(code)
      continue
    }
    const label = def[lang] || def.en
    buckets[def.cat].push({ code, label })
  }
  // Drop empty categories, keep stable order
  const groups = []
  for (const key of ['exterior', 'safety', 'comfort', 'seats', 'drivetrain']) {
    if (buckets[key].length === 0) continue
    groups.push({
      key,
      title: CATEGORIES[key][lang] || CATEGORIES[key].en,
      items: buckets[key],
    })
  }
  return { groups, unknown }
}

module.exports = { expand, CATEGORIES, OPTIONS }
