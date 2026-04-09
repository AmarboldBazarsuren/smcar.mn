import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { fetchCars, fetchExchangeRate, fetchBanners, fetchFeaturedCars, fetchCarFull, fetchManualCars, getImageUrl } from '../lib/api'
import { toMnt, formatNumber, fuelLabel } from '../lib/utils'
import type { Car, ExchangeRate } from '../types'

const BRANDS = [
  'Kia', 'Genesis', 'Porsche', 'Jeep', 'Lexus', 'Honda', 'Bentley',
  'Lamborghini', 'McLaren', 'Mazda', 'Hyundai', 'Chevrolet', 'Mini',
  'Volkswagen', 'Toyota', 'Cadillac', 'Infiniti', 'Aston Martin',
  'Mercedes-Benz', 'Renault', 'Land Rover', 'Ford', 'Lincoln', 'Peugeot',
  'Nissan', 'Suzuki', 'BMW', 'Audi', 'Volvo', 'Tesla', 'Maserati',
  'Jaguar', 'Rolls-Royce', 'GMC', 'BYD', 'Fiat',
]


export default function Home() {
  const [activeBrand, setActiveBrand] = useState('Kia')
  const [activeModel, setActiveModel] = useState<string | null>(null)

  // Бүх машинуудыг нэг удаа татах - brand солиход дахин fetch хийхгүй
  const { data: allCarsData, isLoading: allCarsLoading } = useQuery({
    queryKey: ['allCarsHome'],
    queryFn: () => fetchCars({ limit: 1000, sortBy: 'scraped_at', sortOrder: 'desc' }),
    staleTime: 10 * 60 * 1000,
  })

  // Сонгосон брэндийн загварууд - шууд memory-с авна, fetch хийхгүй
  const models = useMemo(() => {
    if (!allCarsData?.cars) return []
    return [...new Set(allCarsData.cars.filter((c) => c.brand === activeBrand).map((c) => c.model).filter(Boolean))].sort()
  }, [allCarsData, activeBrand])

  // Сонгосон брэнд + загварын машинууд (4 ширхэг)
  const brandCars = useMemo(() => {
    if (!allCarsData?.cars) return []
    let filtered = allCarsData.cars.filter((c) => c.brand === activeBrand)
    if (activeModel) filtered = filtered.filter((c) => c.model === activeModel)
    return filtered.slice(0, 4)
  }, [allCarsData, activeBrand, activeModel])

  const brandLoading = allCarsLoading

  // Сүүлийн нэмэгдсэн (4 ширхэг)
  const { data: latestCars } = useQuery({
    queryKey: ['latestCars'],
    queryFn: () => fetchCars({ sortBy: 'scraped_at', sortOrder: 'desc', limit: 4 }),
    staleTime: 10 * 60 * 1000,
  })

  // Онцлох зар (админаас тохируулсан)
  const { data: featuredList } = useQuery({
    queryKey: ['featuredCars'],
    queryFn: fetchFeaturedCars,
  })
  const heroFeaturedId = featuredList?.find((f) => f.position === 'hero')?.carId
  const middleFeaturedId = featuredList?.find((f) => f.position === 'middle')?.carId

  // Hero featured car data
  const { data: heroCarData } = useQuery({
    queryKey: ['car', heroFeaturedId],
    queryFn: () => fetchCarFull(heroFeaturedId!),
    enabled: !!heroFeaturedId,
  })

  // Middle featured car data
  const { data: middleCarData } = useQuery({
    queryKey: ['car', middleFeaturedId],
    queryFn: () => fetchCarFull(middleFeaturedId!),
    enabled: !!middleFeaturedId,
  })

  // Fallback featured (хамгийн үнэтэй машин)
  const { data: fallbackFeatured } = useQuery({
    queryKey: ['fallbackFeatured'],
    queryFn: () => fetchCars({ sortBy: 'price', sortOrder: 'desc', limit: 1 }),
    enabled: !heroFeaturedId,
  })

  const heroCar = heroCarData || fallbackFeatured?.cars?.[0]

  // Брэнд бүрийн машинууд (тусдаа query)
  const { data: mercedesData, isLoading: mercedesLoading } = useQuery({
    queryKey: ['featuredBrandCars', 'Mercedes'],
    queryFn: () => fetchCars({ brand: 'Mercedes', limit: 4, sortBy: 'scraped_at', sortOrder: 'desc' }),
    staleTime: 10 * 60 * 1000,
  })
  const { data: bmwData, isLoading: bmwLoading } = useQuery({
    queryKey: ['featuredBrandCars', 'BMW'],
    queryFn: () => fetchCars({ brand: 'BMW', limit: 4, sortBy: 'scraped_at', sortOrder: 'desc' }),
    staleTime: 10 * 60 * 1000,
  })
  const brandQueries = [
    { brand: 'Mercedes', data: mercedesData, isLoading: mercedesLoading },
    { brand: 'BMW', data: bmwData, isLoading: bmwLoading },
  ]

  // Гараар оруулсан машинууд
  const { data: manualCars } = useQuery({
    queryKey: ['manualCars'],
    queryFn: fetchManualCars,
    staleTime: 10 * 60 * 1000,
  })

  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })
  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: fetchBanners })

  const topBanners = banners?.filter((b) => b.position === 'home_top' && b.isActive) || []

  // Grid column count detection for dropdown row insertion
  const brandGridRef = useRef<HTMLDivElement>(null)
  const [gridCols, setGridCols] = useState(9)

  useEffect(() => {
    const el = brandGridRef.current
    if (!el) return
    const updateCols = () => {
      const c = getComputedStyle(el).gridTemplateColumns.split(' ').length
      setGridCols(c)
    }
    updateCols()
    window.addEventListener('resize', updateCols)
    return () => window.removeEventListener('resize', updateCols)
  }, [])

  const activeRowIdx = Math.floor(BRANDS.indexOf(activeBrand) / gridCols)

  const handleBrandClick = (brand: string) => {
    setActiveBrand(brand)
    setActiveModel(null)
  }

  return (
    <main className="bg-white">
      {/* ===== HERO: Featured car + brand tabs + models ===== */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
          <h1 className="text-[28px] font-bold text-dark mb-5">
            Солонгос улсаас автомашин захиалга
            <span className="inline-block bg-red-600 text-white text-[16px] font-bold px-3 py-1 rounded-lg ml-3 align-middle">Somang Trading</span>
          </h1>

          {/* Brand grid - brands stay in their rows, dropdown inserts between rows */}
          <div ref={brandGridRef} className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 gap-2 pb-4 mb-3 border-b border-gray-200">
            {BRANDS.map((brand, i) => (
              <Fragment key={brand}>
                <button
                  onClick={() => handleBrandClick(brand)}
                  className={`px-2 py-2 text-[15px] font-medium rounded-lg border transition-all text-center truncate ${
                    activeBrand === brand
                      ? 'bg-dark text-white border-dark'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {brand}
                </button>
                {/* Insert model dropdown after the last brand in the active row */}
                {models.length > 0 && Math.floor(i / gridCols) === activeRowIdx && (i + 1 === BRANDS.length || Math.floor((i + 1) / gridCols) !== activeRowIdx) && (
                  <div className="col-span-full flex flex-wrap items-center gap-1.5 py-2 px-2 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setActiveModel(null)}
                      className={`shrink-0 px-3 py-1.5 text-[13px] font-medium rounded-full border transition-all ${
                        !activeModel
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      Бүгд
                    </button>
                    {models.map((model) => (
                      <button
                        key={model}
                        onClick={() => setActiveModel(model)}
                        className={`shrink-0 px-3 py-1.5 text-[13px] font-medium rounded-full border transition-all ${
                          activeModel === model
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </Fragment>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Brand cars grid (2x2) */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                {brandLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <div className="aspect-[4/3] skeleton rounded-lg mb-3" />
                        <div className="h-4 skeleton w-3/4 mb-2" />
                        <div className="h-5 skeleton w-1/2" />
                      </div>
                    ))
                  : (brandCars || []).map((car) => (
                      <CompactCarCard key={car.id} car={car} rates={rates} />
                    ))}
              </div>
              <Link
                to={`/cars?brand=${activeBrand}${activeModel ? `&model=${activeModel}` : ''}`}
                className="inline-flex items-center gap-1 mt-4 text-[18px] font-semibold text-dark hover:text-primary transition"
              >
                {activeBrand} {activeModel || ''} бүх машин харах →
              </Link>
            </div>

            {/* Right: Featured car with image slideshow */}
            <div className="lg:col-span-5">
              {heroCar ? (
                <HeroFeaturedCard car={heroCar} rates={rates} />
              ) : (
                <div className="bg-gray-100 rounded-xl h-full min-h-[400px] skeleton" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BANNERS ===== */}
      {topBanners && topBanners.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topBanners.map((banner) => (
              <a key={banner._id} href={banner.linkUrl} className="block rounded-xl overflow-hidden hover:opacity-90 transition">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-44 object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ===== LATEST ARRIVALS (4 ширхэг) ===== */}
      <section className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[28px] font-bold text-dark">Сүүлд нэмэгдсэн</h2>
            <Link to="/cars?sortBy=scraped_at&sortOrder=desc" className="text-[18px] font-semibold text-gray-500 hover:text-dark transition">
              Бүгдийг харах →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(latestCars?.cars || []).map((car) => (
              <CompactCarCard key={car.id} car={car} rates={rates} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== MIDDLE FEATURED CAR (Админаас тохируулсан) ===== */}
      {middleCarData && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
            <MiddleFeaturedCard car={middleCarData} rates={rates} />
          </div>
        </section>
      )}

      {/* ===== FEATURED BRAND SECTIONS (Mercedes, BMW, Jeep - 4 ширхэг тус бүр) ===== */}
      {brandQueries.map(({ brand, data: bData, isLoading: bLoading }) => (
        <section key={brand} className="bg-white border-t border-gray-100">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[28px] font-bold text-dark">{brand}</h2>
              <Link
                to={`/cars?brand=${brand}`}
                className="text-[18px] font-semibold text-gray-500 hover:text-dark transition"
              >
                Бүгдийг харах →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="aspect-[4/3] skeleton rounded-lg mb-3" />
                      <div className="h-4 skeleton w-3/4 mb-2" />
                      <div className="h-5 skeleton w-1/2" />
                    </div>
                  ))
                : (bData?.cars || []).map((car) => (
                    <CompactCarCard key={car.id} car={car} rates={rates} />
                  ))}
            </div>
          </div>
        </section>
      ))}

      {/* ===== MANUAL CARS (Админаас оруулсан) ===== */}
      {manualCars && manualCars.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[28px] font-bold text-dark">Бидний зарууд</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {manualCars?.slice(0, 4).map((car: any) => (
                <Link key={car._id} to={`/manual-cars/${car._id}`} className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative bg-gray-50 aspect-[4/3] overflow-hidden">
                    {car.images?.[0] && (
                      <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[18px] font-medium text-dark leading-snug truncate">{car.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[14px] text-gray-400">
                      <span>{car.year}</span>
                      <span>·</span>
                      <span>{formatNumber(car.mileage || 0)}км</span>
                      <span>·</span>
                      <span>{fuelLabel(car.fuelType)}</span>
                    </div>
                    <p className="text-[22px] font-bold text-dark mt-2">
                      {formatNumber(car.price)}₮
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  )
}

/* ===== Hero Featured Card with 6s image slideshow ===== */
function HeroFeaturedCard({ car, rates }: { car: Car; rates?: ExchangeRate }) {
  const imgs = car.images?.length ? car.images : car.image ? [car.image] : []
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (imgs.length <= 1) return
    const timer = setInterval(() => {
      setImgIdx((prev) => (prev + 1) % imgs.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [imgs.length])

  return (
    <Link
      to={`/cars/${car.id}`}
      className="block bg-gray-900 rounded-xl overflow-hidden h-full relative group"
    >
      {imgs.length > 0 && (
        <img
          key={imgIdx}
          src={getImageUrl(imgs[imgIdx])}
          alt={car.title}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity absolute inset-0 animate-fade-in"
        />
      )}
      <div className="relative z-10 flex flex-col justify-end h-full p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent min-h-[400px]">
        <span className="inline-block bg-primary text-white text-[14px] font-bold px-2.5 py-1 rounded mb-3 w-fit uppercase tracking-wide">
          Онцлох зар
        </span>
        <h2 className="text-white text-[30px] font-bold leading-snug mb-2">
          {car.title}
        </h2>
        <div className="flex items-center gap-3 text-gray-300 text-[18px] mb-3">
          <span>{car.year}</span>
          <span>·</span>
          <span>{formatNumber(car.mileage)} км</span>
        </div>
        {rates && (
          <p className="text-white text-[32px] font-extrabold">
            {toMnt(car.price, car.currency, rates)}
          </p>
        )}
        {/* Image dots */}
        {imgs.length > 1 && (
          <div className="flex items-center gap-1.5 mt-3">
            {imgs.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === imgIdx ? 'bg-white w-4' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[18px] font-semibold px-5 py-2.5 rounded-lg w-fit transition">
          Дэлгэрэнгүй үзэх
        </span>
      </div>
    </Link>
  )
}

/* ===== Middle Featured Card (between latest and brands) ===== */
function MiddleFeaturedCard({ car, rates }: { car: Car; rates?: ExchangeRate }) {
  const imgs = car.images?.length ? car.images : car.image ? [car.image] : []
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (imgs.length <= 1) return
    const timer = setInterval(() => {
      setImgIdx((prev) => (prev + 1) % imgs.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [imgs.length])

  return (
    <Link
      to={`/cars/${car.id}`}
      className="block rounded-xl overflow-hidden relative group"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 bg-gray-900 rounded-xl overflow-hidden">
        {/* Image side */}
        <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden">
          {imgs.length > 0 && (
            <img
              key={imgIdx}
              src={getImageUrl(imgs[imgIdx])}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 animate-fade-in"
            />
          )}
          {imgs.length > 1 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              {imgs.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === imgIdx ? 'bg-white w-4' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info side */}
        <div className="p-6 lg:p-8 flex flex-col justify-center">
          <span className="inline-block bg-yellow-500 text-black text-[14px] font-bold px-2.5 py-1 rounded mb-4 w-fit uppercase tracking-wide">
            Онцлох зар
          </span>
          <h3 className="text-white text-[32px] font-bold leading-snug mb-3">
            {car.title}
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-gray-400 text-[18px] mb-4">
            <span>{car.year}он</span>
            <span>·</span>
            <span>{formatNumber(car.mileage)} км</span>
            <span>·</span>
            <span>{fuelLabel(car.fuelType)}</span>
            {car.transmission && (
              <>
                <span>·</span>
                <span>{car.transmission === 'Auto' ? 'Автомат' : car.transmission}</span>
              </>
            )}
          </div>
          {rates && (
            <p className="text-white text-[36px] font-extrabold mb-4">
              {toMnt(car.price, car.currency, rates)}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 bg-primary hover:bg-blue-700 text-white text-[20px] font-semibold px-6 py-3 rounded-lg w-fit transition">
            Дэлгэрэнгүй үзэх →
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ===== Compact Car Card ===== */
function CompactCarCard({ car, rates }: { car: Car; rates?: ExchangeRate }) {
  return (
    <Link to={`/cars/${car.id}`} className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative bg-gray-50 aspect-[4/3] overflow-hidden">
        <img
          src={getImageUrl(car.image)}
          alt={car.title}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="text-[18px] font-medium text-dark leading-snug truncate">
          {car.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 text-[14px] text-gray-400">
          <span>{car.year}</span>
          <span>·</span>
          <span>{formatNumber(car.mileage)}км</span>
          <span>·</span>
          <span>{fuelLabel(car.fuelType)}</span>
        </div>
        <p className="text-[22px] font-bold text-dark mt-2">
          {rates ? toMnt(car.price, car.currency, rates) : `${formatNumber(car.price)} ${car.currency}`}
        </p>
      </div>
    </Link>
  )
}
