import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCars, fetchExchangeRate } from '../lib/api'
import CarGrid from '../components/cars/CarGrid'
import CarFilter from '../components/cars/CarFilter'
import type { CarFilters } from '../types'
import { formatNumber } from '../lib/utils'

export default function CarList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFilter, setMobileFilter] = useState(false)

  const filters: CarFilters = {
    brand: searchParams.get('brand') || undefined,
    model: searchParams.get('model') || undefined,
    yearFrom: searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined,
    yearTo: searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined,
    priceFrom: searchParams.get('priceFrom') ? Number(searchParams.get('priceFrom')) : undefined,
    priceTo: searchParams.get('priceTo') ? Number(searchParams.get('priceTo')) : undefined,
    fuelType: searchParams.get('fuelType') || undefined,
    transmission: searchParams.get('transmission') || undefined,
    maxMileage: searchParams.get('maxMileage') ? Number(searchParams.get('maxMileage')) : undefined,
    body_type: searchParams.get('body_type') || undefined,
    sortBy: (searchParams.get('sortBy') as CarFilters['sortBy']) || 'scraped_at',
    sortOrder: (searchParams.get('sortOrder') as CarFilters['sortOrder']) || 'desc',
    page: Number(searchParams.get('page')) || 1,
    limit: 16,
  }

  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  // MNT (сая) → 만원 хөрвүүлж API руу илгээх
  const apiFilters = { ...filters }
  if (rates && rates.wonToMnt > 0) {
    // priceFrom/priceTo нь сая ₮ нэгжтэй → 만원 руу хөрвүүлнэ
    // сая₮ → ₮ → ₩ → 만원: value * 1,000,000 / wonToMnt / 10000
    if (filters.priceFrom) {
      apiFilters.priceFrom = Math.floor(filters.priceFrom * 1000000 / rates.wonToMnt / 10000)
    }
    if (filters.priceTo) {
      apiFilters.priceTo = Math.ceil(filters.priceTo * 1000000 / rates.wonToMnt / 10000)
    }
  }

  // Тусгай ангилал: API type filter дэмждэггүй тул client-side шүүнэ
  const vehicleType = searchParams.get('vehicleType') || undefined
  const isVehicleTypeFilter = !!vehicleType

  // Тусгай ангилал бол brand/бусад шүүлтгүйгээр бүгдийг авна, client-side дээр шүүнэ
  const vehicleTypeApiFilters = isVehicleTypeFilter
    ? { sortBy: apiFilters.sortBy, sortOrder: apiFilters.sortOrder, limit: 1000 }
    : apiFilters

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['cars', vehicleTypeApiFilters, vehicleType],
    queryFn: () => fetchCars(vehicleTypeApiFilters as any),
  })

  // encar 화물•특장•버스 ангилал
  const SPECIAL_TYPES = ['Minivan', '화물차']
  const SPECIAL_KEYWORDS = ['porter', 'bongo', 'county', 'mighty', 'starex', 'staria', 'solati', 'master', 'cargo', 'bus', 'truck', 'dump', 'crane', 'tractor', 'trailer', 'camper', 'wing']

  const isSpecialCar = (c: { type?: string; title?: string }) => {
    if (SPECIAL_TYPES.includes(c.type || '')) return true
    const t = c.title?.toLowerCase() || ''
    return SPECIAL_KEYWORDS.some((kw) => t.includes(kw))
  }

  // Бүх тусгай машинуудаас брэнд жагсаалт (brand шүүлтээс хамааралгүй)
  const allSpecialCars = isVehicleTypeFilter && rawData?.cars
    ? rawData.cars.filter(isSpecialCar)
    : []

  const specialBrands = isVehicleTypeFilter
    ? [...new Set(allSpecialCars.map((c) => c.brand).filter(Boolean))].sort()
    : undefined

  // Тусгай ангилал дээр brand + бусад шүүлтийг client-side хийнэ
  const data = isVehicleTypeFilter && rawData
    ? (() => {
        let filtered = allSpecialCars
        if (filters.brand) filtered = filtered.filter((c) => c.brand === filters.brand)
        if (filters.model) filtered = filtered.filter((c) => c.model === filters.model)
        if (filters.fuelType) filtered = filtered.filter((c) => c.fuelType === filters.fuelType)
        if (filters.transmission) filtered = filtered.filter((c) => c.transmission === filters.transmission)
        if (filters.yearFrom) filtered = filtered.filter((c) => c.year >= filters.yearFrom!)
        if (filters.yearTo) filtered = filtered.filter((c) => c.year <= filters.yearTo!)
        if (filters.maxMileage) filtered = filtered.filter((c) => c.mileage <= filters.maxMileage!)
        return { ...rawData, cars: filtered, total: filtered.length, totalPages: 1 }
      })()
    : rawData

  const handleFilterChange = (newFilters: Partial<CarFilters>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
      else params.delete(key)
    })
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCount = [filters.brand, filters.model, filters.fuelType, filters.transmission, filters.yearFrom, filters.yearTo, filters.priceFrom, filters.priceTo, filters.maxMileage].filter(Boolean).length

  return (
    <main className="bg-white min-h-screen">
      {/* Breadcrumb + controls */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[16px] text-gray-400 mb-3">
            <Link to="/" className="hover:text-dark transition">Нүүр</Link>
            <span>/</span>
            <span className="text-dark font-medium">Бүх машин</span>
            {filters.brand && (
              <>
                <span>/</span>
                <span className="text-dark font-medium">{filters.brand}</span>
              </>
            )}
            {filters.model && (
              <>
                <span>/</span>
                <span className="text-dark font-medium">{filters.model}</span>
              </>
            )}
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[30px] font-bold text-dark">
                {vehicleType === 'special' ? 'Тусгай ангилалын машин' : filters.brand ? `${filters.brand}${filters.model ? ` ${filters.model}` : ''}` : 'Бүх машин'}
              </h1>
              <p className="text-[18px] text-gray-500 mt-0.5">
                {data ? `${formatNumber(data.total)} үр дүн` : 'Хайж байна...'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Sort */}
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_')
                  handleFilterChange({ sortBy: sortBy as CarFilters['sortBy'], sortOrder: sortOrder as CarFilters['sortOrder'] })
                }}
                className="hidden sm:block text-[18px] text-gray-600 border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-gray-400"
              >
                <option value="scraped_at_desc">Шинэ нэмэгдсэн</option>
                <option value="price_asc">Үнэ: Бага → Их</option>
                <option value="price_desc">Үнэ: Их → Бага</option>
                <option value="year_desc">Он: Шинэ</option>
                <option value="mileage_asc">Гүйлт: Бага</option>
              </select>

              {/* Mobile filter button */}
              <button
                onClick={() => setMobileFilter(true)}
                className="lg:hidden flex items-center gap-1.5 text-[18px] font-medium border border-gray-200 rounded-lg px-3 py-2 bg-white"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /></svg>
                Шүүх
                {activeCount > 0 && (
                  <span className="w-4.5 h-4.5 bg-primary text-white text-[14px] rounded-full flex items-center justify-center">{activeCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[240px] shrink-0">
            <div className="sticky top-[76px]">
              <CarFilter filters={filters} onFilterChange={handleFilterChange} availableBrands={specialBrands} />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {mobileFilter && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilter(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-[300px] bg-white overflow-y-auto p-4 shadow-xl fade-in">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[22px] font-bold">Шүүлтүүр</span>
                  <button onClick={() => setMobileFilter(false)} className="p-1 text-gray-400 hover:text-dark">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
                <CarFilter filters={filters} onFilterChange={handleFilterChange} availableBrands={specialBrands} />
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <CarGrid cars={data?.cars ?? []} loading={isLoading} rates={rates} />

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 disabled:opacity-30 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                {Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
                  const cur = filters.page ?? 1
                  let page: number
                  if (data.totalPages <= 7) page = i + 1
                  else if (cur <= 4) page = i + 1
                  else if (cur >= data.totalPages - 3) page = data.totalPages - 6 + i
                  else page = cur - 3 + i
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-9 h-9 rounded-lg text-[18px] font-medium transition ${
                        page === cur
                          ? 'bg-dark text-white'
                          : 'border border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  disabled={(filters.page ?? 1) >= data.totalPages}
                  onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 disabled:opacity-30 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
