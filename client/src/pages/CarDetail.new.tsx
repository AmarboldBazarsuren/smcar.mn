import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCarFull, fetchExchangeRate, getImageUrl } from '../lib/api'
import { formatNumber } from '../lib/utils'
import ReservationModal from '../components/cars/ReservationModal'

interface OptionGroup {
  key: string
  title: string
  items: { code: string; label: string }[]
}

export default function CarDetailNew() {
  const { id } = useParams<{ id: string }>()
  const [selectedImg, setSelectedImg] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const { data: car, isLoading } = useQuery<any>({
    queryKey: ['car', id],
    queryFn: () => fetchCarFull(id!),
    enabled: !!id,
  })
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  const imgs: string[] = car?.images?.length ? car.images : car?.image ? [car.image] : []
  const prevImg = useCallback(() => setSelectedImg((p) => (p > 0 ? p - 1 : imgs.length - 1)), [imgs.length])
  const nextImg = useCallback(() => setSelectedImg((p) => (p < imgs.length - 1 ? p + 1 : 0)), [imgs.length])

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

  const priceKrw = Number(car.price || car.original_price_krw || 0)
  const priceUsd = rates?.usdToMnt && rates?.wonToMnt
    ? Math.round((priceKrw * rates.wonToMnt) / rates.usdToMnt)
    : null
  const priceMnt = rates?.wonToMnt ? Math.round(priceKrw * rates.wonToMnt) : null
  const optionsGroups: OptionGroup[] = (car.options && car.options.groups) || []
  const optionsMnGroups: OptionGroup[] = (car.options_mn && car.options_mn.groups) || []

  return (
    <main className="bg-white min-h-screen text-gray-900">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-gray-500 mb-4">
          <Link to="/" className="hover:text-red-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/cars" className="hover:text-red-600">Vehicles</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{car.brand} {car.model}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ===== LEFT: Photo grid + details ===== */}
          <div className="lg:col-span-8 space-y-6">
            {/* Photo gallery: 1 big + 2x2 thumbs + "+N more" */}
            <PhotoMosaic
              imgs={imgs}
              onImageClick={(i) => setSelectedImg(i)}
            />

            {/* Title + Price block */}
            <div>
              <h1 className="text-[28px] md:text-[34px] font-extrabold leading-tight">
                {car.brand} {car.model} {car.year ? `(${car.year})` : ''}
              </h1>
              <p className="text-gray-500 mt-1 text-[15px]">
                {[car.brand, car.model, car.grade, car.trim].filter(Boolean).join(' · ')}
              </p>

              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mt-5">
                <span className="text-[34px] font-extrabold text-gray-900">
                  ₩{(priceKrw / 1_000_000).toFixed(1)}M
                </span>
                {priceUsd != null && (
                  <span className="text-[15px] text-gray-500">~${formatNumber(priceUsd)}</span>
                )}
                {priceMnt != null && (
                  <span className="text-[15px] text-gray-500">~{formatNumber(priceMnt)}₮</span>
                )}
                <span className="ml-auto inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[12px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-500 mt-3">
                <span>Source: <span className="text-gray-700 font-medium">Encar</span></span>
                {car.encar_id && <span>· ID: <span className="text-gray-700 font-mono">{car.encar_id}</span></span>}
                {car.scraped_at && <span>· Updated {timeAgo(car.scraped_at)}</span>}
              </div>
            </div>

            {/* Spec grid */}
            <SpecGrid car={car} />

            {/* Status tags */}
            <div className="flex flex-wrap gap-2">
              {car.diagnosis && (
                <Tag tone="green">⚲ Inspection passed</Tag>
              )}
              {car.pre_verified && (
                <Tag tone="blue">✔ Pre-verified</Tag>
              )}
              {car.extend_warranty && (
                <Tag tone="purple">⛨ Extended warranty</Tag>
              )}
              {!car.diagnosis && (
                <Tag tone="amber">⚠ Inspection pending</Tag>
              )}
            </div>

            {/* VIN */}
            {car.vin && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-1">VIN</p>
                <p className="text-[15px] font-mono text-gray-800">{car.vin}</p>
              </div>
            )}

            {/* Description / one-liner */}
            {car.one_line && (
              <div>
                <h2 className="text-[20px] font-bold mb-3">Description</h2>
                <p className="text-[15px] text-gray-700 leading-relaxed">{car.one_line}</p>
              </div>
            )}

            {/* Equipment grid */}
            {optionsGroups.length > 0 && (
              <div>
                <h2 className="text-[20px] font-bold mb-4">Equipment & Features</h2>
                <div className="space-y-4">
                  {optionsGroups.map((group, gi) => {
                    const mnGroup = optionsMnGroups[gi]
                    return (
                      <div key={group.key} className="bg-white border border-gray-200 rounded-2xl p-5">
                        <h3 className="text-[15px] font-bold text-gray-900 mb-3">
                          {group.title}
                          {mnGroup && mnGroup.title !== group.title && (
                            <span className="ml-2 text-[13px] font-normal text-gray-400">/ {mnGroup.title}</span>
                          )}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                          {group.items.map((item, ii) => (
                            <div key={item.code} className="flex items-center gap-2 text-[14px]">
                              <span className="text-green-600 font-bold">✓</span>
                              <span className="text-gray-700">
                                {item.label}
                                {mnGroup && mnGroup.items[ii] && mnGroup.items[ii].label !== item.label && (
                                  <span className="text-gray-400 text-[12px] ml-1">/ {mnGroup.items[ii].label}</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ===== RIGHT: Sticky action panel ===== */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Order CTA */}
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
                <p className="text-[12px] uppercase tracking-wider text-red-200 mb-1">Total price</p>
                <p className="text-[32px] font-extrabold">
                  ₩{(priceKrw / 1_000_000).toFixed(1)}M
                </p>
                {priceMnt != null && (
                  <p className="text-[14px] text-red-100/90 mt-1">
                    ≈ {formatNumber(priceMnt)}₮
                  </p>
                )}
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-5 w-full bg-white hover:bg-red-50 text-red-700 text-[15px] font-bold py-3 rounded-full transition"
                >
                  Reserve this car
                </button>
                <a
                  href="tel:+97672105633"
                  className="mt-2 block w-full text-center bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[14px] font-medium py-3 rounded-full transition"
                >
                  Call us: 7210-5633
                </a>
              </div>

              {/* Quick facts */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-gray-500 mb-3">At a glance</h3>
                <dl className="space-y-2.5 text-[14px]">
                  <Row k="Year" v={car.year} />
                  <Row k="Mileage" v={car.mileage ? `${formatNumber(car.mileage)} km` : '—'} />
                  <Row k="Fuel" v={car.fuelType || car.fuel_type || '—'} />
                  <Row k="Transmission" v={car.transmission || '—'} />
                  <Row k="Color" v={car.color || '—'} />
                  <Row k="Body" v={car.body_type || '—'} />
                </dl>
              </div>

              <Link
                to="/cars"
                className="block text-center text-[14px] text-gray-500 hover:text-red-600 py-2"
              >
                ← Back to all listings
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox-like full image preview */}
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
        <img
          src={getImageUrl(main)}
          alt=""
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          loading="eager"
        />
      </button>
      <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2">
        {grid.map((img, i) => {
          const idx = i + 1
          const isLast = i === grid.length - 1 && extra > 0
          return (
            <button
              key={img}
              onClick={() => onImageClick(idx)}
              className="relative aspect-[5/4] overflow-hidden rounded-xl bg-gray-100 group"
            >
              <img
                src={getImageUrl(img)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform"
                loading="lazy"
              />
              {isLast && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-[18px]">
                  +{extra}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SpecGrid({ car }: { car: any }) {
  const items = [
    { icon: '📅', label: 'Year', value: car.year || '—' },
    { icon: '🛣', label: 'Mileage', value: car.mileage ? `${formatNumber(car.mileage)} km` : '—' },
    { icon: '⚡', label: 'Engine', value: car.displacement ? `${formatNumber(car.displacement)} cc` : '—' },
    { icon: '⛽', label: 'Fuel Type', value: car.fuelType || car.fuel_type || '—' },
    { icon: '⚙', label: 'Transmission', value: car.transmission || '—' },
    { icon: '🚗', label: 'Body Type', value: car.body_type || '—' },
    { icon: '🎨', label: 'Color', value: car.color || '—' },
    { icon: '💺', label: 'Seats', value: car.seat_count || '—' },
    { icon: '🏷', label: 'Trim', value: car.trim || car.grade || '—' },
    { icon: '📍', label: 'Region', value: car.location || '—' },
    { icon: '👤', label: 'Seller', value: car.dealer_type === 'DEALER' ? 'Dealer' : car.dealer_type || '—' },
    { icon: '✅', label: 'Availability', value: car.advertisement_status === 'ADVERTISE' ? 'Available' : car.advertisement_status || '—', tone: 'green' as const },
  ]
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-gray-500 mb-1">
              <span>{it.icon}</span>{it.label}
            </div>
            <div className={`text-[15px] font-semibold ${it.tone === 'green' ? 'text-green-600' : 'text-gray-900'}`}>
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-500">{k}</dt>
      <dd className="text-gray-900 font-medium text-right">{v ?? '—'}</dd>
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

function FullImagePreview({ imgs, index, onClose, onPrev, onNext, visible }: {
  imgs: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; visible: boolean
}) {
  if (!visible || index < 0) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
      >‹</button>
      <img
        src={getImageUrl(imgs[index])}
        className="max-w-[95vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        alt=""
      />
      <button
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
      >›</button>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-[28px]"
      >×</button>
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-[13px]">
        {index + 1} / {imgs.length}
      </p>
    </div>
  )
}

function timeAgo(iso?: string): string {
  if (!iso) return 'recently'
  const d = new Date(iso)
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} days ago`
  return d.toLocaleDateString()
}
