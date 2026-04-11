import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCarFull, fetchExchangeRate, fetchFeeSettings, fetchEncarInfo, getImageUrl } from '../lib/api'
import { formatNumber, fuelLabel } from '../lib/utils'
import ReservationModal from '../components/cars/ReservationModal'
import type { ExchangeRate, FeeSettings } from '../types'

const TRANSPORT_OPTIONS = [1200, 1400, 1600, 1800, 2500]

export default function CarDetail() {
  const { id } = useParams<{ id: string }>()
  const [selectedImg, setSelectedImg] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [transportFeeUsd, setTransportFeeUsd] = useState(1200)
  const [copied, setCopied] = useState(false)

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => fetchCarFull(id!),
    enabled: !!id,
  })
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })
  const { data: fees } = useQuery({ queryKey: ['feeSettings'], queryFn: fetchFeeSettings })
  const { data: encarInfo } = useQuery({
    queryKey: ['encarInfo', car?.encar_id],
    queryFn: () => fetchEncarInfo(car!.encar_id),
    enabled: !!car?.encar_id,
  })
  const cc = encarInfo?.cc ?? null
  // encar.com-ын бодит үнэ (만원 нэгж)
  const encarPrice = encarInfo?.price ?? null

  const imgs = car?.images?.length ? car.images : car?.image ? [car.image] : []

  const prevImg = useCallback(() => {
    setSelectedImg((prev) => (prev > 0 ? prev - 1 : imgs.length - 1))
  }, [imgs.length])

  const nextImg = useCallback(() => {
    setSelectedImg((prev) => (prev < imgs.length - 1 ? prev + 1 : 0))
  }, [imgs.length])

  if (isLoading) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="aspect-[16/9] skeleton rounded-xl" />
              <div className="flex gap-2 mt-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-20 h-14 skeleton rounded-lg" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-28 skeleton rounded-xl" />
              <div className="h-64 skeleton rounded-xl" />
              <div className="h-12 skeleton rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!car) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <p className="text-[26px] font-semibold text-gray-700 mb-1">Машин олдсонгүй</p>
          <p className="text-[18px] text-gray-400 mb-4">Энэ машин устгагдсан эсвэл зарагдсан байж магадгүй</p>
          <Link to="/cars" className="inline-flex items-center gap-2 bg-dark text-white text-[18px] font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
            Бүх машин руу буцах
          </Link>
        </div>
      </main>
    )
  }

  // Price calculations — encar бодит үнэ + CC + он ашиглана
  const priceInfo = calcPrice(car.price, car.currency, rates, fees, car.original_price_krw, encarPrice, cc, car.year, car.fuelType, transportFeeUsd)
  const specs: [string, string | undefined][] = [
    ['Брэнд', car.brand],
    ['Загвар', car.model],
    ['Он', String(car.year)],
    ['Гүйлт', car.mileage ? `${formatNumber(car.mileage)} км` : undefined],
    ['Хөдөлгүүр', cc ? `${formatNumber(cc)} cc` : undefined],
    ['Түлш', fuelLabel(car.fuelType)],
    ['Хурдны хайрцаг', car.transmission === 'Auto' ? 'Автомат' : car.transmission === 'Manual' ? 'Механик' : car.transmission],
    ['Өнгө', car.color],
    ['Төрөл', car.body_type],
    ['Байршил', 'Korea'],
  ]
  const filteredSpecs = specs.filter(([, v]) => v) as [string, string][]

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-[16px] text-gray-400">
            <Link to="/" className="hover:text-dark transition">Нүүр</Link>
            <span>/</span>
            <Link to="/cars" className="hover:text-dark transition">Бүх машин</Link>
            {car.brand && (
              <>
                <span>/</span>
                <Link to={`/cars?brand=${car.brand}`} className="hover:text-dark transition">{car.brand}</Link>
              </>
            )}
            {car.model && (
              <>
                <span>/</span>
                <span className="text-gray-600 truncate max-w-[200px]">{car.model}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== LEFT: Images + Specs ===== */}
          <div className="lg:col-span-8">
            {/* Main image */}
            <div className="relative bg-black rounded-xl overflow-hidden">
              {imgs.length > 0 ? (
                <div className="aspect-[16/9] relative">
                  <img
                    src={getImageUrl(imgs[selectedImg])}
                    alt={car.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}

              {/* Counter badge */}
              {imgs.length > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[14px] font-medium px-3 py-1.5 rounded-full">
                  {selectedImg + 1} / {imgs.length}
                </div>
              )}

              {/* Navigation arrows */}
              {imgs.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {imgs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === selectedImg
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* ===== Specs table ===== */}
            <div className="bg-white rounded-xl border border-gray-200 mt-6 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                <h3 className="text-[24px] font-bold text-dark">Техникийн үзүүлэлт</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {filteredSpecs.map(([label, value], i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-6 py-3.5 ${
                      i < filteredSpecs.length - (filteredSpecs.length % 2 === 0 ? 2 : 1) ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <span className="text-[18px] font-medium text-blue-600">{label}</span>
                    <span className="text-[18px] font-semibold text-dark">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT: Price + Fees + CTA ===== */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[76px] space-y-4">
              {/* Title card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h1 className="text-[28px] font-bold text-dark leading-snug">{car.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[16px]">
                  <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{car.year}он</span>
                  {car.mileage > 0 && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{formatNumber(car.mileage)} км</span>}
                  <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{fuelLabel(car.fuelType)}</span>
                  {car.transmission && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{car.transmission === 'Auto' ? 'Автомат' : car.transmission}</span>}
                  {cc && <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{formatNumber(cc)} cc</span>}
                </div>
              </div>

              {/* Price card */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* MNT total */}
                {priceInfo.mntCarPrice && (
                  <div className="px-5 py-4 bg-primary/5 border-b border-gray-100">
                    <p className="text-[14px] text-gray-500 uppercase tracking-wider font-medium mb-1">Машины үнэ</p>
                    <p className="text-[30px] font-extrabold text-primary">{priceInfo.krwFull}</p>
                    <p className="text-[20px] font-semibold text-gray-500 mt-0.5">{priceInfo.mntCarPrice}</p>
                  </div>
                )}

                {/* Fee breakdown */}
                <div className="p-5 space-y-3">
                  <p className="text-[14px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Зардлын задаргаа</p>

                  {fees && rates && (
                    <>
                      <FeeRow label="Солонгос дахь зардал" amountKrw={fees.serviceFee} wonToMnt={rates.wonToMnt} />

                      {/* Тээврийн зардал — сонголттой */}
                      <div>
                        <div className="flex justify-between text-[18px] mb-2">
                          <span className="text-blue-600">Тээврийн зардал</span>
                        </div>
                        <div className="bg-gray-100 rounded-lg px-3 py-2 mb-2">
                          <p className="text-[13px] text-gray-500">Машины овор хэмжээнээс хамааран тээврийн зардал өөрчлөгдөхийг анхаарна уу</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {TRANSPORT_OPTIONS.map((opt) => {
                            const mnt = Math.round(opt * rates.usdToMnt)
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setTransportFeeUsd(opt)}
                                className={`px-3 py-1.5 text-[16px] font-medium rounded-lg border transition-all ${
                                  transportFeeUsd === opt
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                }`}
                              >
                                {formatNumber(mnt)}₮
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <FeeRow label="Онцгой албан татвар" amountMnt={priceInfo.specialTaxMnt} />
                      <FeeRow label="Гаалийн татвар (15.5%)" amountMnt={priceInfo.customsDutyMnt} />

                      <div className="border-t border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-[20px] font-bold text-dark">Нийт гаалийн зардал</span>
                          <span className="text-[20px] font-extrabold text-dark">{formatNumber(priceInfo.totalCustomsMnt)}₮</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="text-[22px] font-bold text-primary">Бүгд нийт</span>
                          <span className="text-[22px] font-extrabold text-primary">{priceInfo.mntGrandTotal}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Encar link */}
              {/* CTA buttons */}
              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl text-[22px] font-bold transition-colors shadow-lg shadow-primary/20"
              >
                Захиалга өгөх
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+97677220707"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-dark py-3.5 rounded-xl text-[18px] font-semibold hover:bg-gray-50 transition"
                >
                  <span className="text-[18px]">🇲🇳</span>
                  7722-0707
                </a>
                <a
                  href="tel:+97672105633"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-dark py-3.5 rounded-xl text-[18px] font-semibold hover:bg-gray-50 transition"
                >
                  <span className="text-[18px]">🇰🇷</span>
                  7210-5633
                </a>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[18px] font-semibold transition-all duration-300 ${
                  copied
                    ? 'bg-green-500 text-white border border-green-500'
                    : 'bg-white border border-gray-200 text-dark hover:bg-gray-50'
                }`}
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
                    Хуулагдлаа!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    Холбоос хуулах
                  </>
                )}
              </button>

              {/* Info card */}
              <div className="bg-blue-50 rounded-xl p-4 text-[16px] text-blue-700 leading-relaxed">
                <p className="font-semibold mb-1">Мэдээлэл</p>
                <p>Үнэ нь ханшийн өөрчлөлтөөс хамааран өөрчлөгдөж болно. Дэлгэрэнгүй мэдээллийг утсаар авна уу.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <ReservationModal carId={car.id} carTitle={car.title} onClose={() => setShowModal(false)} />}
    </main>
  )
}

/* ===== Fee row component ===== */
function FeeRow({ label, amountKrw, amountMnt, wonToMnt }: { label: string; amountKrw?: number; amountMnt?: number; wonToMnt?: number }) {
  const mnt = amountMnt ?? (amountKrw && wonToMnt ? Math.round(amountKrw * wonToMnt) : 0)
  return (
    <div className="flex justify-between text-[18px]">
      <span className="text-blue-600">{label}</span>
      <span className="font-medium">{formatNumber(mnt)}₮</span>
    </div>
  )
}

/* ===== Онцгой албан татварын хүснэгтүүд ===== */

// Ердийн машин (Gasoline, Diesel)
const TAX_TABLE_NORMAL: { maxCc: number; rates: number[] }[] = [
  { maxCc: 1500, rates: [750000, 1600000, 3350000, 10000000] },
  { maxCc: 2500, rates: [2300000, 3200000, 5000000, 11700000] },
  { maxCc: 3500, rates: [3050000, 4000000, 6700000, 13350000] },
  { maxCc: 4500, rates: [6850750, 8000000, 10850000, 17500000] },
  { maxCc: Infinity, rates: [14210000, 27200000, 39150000, 65975000] },
]

// Цахилгаан машин (Electric) — CC-ээс хамаарахгүй, зөвхөн он
const TAX_TABLE_ELECTRIC: number[] = [375000, 800000, 1675000, 5000000]

// Хос тэжээлт (Hybrid) + LPG
const TAX_TABLE_HYBRID: { maxCc: number; rates: number[] }[] = [
  { maxCc: 1500, rates: [375000, 800000, 1675000, 5000000] },
  { maxCc: 2500, rates: [1150000, 1600000, 2500000, 5850000] },
  { maxCc: 3500, rates: [1525000, 2000000, 3350000, 6675000] },
  { maxCc: 4500, rates: [3425000, 4000000, 5425000, 8750000] },
  { maxCc: Infinity, rates: [7105000, 13600000, 19575000, 32987500] },
]

function getAgeIndex(carYear: number): number {
  const age = new Date().getFullYear() - carYear
  if (age <= 3) return 0
  if (age <= 6) return 1
  if (age <= 9) return 2
  return 3
}

function getSpecialTax(ccValue: number | null, carYear: number, fuelType?: string): number {
  const ageIdx = getAgeIndex(carYear)
  const fuel = (fuelType || '').toLowerCase()

  // Цахилгаан машин — CC хамаарахгүй
  if (fuel === 'electric' || fuel === 'ev') {
    return TAX_TABLE_ELECTRIC[ageIdx]
  }

  // Хос тэжээлт / LPG
  if (fuel === 'hybrid' || fuel === 'lpg' || fuel.includes('hybrid') || fuel.includes('lpg')) {
    if (!ccValue || ccValue <= 0) return TAX_TABLE_HYBRID[0].rates[ageIdx]
    const row = TAX_TABLE_HYBRID.find((r) => ccValue <= r.maxCc)!
    return row.rates[ageIdx]
  }

  // Ердийн машин (Gasoline, Diesel)
  if (!ccValue || ccValue <= 0) return 0
  const row = TAX_TABLE_NORMAL.find((r) => ccValue <= r.maxCc)!
  return row.rates[ageIdx]
}

/* ===== Price calculation helper ===== */
function calcPrice(
  price: number,
  currency: string,
  rates?: ExchangeRate,
  fees?: FeeSettings,
  originalPriceKrw?: number,
  encarPrice?: number | null,
  ccValue?: number | null,
  carYear?: number,
  fuelType?: string,
  transportFeeUsd: number = 1200
) {
  let priceKrw: number
  let manwon: number

  if (encarPrice && encarPrice > 0) {
    manwon = encarPrice
    priceKrw = manwon * 10000
  } else if (originalPriceKrw && originalPriceKrw > 0) {
    priceKrw = originalPriceKrw
    manwon = Math.round(priceKrw / 10000)
  } else if (currency === 'EUR' && rates) {
    priceKrw = Math.round(price * rates.euroToMnt / rates.wonToMnt)
    manwon = Math.round(priceKrw / 10000)
  } else {
    manwon = Math.round(price)
    priceKrw = manwon * 10000
  }

  const krwFull = `${formatNumber(priceKrw)}₩`

  // MNT: машины үнэ
  let mntCarPrice: string | null = null
  let carPriceMnt = 0
  if (rates) {
    carPriceMnt = Math.round(priceKrw * rates.wonToMnt)
    mntCarPrice = `${carPriceMnt.toLocaleString('mn-MN')}₮`
  }

  // Шимтгэл MNT
  const serviceMnt = fees && rates ? Math.round(fees.serviceFee * rates.wonToMnt) : 0
  // Тээврийн зардал: USD × usdToMnt
  const transportMnt = rates ? Math.round(transportFeeUsd * rates.usdToMnt) : 0

  // Онцгой албан татвар (CC + он -оос хамаарна)
  const specialTaxMnt = getSpecialTax(ccValue ?? null, carYear ?? 2024, fuelType)

  // Гаалийн татвар бодох:
  // 1. (Машины үнэ + Тээвэр) * USD ханш → ₮ (хэрэв KRW бол KRW→USD→MNT)
  // Энд бид шууд MNT-ээр бодно: carPriceMnt + transportMnt
  const baseMnt = carPriceMnt + transportMnt
  // 2. (baseMnt + specialTax) * 15.5%
  const customsDutyMnt = Math.round((baseMnt + specialTaxMnt) * 15.5 / 100)
  // Нийт гаалийн зардал
  const totalCustomsMnt = specialTaxMnt + customsDutyMnt

  // Бүгд нийт = машины үнэ + шимтгэл + тээвэр + гаалийн зардал
  const grandTotalMnt = carPriceMnt + serviceMnt + transportMnt + totalCustomsMnt
  const mntGrandTotal = rates ? `${grandTotalMnt.toLocaleString('mn-MN')}₮` : null

  return {
    priceKrw,
    manwon,
    krwFull,
    mntCarPrice,
    specialTaxMnt,
    customsDutyMnt,
    totalCustomsMnt,
    mntGrandTotal,
  }
}
