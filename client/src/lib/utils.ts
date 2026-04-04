// KRW price нь 만원 нэгжтэй (жишээ: 2440 = 2440만원 = 24,400,000₩)
// Бүтэн KRW руу хөрвүүлээд MNT руу шилжүүлнэ

export function toMnt(
  price: number,
  currency: 'EUR' | 'KRW' | string,
  rates: { euroToMnt: number; wonToMnt: number }
): string {
  let mnt: number
  if (currency === 'EUR') {
    mnt = Math.round(price * rates.euroToMnt)
  } else {
    // KRW — price нь 만원 нэгж, ×10000 хийж бүтэн ₩ болгоно
    mnt = Math.round(price * 10000 * rates.wonToMnt)
  }
  return mnt.toLocaleString('mn-MN') + '₮'
}

// Тоог форматлах
export function formatNumber(num: number): string {
  return num.toLocaleString('mn-MN')
}

// className нэгтгэх
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Түлшний төрлийг монголоор харуулах
const FUEL_MAP: Record<string, string> = {
  'Gasoline': 'Бензин',
  'Diesel': 'Дизель',
  'Electric': 'Цахилгаан',
  'Hybrid': 'Хайбрид',
  'LPG': 'Газ',
  'Gas': 'Газ',
}

export function fuelLabel(fuel: string): string {
  return FUEL_MAP[fuel] || fuel
}
