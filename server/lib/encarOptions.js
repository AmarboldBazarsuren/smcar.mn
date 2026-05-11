// Encar option codes → label + category, English and Mongolian.

const CATEGORIES = {
  exterior: { en: 'Exterior & Lighting', mn: 'Гадна хийц ба гэрэлтүүлэг' },
  safety: { en: 'Safety & Driver Assist', mn: 'Аюулгүй байдал ба жолоодлогын туслах систем' },
  comfort: { en: 'Comfort & Multimedia', mn: 'Тав тух ба мультимедиа' },
  seats: { en: 'Seats & Interior', mn: 'Суудал ба салон' },
  drivetrain: { en: 'Drivetrain', mn: 'Хөдөлгүүр, хайрцаг' },
}

const OPTIONS = {
  '001': { cat: 'exterior', en: 'Sunroof', mn: 'Люктэй' },
  '002': { cat: 'exterior', en: 'Panoramic Sunroof', mn: 'Панорам шилэн люк' },
  '004': { cat: 'comfort', en: 'Steering Wheel Controls', mn: 'Жолооны хүрдэн дээрх удирдлагын товчлуурууд' },
  '005': { cat: 'safety', en: 'Rear-view Camera', mn: 'Хойд харах камер' },
  '006': { cat: 'safety', en: 'Rear Parking Sensor', mn: 'Арын зогсоолын мэдрэгч' },
  '007': { cat: 'safety', en: 'Front Parking Sensor', mn: 'Урд зогсоолын мэдрэгч' },
  '008': { cat: 'comfort', en: 'Navigation', mn: 'Навигацийн систем' },
  '014': { cat: 'safety', en: 'Cruise Control', mn: 'Хурд тогтворжуулагч (Cruise Control)' },
  '015': { cat: 'safety', en: 'Auto Parking', mn: 'Автомат зогсоолын систем' },
  '017': { cat: 'exterior', en: 'LED Headlamps', mn: 'LED урд их гэрэл' },
  '018': { cat: 'exterior', en: 'HID Headlamps', mn: 'HID урд их гэрэл' },
  '019': { cat: 'seats', en: 'Heated Seats', mn: 'Халаалттай суудал' },
  '020': { cat: 'seats', en: 'Ventilated Seats', mn: 'Агааржуулалттай суудал' },
  '021': { cat: 'seats', en: 'Memory Seats', mn: 'Санамжтай суудал' },
  '022': { cat: 'seats', en: 'Power Seats', mn: 'Цахилгаан тохируулгатай суудал' },
  '023': { cat: 'seats', en: 'Leather Seats', mn: 'Арьсан бүрээстэй суудал' },
  '024': { cat: 'safety', en: 'Driver Airbag', mn: 'Жолоочийн аюулгүйн дэр' },
  '025': { cat: 'safety', en: 'Passenger Airbag', mn: 'Зорчигчийн аюулгүйн дэр' },
  '026': { cat: 'safety', en: 'Side Airbags', mn: 'Хажуугийн аюулгүйн дэр' },
  '027': { cat: 'safety', en: 'Curtain Airbags', mn: 'Хөшиг хэлбэрийн аюулгүйн дэр' },
  '030': { cat: 'safety', en: 'ABS', mn: 'ABS тоормосны систем' },
  '031': { cat: 'safety', en: 'Traction Control', mn: 'Хальтиргаа гулгаанаас хамгаалах систем' },
  '032': { cat: 'safety', en: 'Stability Control', mn: 'Машины тогтворжуулах систем' },
  '033': { cat: 'safety', en: 'Lane Departure Warning', mn: 'Эгнээ алдалтын анхааруулах систем' },
  '034': { cat: 'safety', en: 'Around View Monitor', mn: '360° орчны камер' },
  '035': { cat: 'safety', en: 'Blind Spot Monitor', mn: 'Сохор цэг хяналтын систем' },
  '040': { cat: 'comfort', en: 'Auto Climate Control', mn: 'Автомат климат контрол' },
  '055': { cat: 'exterior', en: 'Auto-folding Mirrors', mn: 'Автоматаар эвхэгддэг хажуу толь' },
  '056': { cat: 'comfort', en: 'Climate Control', mn: 'Цаг агаарын хяналт' },
  '057': { cat: 'comfort', en: 'Smart Key', mn: 'Ухаалаг түлхүүр (Smart Key)' },
  '058': { cat: 'exterior', en: 'LED Tail Lamps', mn: 'LED арын гэрэл' },
  '059': { cat: 'exterior', en: 'Daytime Running Lights', mn: 'Өдрийн гэрэл (DRL)' },
  '063': { cat: 'comfort', en: 'Head-Up Display', mn: 'Шилэн дээрх мэдээллийн дэлгэц (HUD)' },
  '068': { cat: 'comfort', en: 'Bluetooth', mn: 'Bluetooth холболт' },
  '071': { cat: 'comfort', en: 'Powered Trunk', mn: 'Цахилгаан тэвш' },
  '072': { cat: 'exterior', en: 'Panoramic Sunroof', mn: 'Панорам шилэн люк' },
  '074': { cat: 'exterior', en: 'Power-folding Mirrors', mn: 'Цахилгаан тохируулгатай, эвхэгддэг хажуу толь' },
  '075': { cat: 'comfort', en: 'Wireless Charging', mn: 'Утасгүй цэнэглэгч' },
  '077': { cat: 'comfort', en: 'Full Auto AC', mn: 'Бүрэн автомат агааржуулагч' },
  '081': { cat: 'comfort', en: 'Dual-zone Climate', mn: 'Хос бүсийн агааржуулалт' },
  '082': { cat: 'comfort', en: 'Digital Clock', mn: 'Дижитал цаг' },
  '084': { cat: 'seats', en: 'Heated Steering Wheel', mn: 'Халаалттай жолоо' },
  '085': { cat: 'comfort', en: 'USB Port', mn: 'USB залгуур' },
  '086': { cat: 'comfort', en: 'AUX Input', mn: 'AUX залгуур' },
  '094': { cat: 'safety', en: 'Smart Cruise Control', mn: 'Ухаалаг хурд тогтворжуулагч' },
  '096': { cat: 'safety', en: 'Lane Keep Assist', mn: 'Эгнээнд барих туслах систем' },
  '097': { cat: 'safety', en: 'Driving Assist', mn: 'Жолоодлогын туслах ухаалаг систем' },
  '1017': { cat: 'safety', en: 'Advanced Parking Sensor', mn: 'Дэвшилтэт зогсоолын мэдрэгч' },
}

function expand(options = {}, lang = 'en') {
  const standard = options.standard || []
  const choice = options.choice || []
  const all = [...standard, ...choice]
  const buckets = { exterior: [], safety: [], comfort: [], seats: [], drivetrain: [] }
  const unknown = []
  for (const code of all) {
    const def = OPTIONS[code]
    if (!def) { unknown.push(code); continue }
    const label = def[lang] || def.en
    buckets[def.cat].push({ code, label })
  }
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
