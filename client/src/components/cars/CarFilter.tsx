import { useQuery } from '@tanstack/react-query'
import { fetchCars, fetchExchangeRate } from '../../lib/api'
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
const COLORS = [
  { value: 'white', label: 'Цагаан' },
  { value: 'black', label: 'Хар' },
  { value: 'gray', label: 'Саарал' },
  { value: 'silver', label: 'Мөнгөлөг' },
  { value: 'red', label: 'Улаан' },
  { value: 'blue', label: 'Цэнхэр' },
  { value: 'yellow', label: 'Шар' },
  { value: 'green', label: 'Ногоон' },
  { value: 'brown', label: 'Хүрэн' },
  { value: 'purple', label: 'Ягаан' },
  { value: 'orange', label: 'Улбар шар' },
  { value: 'gold', label: 'Алтлаг' },
  { value: 'beige', label: 'Цөөвөр' },
]
const BODY_TYPES = [
  { value: 'sedan', label: 'Седан' },
  { value: 'suv', label: 'SUV' },
  { value: 'hatchback', label: 'Хетчбэк' },
  { value: 'coupe', label: 'Купе' },
  { value: 'convertible', label: 'Кабриолет' },
  { value: 'wagon', label: 'Вагон' },
  { value: 'pickup', label: 'Пикап' },
  { value: 'van', label: 'Вэн' },
  { value: 'minivan', label: 'Минивэн' },
  { value: 'crossover', label: 'Кроссовер' },
  { value: 'truck', label: 'Ачааны' },
]

interface Props {
  filters: CarFilters
  onFilterChange: (f: Partial<CarFilters>) => void
  availableBrands?: string[]
  availableModels?: string[]
}

export default function CarFilter({ filters, onFilterChange, availableBrands, availableModels }: Props) {
  const { data: modelData } = useQuery({
    queryKey: ['brandModels', filters.brand],
    queryFn: () => fetchCars({ brand: filters.brand, limit: 500 }),
    enabled: !!filters.brand,
  })
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  const models = modelData?.cars
    ? [...new Set(modelData.cars.map((c) => c.model).filter(Boolean))].sort()
    : []

  // MNT (сая ₮) ↔ USD conversion. Backend нь min_price/max_price-ыг USD-аар хүлээж байна.
  const usdPerMillionMnt = rates ? 1_000_000 / rates.usdToMnt : 0
  const mntMillionToUsd = (m: number | undefined) => (m && usdPerMillionMnt ? Math.round(m * usdPerMillionMnt) : undefined)
  const usdToMntMillion = (u: number | undefined) => (u && usdPerMillionMnt ? Math.round(u / usdPerMillionMnt) : '')

  const selectClass = 'w-full text-[18px] text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-gray-400 transition'
  const inputClass = 'w-full text-[18px] text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-gray-400 transition placeholder-gray-400'

  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Хайх</label>
        <input
          type="text"
          placeholder="Брэнд, загвар, хувилбар"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value || undefined })}
          className={inputClass}
        />
      </div>

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

      {/* Model */}
      {(availableModels || (filters.brand && models.length > 0)) && (
        <div>
          <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Загвар</label>
          <select
            value={filters.model || ''}
            onChange={(e) => onFilterChange({ model: e.target.value })}
            className={selectClass}
          >
            <option value="">Бүгд</option>
            {(availableModels || models).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Body type */}
      {!availableModels && (
        <div>
          <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Кузов</label>
          <select
            value={filters.body_type || ''}
            onChange={(e) => onFilterChange({ body_type: e.target.value || undefined })}
            className={selectClass}
          >
            <option value="">Бүгд</option>
            {BODY_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      )}

      {/* Year range */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Он</label>
        <div className="flex gap-2">
          <select
            value={filters.yearFrom || ''}
            onChange={(e) => onFilterChange({ yearFrom: e.target.value ? Number(e.target.value) : undefined })}
            className={selectClass}
          >
            <option value="">Эхлэл</option>
            {Array.from({ length: 2026 - 2010 + 1 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-gray-300 self-center">—</span>
          <select
            value={filters.yearTo || ''}
            onChange={(e) => onFilterChange({ yearTo: e.target.value ? Number(e.target.value) : undefined })}
            className={selectClass}
          >
            <option value="">Төгсгөл</option>
            {Array.from({ length: 2026 - 2010 + 1 }, (_, i) => 2026 - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Price range (MNT сая → USD backend) */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Үнэ (сая ₮)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Доод"
            value={usdToMntMillion(filters.priceFrom)}
            onChange={(e) => onFilterChange({ priceFrom: e.target.value ? mntMillionToUsd(Number(e.target.value)) : undefined })}
            className={inputClass}
          />
          <span className="text-gray-300 self-center">—</span>
          <input
            type="number"
            placeholder="Дээд"
            value={usdToMntMillion(filters.priceTo)}
            onChange={(e) => onFilterChange({ priceTo: e.target.value ? mntMillionToUsd(Number(e.target.value)) : undefined })}
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

      {/* Color */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Өнгө</label>
        <select
          value={filters.color || ''}
          onChange={(e) => onFilterChange({ color: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">Бүгд</option>
          {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Mileage range */}
      <div>
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Гүйлт (км)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Доод"
            value={filters.minMileage || ''}
            onChange={(e) => onFilterChange({ minMileage: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
          <span className="text-gray-300 self-center">—</span>
          <input
            type="number"
            placeholder="Дээд"
            value={filters.maxMileage || ''}
            onChange={(e) => onFilterChange({ maxMileage: e.target.value ? Number(e.target.value) : undefined })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Quality checkboxes */}
      <div className="space-y-2.5">
        <label className="block text-[14px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Шалгуур</label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.hasAccident === false}
            onChange={(e) => onFilterChange({ hasAccident: e.target.checked ? false : undefined })}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[18px] text-gray-600 group-hover:text-dark transition">Зөвхөн осолгүй</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.inspectionPassed === true}
            onChange={(e) => onFilterChange({ inspectionPassed: e.target.checked ? true : undefined })}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[18px] text-gray-600 group-hover:text-dark transition">Үзлэг хийгдсэн</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.isNewVehicle === true}
            onChange={(e) => onFilterChange({ isNewVehicle: e.target.checked ? true : undefined })}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[18px] text-gray-600 group-hover:text-dark transition">Зөвхөн шинэ машин</span>
        </label>
      </div>

      {/* Reset */}
      <button
        onClick={() =>
          onFilterChange({
            search: undefined,
            brand: undefined,
            model: undefined,
            body_type: undefined,
            yearFrom: undefined,
            yearTo: undefined,
            priceFrom: undefined,
            priceTo: undefined,
            fuelType: undefined,
            transmission: undefined,
            color: undefined,
            minMileage: undefined,
            maxMileage: undefined,
            hasAccident: undefined,
            inspectionPassed: undefined,
            isNewVehicle: undefined,
          })
        }
        className="w-full text-[16px] font-medium text-gray-500 hover:text-primary underline underline-offset-2 transition py-1"
      >
        Шүүлтүүр цэвэрлэх
      </button>
    </div>
  )
}
