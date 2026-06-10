const fs = require('fs')
const path = require('path')

// Encar-ийн солонгос загвар нэр → англи нэр. Хоёр давхар:
//  1) repo-той хамт ирдэг урьдчилан бэлдсэн толь (encarModelDict.json) —
//     scripts/build-model-dict.js-ээр offline үүсгэсэн. Production дээр
//     НЭМЭЛТ request явуулахгүйгээр ихэнх загварыг хөрвүүлнэ.
//  2) ажиллах үеийн overlay (.cache/model-dict.json) — detail хуудас үзэх
//     бүрт суралцаж урт сүүлийн загваруудыг аяндаа бөглөнө (нэмэлт
//     request-гүй, аль хэдийн татсан detail-аас).
const SEED_FILE = path.join(__dirname, '..', 'encarModelDict.json')
const OVERLAY_FILE = path.join(__dirname, '..', '.cache', 'model-dict.json')

const dict = new Map()
let n = 0
try {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'))
  for (const [k, v] of Object.entries(seed)) { if (v) { dict.set(k, v); n++ } }
} catch {}
try {
  const ov = JSON.parse(fs.readFileSync(OVERLAY_FILE, 'utf8'))
  for (const [k, v] of Object.entries(ov)) { if (v) dict.set(k, v) }
} catch {}
console.log(`[model dict] loaded ${dict.size} entries (${n} from seed)`)

let dirty = false
setInterval(() => {
  if (!dirty) return
  try {
    fs.mkdirSync(path.dirname(OVERLAY_FILE), { recursive: true })
    // Зөвхөн seed-д байхгүй (шинээр сурсан) entry-үүдийг overlay-д бичнэ.
    const seedKeys = (() => { try { return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8')) } catch { return {} } })()
    const ov = {}
    for (const [k, v] of dict.entries()) if (!seedKeys[k]) ov[k] = v
    fs.writeFileSync(OVERLAY_FILE, JSON.stringify(ov))
    dirty = false
  } catch (e) {
    console.warn('[model dict] overlay write fail:', e.message)
  }
}, 60000).unref()

function key(manuKo, modelKo) {
  return `${manuKo || ''}|${modelKo || ''}`
}

// Солонгос загвар нэрийг англиар буцаана; мэдэгдэхгүй бол null.
function translateModel(manuKo, modelKo) {
  if (!modelKo) return null
  return dict.get(key(manuKo, modelKo)) || null
}

// detail хуудаснаас сурах (нэмэлт request-гүй).
function learn(manuKo, modelKo, english) {
  if (!manuKo || !modelKo || !english) return
  if (!/[A-Za-z0-9]/.test(english)) return
  const k = key(manuKo, modelKo)
  if (dict.get(k) === english) return
  dict.set(k, english.trim())
  dirty = true
}

module.exports = { translateModel, learn }
