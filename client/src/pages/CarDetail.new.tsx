import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCarFull,
  fetchExchangeRate,
  fetchFeeSettings,
  getImageUrl,
} from '../lib/api'
import { formatNumber } from '../lib/utils'
import ReservationModal from '../components/cars/ReservationModal'
import type { ExchangeRate, FeeSettings } from '../types'

const TRANSPORT_OPTIONS = [1200, 1400, 1600, 1800, 2500]

interface OptionGroup {
  key: string
  title: string
  items: { code: string; label: string }[]
}

export default function CarDetailNew() {
  const { id } = useParams<{ id: string }>()
  const [selectedImg, setSelectedImg] = useState(-1)
  const [showModal, setShowModal] = useState(false)
  const [transportFeeUsd, setTransportFeeUsd] = useState(1200)

  const { data: car, isLoading } = useQuery<any>({
    queryKey: ['car', id],
    queryFn: () => fetchCarFull(id!),
    enabled: !!id,
  })

  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })
  const { data: fees } = useQuery({ queryKey: ['feeSettings'], queryFn: fetchFeeSettings })
  // CC + canonical price come from the active data source (Carapis) — no
  // longer fetched from a separate Encar helper.
  const cc = car?.displacement ?? null

  const imgs: string[] = car?.images?.length ? car.images : car?.image ? [car.image] : []
  const prevImg = useCallback(() => setSelectedImg((p) => (p > 0 ? p - 1 : imgs.length - 1)), [imgs.length])
  const nextImg = useCallback(() => setSelectedImg((p) => (p < imgs.length - 1 ? p + 1 : 0)), [imgs.length])

  // Preload all photos in the background so the lightbox advances instantly.
  // Browser keeps them in its HTTP cache for the disk-cached lifetime.
  useEffect(() => {
    if (!imgs.length) return
    const preloads: HTMLImageElement[] = []
    imgs.forEach((src, idx) => {
      // Stagger to avoid hammering the proxy all at once
      setTimeout(() => {
        const img = new Image()
        img.src = getImageUrl(src)
        preloads.push(img)
      }, idx * 120)
    })
    return () => { preloads.length = 0 }
  }, [imgs])

  if (isLoading) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              <div className="aspect-[16/10] skeleton rounded-2xl" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-video skeleton rounded-xl" />)}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-3">
              <div className="h-24 skeleton rounded-2xl" />
              <div className="h-72 skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!car) {
    return (
      <main className="bg-white min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-500">Vehicle not found</p>
          <Link to="/cars" className="inline-block mt-4 text-red-600 hover:underline">← Back to listings</Link>
        </div>
      </main>
    )
  }

  // Prefer Mongolian options; fall back to English when not available.
  const optionsGroups: OptionGroup[] = (car.options_mn && car.options_mn.groups) || (car.options && car.options.groups) || []

  const priceInfo = calcPrice(
    Number(car.price || car.original_price_krw || 0),
    car.currency || 'KRW',
    rates,
    fees,
    Number(car.original_price_krw || 0),
    null,
    cc,
    car.year,
    car.fuelType || car.fuel_type,
    transportFeeUsd
  )

  return (
    <main className="bg-white min-h-screen text-gray-900">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-gray-500 mb-4">
          <Link to="/" className="hover:text-red-600">Нүүр</Link>
          <span className="mx-2">/</span>
          <Link to="/cars" className="hover:text-red-600">Машинууд</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{car.brand} {car.model}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== LEFT: Photo grid + details ===== */}
          <div className="lg:col-span-8 space-y-6">
            <PhotoMosaic imgs={imgs} onImageClick={(i) => setSelectedImg(i)} />

            {/* Title block */}
            <div>
              <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight">
                {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
              </h1>
              <p className="text-gray-500 mt-1 text-[15px]">
                {[car.brand, car.model, car.grade, car.trim].filter(Boolean).join(' · ')}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500 mt-3">
                {car.scraped_at && <span>Шинэчлэгдсэн: {timeAgoMn(car.scraped_at)}</span>}
                <span className="ml-auto inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Идэвхтэй
                </span>
              </div>
            </div>

            <SpecGrid car={car} cc={cc} />

            <div className="flex flex-wrap gap-2">
              {car.diagnosis && <Tag tone="green">✓ Үзлэг хийгдсэн</Tag>}
              {car.pre_verified && <Tag tone="blue">✓ Урьдчилан баталгаажсан</Tag>}
              {car.extend_warranty && <Tag tone="purple">✓ Сунгасан баталгаа</Tag>}
            </div>

            {car.vin && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-1">VIN</p>
                <p className="text-[15px] font-mono text-gray-800">{car.vin}</p>
              </div>
            )}


            {optionsGroups.length > 0 && (
              <div>
                <h2 className="text-[20px] font-bold mb-4">Тоноглол ба хэрэгсэл</h2>
                <div className="space-y-4">
                  {optionsGroups.map((group) => (
                    <div key={group.key} className="bg-white border border-gray-200 rounded-2xl p-5">
                      <h3 className="text-[15px] font-bold text-gray-900 mb-3">{group.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                        {group.items.map((item) => (
                          <div key={item.code} className="flex items-start gap-2 text-[14px]">
                            <span className="text-green-600 font-bold mt-0.5">✓</span>
                            <span className="text-gray-700">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT: Price + Fee Breakdown ===== */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Price card */}
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {priceInfo.mntCarPrice && (
                  <div className="px-5 py-4 bg-red-50 border-b border-red-100">
                    <p className="text-[12px] text-gray-500 uppercase tracking-wider font-medium mb-1">Машины үнэ</p>
                    <p className="text-[28px] font-extrabold text-red-600">{priceInfo.krwFull}</p>
                    <p className="text-[18px] font-semibold text-gray-500 mt-0.5">{priceInfo.mntCarPrice}</p>
                  </div>
                )}

                {fees && rates && (
                  <div className="p-5 space-y-3">
                    <p className="text-[12px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Зардлын задаргаа</p>

                    <FeeRow label="Солонгос дахь зардал" amountKrw={fees.serviceFee} wonToMnt={rates.wonToMnt} />

                    {/* Transport fee selector */}
                    <div>
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-gray-700 text-[14px] font-medium">Тээврийн зардал</span>
                      </div>
                      <p className="text-[12px] text-gray-500 mb-2 leading-snug">
                        Машины овор хэмжээнээс хамааран өөрчлөгдөнө
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {TRANSPORT_OPTIONS.map((opt) => {
                          const mnt = Math.round(opt * rates.usdToMnt)
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setTransportFeeUsd(opt)}
                              className={`px-2.5 py-1.5 text-[13px] font-medium rounded-lg border transition-all ${
                                transportFeeUsd === opt
                                  ? 'bg-red-600 text-white border-red-600'
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
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[15px] font-bold text-gray-800">Нийт гаалийн зардал</span>
                        <span className="text-[16px] font-extrabold text-gray-900">{formatNumber(priceInfo.totalCustomsMnt)}₮</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-[18px] font-bold text-red-600">Бүгд нийт</span>
                        <span className="text-[20px] font-extrabold text-red-600">{priceInfo.mntGrandTotal}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl text-[18px] font-bold transition shadow-lg shadow-red-900/20"
              >
                Захиалга өгөх
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+97677220707"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 py-3 rounded-2xl text-[14px] font-semibold hover:bg-gray-50 transition"
                >
                  🇲🇳 7722-0707
                </a>
                <a
                  href="tel:+97672105633"
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-800 py-3 rounded-2xl text-[14px] font-semibold hover:bg-gray-50 transition"
                >
                  🇰🇷 7210-5633
                </a>
              </div>

              {/* listing_url comes from the backend's Encar enrichment.
                  When the match misses (~5-15% of listings) we hide the
                  button rather than guess at a search URL. */}
              {car.listing_url && (
              <a
                href={car.listing_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-red-600 border-2 border-red-600 text-white hover:bg-red-500 py-3 rounded-2xl text-[14px] font-semibold transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                encar.com дээр харах
              </a>
              )}

              <div className="bg-red-50 rounded-2xl p-4 text-[13px] text-red-700 leading-relaxed">
                <p className="font-semibold mb-1">Мэдээлэл</p>
                <p>Үнэ нь ханшийн өөрчлөлтөөс хамааран өөрчлөгдөж болно. Дэлгэрэнгүй мэдээллийг утсаар авна уу.</p>
              </div>

              <Link
                to="/cars"
                className="block text-center text-[13px] text-gray-500 hover:text-red-600 py-2"
              >
                ← Бүх машинуудруу буцах
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {imgs.length > 0 && (
        <FullImagePreview
          imgs={imgs}
          index={selectedImg}
          onClose={() => setSelectedImg(-1)}
          onPrev={prevImg}
          onNext={nextImg}
          visible={selectedImg >= 0}
        />
      )}

      {showModal && (
        <ReservationModal
          carId={String(car.id || car.encar_id)}
          carTitle={car.title}
          onClose={() => setShowModal(false)}
        />
      )}
    </main>
  )
}

/* ===== Sub-components ===== */

function PhotoMosaic({ imgs, onImageClick }: { imgs: string[]; onImageClick: (i: number) => void }) {
  if (imgs.length === 0) {
    return <div className="aspect-[16/10] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">No photos</div>
  }
  const main = imgs[0]
  const grid = imgs.slice(1, 5)
  const extra = Math.max(0, imgs.length - 5)
  return (
    <div className="grid grid-cols-12 gap-2">
      <button
        onClick={() => onImageClick(0)}
        className="col-span-12 md:col-span-7 aspect-[16/11] overflow-hidden rounded-2xl bg-gray-100 group"
      >
        <img src={getImageUrl(main)} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" loading="eager" />
      </button>
      <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2">
        {grid.map((img, i) => {
          const idx = i + 1
          const isLast = i === grid.length - 1 && extra > 0
          return (
            <button key={img} onClick={() => onImageClick(idx)} className="relative aspect-[5/4] overflow-hidden rounded-xl bg-gray-100 group">
              <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform" loading="lazy" />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-[18px]">+{extra}</div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SpecGrid({ car, cc }: { car: any; cc: number | null }) {
  const dealerLabel = car.dealer_type === 'DEALER' ? 'Автомашины дилер' : car.dealer_type === 'PERSONAL' ? 'Хувь хүн' : car.dealer_type
  const status = car.status || car.advertisement_status
  const statusLabel = status === 'ADVERTISE' ? 'Бэлэн байгаа' : status
  // Only include fields with a real value — hide empty entries instead of "—".
  const items = [
    car.year && { icon: '📅', label: 'Үйлдвэрлэсэн он', value: car.year },
    car.mileage && { icon: '🛣', label: 'Явсан км', value: `${formatNumber(car.mileage)} км` },
    cc && { icon: '⚡', label: 'Хөдөлгүүрийн багтаамж', value: `${formatNumber(cc)} cc` },
    (car.fuel_mn || car.fuelType || car.fuel_type) && { icon: '⛽', label: 'Түлшний төрөл', value: car.fuel_mn || car.fuelType || car.fuel_type },
    (car.transmission_mn || car.transmission) && { icon: '⚙', label: 'Хурдны хайрцаг', value: car.transmission_mn || car.transmission },
    (car.body_type_mn || car.body_type) && { icon: '🚗', label: 'Кузов ангилал', value: car.body_type_mn || car.body_type },
    (car.color_mn || car.color) && { icon: '🎨', label: 'Өнгө', value: car.color_mn || car.color },
    car.seat_count && { icon: '💺', label: 'Суудлын тоо', value: car.seat_count },
    (car.trim || car.grade) && { icon: '🏷', label: 'Хувилбар', value: car.trim || car.grade },
    (car.location_mn || car.location) && { icon: '📍', label: 'Байршил', value: car.location_mn || car.location },
    dealerLabel && { icon: '👤', label: 'Худалдагч', value: dealerLabel },
    statusLabel && { icon: '✅', label: 'Борлуулалтын төлөв', value: statusLabel, tone: 'green' as const },
  ].filter(Boolean) as { icon: string; label: string; value: React.ReactNode; tone?: 'green' }[]
  if (items.length === 0) return null
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-gray-500 mb-1">
              <span>{it.icon}</span>{it.label}
            </div>
            <div className={`text-[14px] font-semibold ${it.tone === 'green' ? 'text-green-600' : 'text-gray-900'}`}>
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Tag({ tone, children }: { tone: 'green' | 'blue' | 'purple' | 'amber' | 'red'; children: React.ReactNode }) {
  const tones = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center gap-1.5 ${tones[tone]} px-3 py-1.5 rounded-full text-[13px] font-semibold`}>{children}</span>
}

function FeeRow({ label, amountKrw, amountMnt, wonToMnt }: { label: string; amountKrw?: number; amountMnt?: number; wonToMnt?: number }) {
  const mnt = amountMnt ?? (amountKrw && wonToMnt ? Math.round(amountKrw * wonToMnt) : 0)
  return (
    <div className="flex justify-between text-[14px]">
      <span className="text-gray-700">{label}</span>
      <span className="font-medium text-gray-900">{formatNumber(mnt)}₮</span>
    </div>
  )
}

function FullImagePreview({ imgs, index, onClose, onPrev, onNext, visible }: {
  imgs: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; visible: boolean
}) {
  if (!visible || index < 0) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); onPrev() }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">‹</button>
      <img src={getImageUrl(imgs[index])} className="max-w-[95vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} alt="" />
      <button onClick={(e) => { e.stopPropagation(); onNext() }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center">›</button>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white text-[28px]">×</button>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-[13px]">{index + 1} / {imgs.length}</p>
    </div>
  )
}

// Build a deep-ish link into encar.com's keyword search. We don't have
// the exact listing_id (Carapis hides it on free tier) but the brand +
// model + year combo narrows the result list down to a handful of cars
// the user can pick from visually.
function timeAgoMn(iso?: string): string {
  if (!iso) return 'саяхан'
  const d = new Date(iso)
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'дөнгөж сая'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} минутын өмнө`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} цагийн өмнө`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} өдрийн өмнө`
  return d.toLocaleDateString('mn-MN')
}

/* ===== Price calculation (ported from legacy CarDetail) ===== */

const TAX_TABLE_NORMAL: { maxCc: number; rates: number[] }[] = [
  { maxCc: 1500, rates: [750000, 1600000, 3350000, 10000000] },
  { maxCc: 2500, rates: [2300000, 3200000, 5000000, 11700000] },
  { maxCc: 3500, rates: [3050000, 4000000, 6700000, 13350000] },
  { maxCc: 4500, rates: [6850750, 8000000, 10850000, 17500000] },
  { maxCc: Infinity, rates: [14210000, 27200000, 39150000, 65975000] },
]
const TAX_TABLE_ELECTRIC: number[] = [375000, 800000, 1675000, 5000000]
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
  if (fuel === 'electric' || fuel === 'ev') return TAX_TABLE_ELECTRIC[ageIdx]
  if (fuel === 'hybrid' || fuel === 'lpg' || fuel.includes('hybrid') || fuel.includes('lpg')) {
    if (!ccValue || ccValue <= 0) return TAX_TABLE_HYBRID[0].rates[ageIdx]
    const row = TAX_TABLE_HYBRID.find((r) => ccValue <= r.maxCc)!
    return row.rates[ageIdx]
  }
  if (!ccValue || ccValue <= 0) return 0
  const row = TAX_TABLE_NORMAL.find((r) => ccValue <= r.maxCc)!
  return row.rates[ageIdx]
}

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
    // Both legacy apicars.info and our new Encar proxy return prices
    // in 万원 (10,000-KRW units), so the raw `price` is manwon.
    manwon = Math.round(price)
    priceKrw = manwon * 10000
  }
  const krwFull = `${formatNumber(priceKrw)}₩`
  let mntCarPrice: string | null = null
  let carPriceMnt = 0
  if (rates) {
    carPriceMnt = Math.round(priceKrw * rates.wonToMnt)
    mntCarPrice = `${carPriceMnt.toLocaleString('mn-MN')}₮`
  }
  const serviceMnt = fees && rates ? Math.round(fees.serviceFee * rates.wonToMnt) : 0
  const transportMnt = rates ? Math.round(transportFeeUsd * rates.usdToMnt) : 0
  const specialTaxMnt = getSpecialTax(ccValue ?? null, carYear ?? 2024, fuelType)
  const baseMnt = carPriceMnt + transportMnt
  const customsDutyMnt = Math.round((baseMnt + specialTaxMnt) * 15.5 / 100)
  const totalCustomsMnt = specialTaxMnt + customsDutyMnt
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
