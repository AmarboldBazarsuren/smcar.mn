import type { Car, ExchangeRate } from '../../types'
import CarCard from './CarCard'

interface CarGridProps {
  cars: Car[]
  loading: boolean
  rates?: ExchangeRate
}

export default function CarGrid({ cars, loading, rates }: CarGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-[16/10] skeleton" />
            <div className="p-3.5 space-y-2.5">
              <div className="h-4 skeleton w-4/5" />
              <div className="h-3 skeleton w-3/5" />
              <div className="border-t border-gray-100 pt-2.5 mt-2.5">
                <div className="h-5 skeleton w-2/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (cars.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <p className="text-[22px] font-medium text-gray-600">Машин олдсонгүй</p>
        <p className="text-[18px] text-gray-400 mt-1">Шүүлтээ өөрчилж дахин хайна уу</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cars.map((car) => (
        <CarCard key={car.id} car={car} rates={rates} />
      ))}
    </div>
  )
}
