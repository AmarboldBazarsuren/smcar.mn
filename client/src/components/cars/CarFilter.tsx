import { useQuery } from '@tanstack/react-query'
import { fetchCars } from '../../lib/api'
import type { CarFilters } from '../../types'

const BRANDS = [
  'Kia', 'Genesis', 'Porsche', 'Jeep', 'Lexus', 'Honda', 'Bentley',
  'Lamborghini', 'McLaren', 'Mazda', 'Hyundai', 'Chevrolet', 'Mini',
  'Volkswagen', 'Toyota', 'Cadillac', 'Infiniti', 'Aston Martin',
  'Mercedes-Benz', 'Renault', 'Land Rover', 'Ford', 'Lincoln', 'Peugeot',
  'Nissan', 'Suzuki', 'BMW', 'Audi', 'Volvo', 'Tesla', 'Maserati',
  'Jaguar', 'Rolls-Royce', 'GMC', 'BYD', 'Fiat',
]
const FUEL_TYPES = [
  { value: 'Gasoline', label: 'Бензин' },
  { value: 'Diesel', label: 'Дизель' },
  { value: 'Electric', label: 'Цахилгаан' },
  { value: 'Hybrid', label: 'Хайбрид' },
]

interface Props {
  filters: CarFilters
  onFilterChange: (f: Partial<CarFilters>) => void
  availableBrands?: string[]
}

export default function CarFilter({ filters, onFilterChange, availableBrands }: Props) {
  // Брэнд сонгогдсон бол тухайн брэндийн загваруудыг авах
  const { data: modelData } = useQuery({
    queryKey: ['brandModels', filters.brand],
    queryFn: () => fetchCars({ brand: filters.brand, limit: 500 }),
    enabled: !!filters.brand,
  })

  const models = modelData?.cars
    ? [...new Set(modelData.cars.map((c) => c.model).filter(Boolean))].sort()
    : []

  const selectClass = "w-full text-[18px] text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-gray-400 transition"
  const inputClass = "w-full text-[18px] text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-gray-400 transition placeholder-gray-400"

  return (
    <div className="space-y-5">
      {/* Brand */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Брэнд</label>
        <select
          value={filters.brand || ''}
          onChange={(e) => onFilterChange({ brand: e.target.value, model: undefined })}
          className={selectClass}
        >
          <option value="">Бүгд</option>
          {(availableBrands || BRANDS).map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Model (dynamic based on brand) */}
      {filters.brand && models.length > 0 && (
        <div>
          <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Загвар</label>
          <select
            value={filters.model || ''}
            onChange={(e) => onFilterChange({ model: e.target.value })}
            className={selectClass}
          >
            <option value="">Бүгд</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Year range */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Он</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Эхлэл"
            value={filters.yearFrom || ''}
            onChange={(e) => onFilterChange({ yearFrom: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
          <span className="text-gray-300 self-center">—</span>
          <input
            type="number"
            placeholder="Төгсгөл"
            value={filters.yearTo || ''}
            onChange={(e) => onFilterChange({ yearTo: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Price range (MNT) */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Үнэ (сая ₮)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Доод"
            value={filters.priceFrom || ''}
            onChange={(e) => onFilterChange({ priceFrom: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
          <span className="text-gray-300 self-center">—</span>
          <input
            type="number"
            placeholder="Дээд"
            value={filters.priceTo || ''}
            onChange={(e) => onFilterChange({ priceTo: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
        <p className="text-[14px] text-gray-400 mt-1">Жишээ: 50 = 50 сая ₮</p>
      </div>

      {/* Fuel type */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Түлш</label>
        <div className="space-y-1.5">
          {FUEL_TYPES.map((f) => (
            <label key={f.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="fuelType"
                checked={filters.fuelType === f.value}
                onChange={() => onFilterChange({ fuelType: filters.fuelType === f.value ? '' : f.value })}
                className="w-3.5 h-3.5 accent-primary"
              />
              <span className="text-[18px] text-gray-600 group-hover:text-dark transition">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Хурдны хайрцаг</label>
        <div className="flex gap-2">
          {['Auto', 'Manual'].map((t) => (
            <button
              key={t}
              onClick={() => onFilterChange({ transmission: filters.transmission === t ? '' : t })}
              className={`flex-1 py-2 text-[16px] font-medium rounded-lg border transition ${
                filters.transmission === t
                  ? 'bg-dark text-white border-dark'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t === 'Auto' ? 'Автомат' : 'Механик'}
            </button>
          ))}
        </div>
      </div>

      {/* Mileage */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Макс гүйлт</label>
        <input
          type="number"
          placeholder="км"
          value={filters.maxMileage || ''}
          onChange={(e) => onFilterChange({ maxMileage: e.target.value ? Number(e.target.value) : undefined })}
          className={inputClass}
        />
      </div>

      {/* Reset */}
      <button
        onClick={() =>
          onFilterChange({
            brand: undefined,
            model: undefined,
            yearFrom: undefined,
            yearTo: undefined,
            priceFrom: undefined,
            priceTo: undefined,
            fuelType: undefined,
            transmission: undefined,
            maxMileage: undefined,
          })
        }
        className="w-full text-[16px] font-medium text-gray-500 hover:text-primary underline underline-offset-2 transition py-1"
      >
        Шүүлтүүр цэвэрлэх
      </button>
    </div>
  )
}
