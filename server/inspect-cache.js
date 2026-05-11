const j = JSON.parse(require('fs').readFileSync('.cache/encar-cache.json', 'utf8'))
const keys = Object.keys(j)
console.log('total entries:', keys.length)
console.log('list endpoints:', keys.filter((k) => k.includes('car/list')).length)
console.log('vehicle endpoints:', keys.filter((k) => k.includes('readside/vehicle')).length)
console.log('\nsample list keys (first 5):')
for (const k of keys.filter((k) => k.includes('car/list')).slice(0, 5)) {
  console.log(' ', k.substring(0, 160))
}
