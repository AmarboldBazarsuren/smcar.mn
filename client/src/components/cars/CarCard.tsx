import { Link } from 'react-router-dom'
import type { Car, ExchangeRate } from '../../types'
import { toMnt, formatNumber, fuelLabel } from '../../lib/utils'
import { getImageUrl } from '../../lib/api'

interface CarCardProps {
  car: Car
  rates?: ExchangeRate
}

export default function CarCard({ car, rates }: CarCardProps) {
  return (
    <Link
      to={`/cars/${car.encar_id || car.id}`}
      className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative bg-gray-50 aspect-[16/10] overflow-hidden">
        <img
          src={getImageUrl(car.image)}
          alt={car.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {car.fuelType === 'Electric' && (
            <span className="bg-green-600 text-white text-[14px] font-bold px-2 py-0.5 rounded">EV</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="text-[20px] font-semibold text-dark leading-snug line-clamp-2 min-h-[40px]">
          {car.title}
        </h3>

        {/* Specs row */}
        <div className="flex items-center gap-1.5 mt-2 text-[14px] text-gray-400 flex-wrap">
          <span>{car.year}년</span>
          <span className="text-gray-300">|</span>
          <span>{formatNumber(car.mileage)}km</span>
          <span className="text-gray-300">|</span>
          <span>{fuelLabel(car.fuelType)}</span>
          <span className="text-gray-300">|</span>
          <span>{car.transmission}</span>
        </div>

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {rates ? (
            <>
              <p className="text-[24px] font-extrabold text-dark">
                {toMnt(car.price, car.currency, rates)}
              </p>
              <p className="text-[14px] text-gray-400 mt-0.5">
                {formatNumber(car.price)} {car.currency}
              </p>
            </>
          ) : (
            <p className="text-[24px] font-extrabold text-dark">
              {formatNumber(car.price)} {car.currency}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
