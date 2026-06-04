import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchManualCars } from '../lib/api'
import { formatNumber, fuelLabel } from '../lib/utils'
import ReservationModal from '../components/cars/ReservationModal'

export default function ManualCarDetail() {
  const { id } = useParams<{ id: string }>()
  const [selectedImg, setSelectedImg] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const { data: cars, isLoading } = useQuery({
    queryKey: ['manualCars'],
    queryFn: fetchManualCars,
  })

  const car = cars?.find((c: any) => c._id === id)
  const imgs: string[] = car?.images || []

  if (isLoading) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8"><div className="aspect-[16/9] skeleton rounded-xl" /></div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-28 skeleton rounded-xl" />
              <div className="h-48 skeleton rounded-xl" />
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
          <p className="text-[26px] font-semibold text-gray-700 mb-1">Машин олдсонгүй</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-dark text-white text-[18px] font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition mt-4">
            Нүүр руу буцах
          </Link>
        </div>
      </main>
    )
  }

  const specs: [string, string | undefined][] = [
    ['Брэнд', car.brand],
    ['Загвар', car.model],
    ['Он', String(car.year)],
    ['Гүйлт', car.mileage ? `${formatNumber(car.mileage)} км` : undefined],
    ['Хөдөлгүүр', car.cc ? `${formatNumber(car.cc)} cc` : undefined],
    ['Түлш', fuelLabel(car.fuelType)],
    ['Хурдны хайрцаг', car.transmission === 'Auto' ? 'Автомат' : car.transmission === 'Manual' ? 'Механик' : car.transmission],
    ['Өнгө', car.color],
    ['Төрөл', car.body_type],
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
            <span className="text-gray-600 truncate max-w-[200px]">{car.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Images + Specs */}
          <div className="lg:col-span-8">
            {/* Main image */}
            <div className="relative bg-black rounded-xl overflow-hidden">
              {imgs.length > 0 ? (
                <div className="aspect-[16/9] relative">
                  <img src={imgs[selectedImg]} alt={car.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-400">Зураг байхгүй</p>
                </div>
              )}
              {imgs.length > 1 && (
                <>
                  <button onClick={() => setSelectedImg(selectedImg > 0 ? selectedImg - 1 : imgs.length - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button onClick={() => setSelectedImg(selectedImg < imgs.length - 1 ? selectedImg + 1 : 0)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              )}
              {imgs.length > 0 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[14px] font-medium px-3 py-1.5 rounded-full">
                  {selectedImg + 1} / {imgs.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {imgs.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {imgs.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-90'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Specs */}
            <div className="bg-white rounded-xl border border-gray-200 mt-6 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-[24px] font-bold text-dark">Техникийн үзүүлэлт</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {filteredSpecs.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50">
                    <span className="text-[18px] text-gray-400">{label}</span>
                    <span className="text-[18px] font-semibold text-dark">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {car.description && (
              <div className="bg-white rounded-xl border border-gray-200 mt-4 p-6">
                <h3 className="text-[24px] font-bold text-dark mb-3">Тайлбар</h3>
                <p className="text-[18px] text-gray-600 leading-relaxed whitespace-pre-wrap">{car.description}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Price + CTA */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-[76px] space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h1 className="text-[28px] font-bold text-dark leading-snug">{car.title}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[16px] text-gray-400">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-full">{car.year}он</span>
                  {car.mileage > 0 && <span className="bg-gray-100 px-2.5 py-1 rounded-full">{formatNumber(car.mileage)} км</span>}
                  <span className="bg-gray-100 px-2.5 py-1 rounded-full">{fuelLabel(car.fuelType)}</span>
                  {car.cc && <span className="bg-gray-100 px-2.5 py-1 rounded-full">{formatNumber(car.cc)} cc</span>}
                </div>
              </div>

              {/* Price — шууд MNT, татваргүй */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-5 bg-primary/5">
                  <p className="text-[14px] text-gray-500 uppercase tracking-wider font-medium mb-1">Нийт үнэ</p>
                  <p className="text-[34px] font-extrabold text-primary">
                    {formatNumber(car.price)}₮
                  </p>
                </div>
              </div>

              <button onClick={() => setShowModal(true)}
                className="w-full bg-primary hover:bg-red-700 text-white py-4 rounded-xl text-[22px] font-bold transition-colors shadow-lg shadow-primary/20">
                Захиалга өгөх
              </button>

              <a href="tel:+821056576492"
                className="flex items-center justify-center gap-2.5 w-full bg-white border border-gray-200 text-dark py-3.5 rounded-xl text-[20px] font-semibold hover:bg-gray-50 transition">
                <span className="text-[20px]">🇰🇷</span>
                010-5657-6492
              </a>
            </div>
          </div>
        </div>
      </div>

      {showModal && <ReservationModal carId={car._id} carTitle={car.title} onClose={() => setShowModal(false)} />}
    </main>
  )
}
