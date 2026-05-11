import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const BRAND_MODELS: Record<string, string[]> = {
  'Kia': [
    'Morning', 'Ray', 'K3', 'K5', 'K7', 'K8', 'K9', 'Stinger',
    'Sportage', 'Sorento', 'Carnival', 'Mohave', 'Seltos', 'Niro',
    'EV6', 'EV9', 'EV3', 'Soul', 'Forte', 'Optima', 'Rio',
    'Picanto', 'Ceed', 'Stonic', 'Telluride', 'Bongo',
  ],
  'Genesis': [
    'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'GV90',
    'Electrified G80', 'Electrified GV70', 'X Gran Berlinetta',
  ],
  'Porsche': [
    '718 Boxster', '718 Cayman', '911', 'Taycan', 'Panamera',
    'Macan', 'Cayenne', 'Carrera GT', '918 Spyder', 'Cayman',
    'Boxster', '911 GT3', '911 Turbo', 'Macan EV', 'Cayenne Coupe',
  ],
  'Jeep': [
    'Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade',
    'Gladiator', 'Avenger', 'Commander', 'Wagoneer', 'Grand Wagoneer',
  ],
  'Lexus': [
    'ES', 'IS', 'LS', 'GS', 'NX', 'RX', 'UX', 'GX', 'LX',
    'LC', 'RC', 'LM', 'RZ', 'TX', 'LBX',
  ],
  'Honda': [
    'Civic', 'Accord', 'CR-V', 'HR-V', 'Fit', 'Odyssey', 'Pilot',
    'Passport', 'Ridgeline', 'Insight', 'Vezel', 'ZR-V', 'e:Ny1',
    'Jazz', 'City', 'BR-V', 'WR-V', 'Stepwgn',
  ],
  'Bentley': [
    'Continental GT', 'Continental GTC', 'Flying Spur', 'Bentayga',
    'Mulsanne', 'Arnage', 'Azure', 'Brooklands',
  ],
  'Lamborghini': [
    'Huracan', 'Aventador', 'Urus', 'Revuelto', 'Gallardo',
    'Murcielago', 'Diablo', 'Countach', 'Temerario', 'Urus SE',
  ],
  'McLaren': [
    '720S', '570S', '570GT', '600LT', '620R', '650S', '675LT',
    '765LT', 'GT', 'Artura', 'P1', 'Senna', 'Speedtail', 'Elva',
  ],
  'Mazda': [
    'Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5',
    'CX-50', 'CX-60', 'CX-8', 'CX-9', 'CX-90', 'MX-5', 'MX-30',
  ],
  'Hyundai': [
    'Casper', 'Venue', 'Avante', 'Sonata', 'Grandeur', 'Ioniq 5',
    'Ioniq 6', 'Ioniq 9', 'Kona', 'Tucson', 'Santa Fe', 'Palisade',
    'Nexo', 'Staria', 'Porter', 'i20', 'i30', 'i40', 'Accent',
    'Elantra', 'Creta', 'Bayon', 'Santa Cruz', 'Alcazar',
  ],
  'Chevrolet': [
    'Spark', 'Malibu', 'Cruze', 'Impala', 'Camaro', 'Corvette',
    'Trax', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban',
    'Colorado', 'Silverado', 'Bolt', 'Bolt EUV', 'Trailblazer',
    'Captiva', 'Orlando',
  ],
  'Mini': [
    'Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Convertible',
    'John Cooper Works', 'Paceman', 'Cooper SE', 'Aceman',
  ],
  'Volkswagen': [
    'Golf', 'Polo', 'Passat', 'Jetta', 'Arteon', 'Tiguan',
    'Touareg', 'T-Roc', 'T-Cross', 'Taos', 'Atlas', 'ID.3',
    'ID.4', 'ID.5', 'ID.7', 'ID. Buzz', 'Up', 'Scirocco', 'CC',
  ],
  'Toyota': [
    'Camry', 'Corolla', 'Avalon', 'Crown', 'Supra', 'GR86',
    'Prius', 'Yaris', 'Vios', 'C-HR', 'RAV4', 'Highlander',
    'Land Cruiser', 'Land Cruiser Prado', 'Fortuner', 'Harrier',
    'Venza', 'Sienna', 'Alphard', 'Vellfire', 'Tacoma', 'Tundra',
    'Hilux', 'bZ4X', 'GR Corolla', 'Century',
  ],
  'Cadillac': [
    'CT4', 'CT5', 'CT6', 'Escalade', 'Escalade ESV', 'XT4', 'XT5',
    'XT6', 'Lyriq', 'Celestiq', 'CTS', 'ATS', 'SRX', 'Optiq',
  ],
  'Infiniti': [
    'Q50', 'Q60', 'Q70', 'QX50', 'QX55', 'QX60', 'QX80',
    'QX30', 'G37', 'FX', 'EX', 'M37', 'JX',
  ],
  'Aston Martin': [
    'DB11', 'DB12', 'DBS', 'Vantage', 'DBX', 'DBX707',
    'Rapide', 'Vanquish', 'Valkyrie', 'DB9',
  ],
  'Mercedes-Benz': [
    'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class',
    'CLA', 'CLS', 'CLE', 'GLA', 'GLB', 'GLC', 'GLC Coupe',
    'GLE', 'GLE Coupe', 'GLS', 'G-Class', 'AMG GT',
    'SL', 'SLC', 'SLK', 'Maybach S-Class', 'Maybach GLS',
    'EQA', 'EQB', 'EQC', 'EQE', 'EQE SUV', 'EQS', 'EQS SUV',
    'V-Class', 'Sprinter', 'AMG One', 'AMG C63', 'AMG E63',
  ],
  'Renault': [
    'Clio', 'Megane', 'Talisman', 'Captur', 'Kadjar', 'Koleos',
    'Arkana', 'Scenic', 'Espace', 'Zoe', 'Twingo', 'Duster',
    'Master', 'Kangoo', 'QM6', 'SM6', 'XM3', 'Austral', 'Rafale',
  ],
  'Land Rover': [
    'Range Rover', 'Range Rover Sport', 'Range Rover Velar',
    'Range Rover Evoque', 'Defender', 'Defender 90', 'Defender 110',
    'Defender 130', 'Discovery', 'Discovery Sport', 'Freelander',
  ],
  'Ford': [
    'Mustang', 'Mustang Mach-E', 'Focus', 'Fusion', 'Taurus',
    'Explorer', 'Escape', 'Edge', 'Expedition', 'Bronco',
    'Bronco Sport', 'F-150', 'F-150 Lightning', 'Ranger',
    'Maverick', 'EcoSport', 'Puma', 'Kuga', 'Mondeo', 'Transit',
  ],
  'Lincoln': [
    'Navigator', 'Navigator L', 'Aviator', 'Corsair', 'Nautilus',
    'Continental', 'MKZ', 'MKC', 'MKX', 'MKT',
  ],
  'Peugeot': [
    '108', '208', '308', '408', '508', '2008', '3008', '5008',
    'Rifter', 'Partner', 'Expert', 'Traveller', 'e-208', 'e-2008',
  ],
  'Nissan': [
    'Altima', 'Sentra', 'Maxima', 'Versa', 'GT-R', '370Z', '400Z',
    'Rogue', 'Pathfinder', 'Murano', 'Kicks', 'Juke', 'Qashqai',
    'X-Trail', 'Armada', 'Patrol', 'Navara', 'Leaf', 'Ariya',
    'Note', 'Serena', 'Elgrand', 'Titan',
  ],
  'Suzuki': [
    'Swift', 'Vitara', 'S-Cross', 'Jimny', 'Ignis', 'Baleno',
    'Celerio', 'Ciaz', 'Across', 'Ertiga', 'XL7', 'Fronx',
    'Grand Vitara', 'Alto', 'Wagon R', 'Hustler',
  ],
  'BMW': [
    '1 Series', '2 Series', '2 Series Gran Coupe', '3 Series',
    '4 Series', '4 Series Gran Coupe', '5 Series', '6 Series',
    '6 Series GT', '7 Series', '8 Series', 'X1', 'X2', 'X3',
    'X4', 'X5', 'X6', 'X7', 'XM', 'Z4', 'i3', 'i4', 'i5',
    'i7', 'iX', 'iX1', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M8',
  ],
  'Audi': [
    'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3',
    'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'Q8 e-tron', 'e-tron',
    'e-tron GT', 'TT', 'R8', 'RS3', 'RS4', 'RS5', 'RS6',
    'RS7', 'RS Q8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5',
  ],
  'Volvo': [
    'S60', 'S90', 'V60', 'V60 Cross Country', 'V90',
    'V90 Cross Country', 'XC40', 'XC60', 'XC90', 'C40',
    'EX30', 'EX40', 'EX90', 'EC40',
  ],
  'Tesla': [
    'Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck',
    'Roadster', 'Semi',
  ],
  'Maserati': [
    'Ghibli', 'Quattroporte', 'Levante', 'MC20', 'MC20 Cielo',
    'Grecale', 'GranTurismo', 'GranCabrio', 'Merak',
  ],
  'Jaguar': [
    'F-Pace', 'E-Pace', 'I-Pace', 'F-Type', 'XE', 'XF', 'XJ',
    'XK', 'XJL', 'S-Type', 'X-Type',
  ],
  'Rolls-Royce': [
    'Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre',
    'Silver Shadow', 'Silver Spirit', 'Corniche',
  ],
  'GMC': [
    'Sierra', 'Sierra HD', 'Yukon', 'Yukon XL', 'Canyon',
    'Acadia', 'Terrain', 'Hummer EV', 'Hummer EV SUV', 'Envoy',
  ],
  'BYD': [
    'Atto 3', 'Han', 'Tang', 'Song Plus', 'Song Pro', 'Seal',
    'Seal U', 'Dolphin', 'Yuan Plus', 'Qin Plus', 'Destroyer 05',
    'Frigate 07', 'Shark', 'Denza D9', 'Yangwang U8',
  ],
  'Fiat': [
    '500', '500e', '500X', '500L', 'Panda', 'Tipo', 'Punto',
    'Ducato', 'Doblo', 'Topolino', 'Linea', 'Bravo', '124 Spider',
  ],
}


export default function Home() {
  const navigate = useNavigate()
  const [activeBrand, setActiveBrand] = useState<string | null>(null)
  const [showAllBrands, setShowAllBrands] = useState(false)

  // Бүх машинуудыг нэг удаа татах - brand солиход дахин fetch хийхгүй
  const { data: allCarsData, isLoading: allCarsLoading } = useQuery({
    queryKey: ['allCarsHome'],
    queryFn: () => fetchCars({ limit: 1000, sortBy: 'scraped_at', sortOrder: 'desc' }),
    staleTime: 10 * 60 * 1000,
  })

  // Hardcoded загварууд + API-с ирсэн загваруудыг нэгтгэнэ
  const models = useMemo(() => {
    if (!activeBrand) return []
    const hardcoded = BRAND_MODELS[activeBrand] || []
    const fromApi = allCarsData?.cars
      ? allCarsData.cars.filter((c) => c.brand === activeBrand).map((c) => c.model).filter(Boolean)
      : []
    return [...new Set([...hardcoded, ...fromApi])].sort()
  }, [allCarsData, activeBrand])

  // Онцлох машинууд - 4 өөр brand-ийн машин
  const featuredBrandCars = useMemo(() => {
    if (!allCarsData?.cars) return []
    const seen = new Set<string>()
    const result: typeof allCarsData.cars = []
    for (const car of allCarsData.cars) {
      if (car.brand && !seen.has(car.brand)) {
        seen.add(car.brand)
        result.push(car)
        if (result.length >= 4) break
      }
    }
    return result
  }, [allCarsData])

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


  // Grid column count detection for row insertion
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

  const activeRowIdx = activeBrand ? Math.floor(BRANDS.indexOf(activeBrand) / gridCols) : -1

  const handleBrandClick = (brand: string) => {
    setActiveBrand(activeBrand === brand ? null : brand)
  }

  const handleModelClick = (brand: string, model: string) => {
    navigate(`/cars?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`)
  }

  return (
    <main className="bg-white">
      {/* ===== HERO: Bold red theme, large prominent photo, plain-language steps ===== */}
      <section className="relative overflow-hidden bg-[#1a0608] min-h-[88vh]">
        {/* Big, prominent car photo */}
        <img
          src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=2400&q=85"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-75 pointer-events-none select-none"
          loading="eager"
        />
        {/* Red ambient glow (lighter so the photo reads) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 70% 40%, rgba(220,40,40,0.20) 0%, transparent 55%)',
          }}
        />
        {/* Subtle bottom/side fades for text readability without hiding the photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0608]/40 via-[#1a0608]/15 to-[#1a0608]" />
        <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#1a0608]/65 to-transparent" />

        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 pt-28 pb-16 lg:pt-40 lg:pb-24">
          {/* Centered hero text */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-red-400/50 bg-red-500/15 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[12px] uppercase tracking-[0.25em] text-red-100 font-semibold">
                Somang Trading · БНСУ
              </span>
            </div>

            <h1 className="text-white text-[40px] md:text-[60px] lg:text-[72px] font-extrabold leading-[1.05] tracking-tight drop-shadow-2xl">
              Солонгосоос Монгол хүртэл,
              <br />
              <span className="bg-gradient-to-r from-red-300 via-red-400 to-red-500 bg-clip-text text-transparent">
                бид тантай хамт.
              </span>
            </h1>
            <p className="mt-6 text-[17px] md:text-[19px] text-red-50/85 leading-relaxed max-w-2xl mx-auto">
              Машинаа Солонгосоос захиалаад, Монгол улсад ирэх хүртэл бүх ажлыг бид хариуцна.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-[15px] font-bold px-7 py-3.5 rounded-full transition shadow-xl shadow-red-900/50"
              >
                Машин үзэх <span aria-hidden>→</span>
              </Link>
              <a
                href="tel:+97672105633"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white text-[15px] font-medium px-7 py-3.5 rounded-full transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                7210-5633
              </a>
            </div>
          </div>

          {/* Horizontal 4-step process timeline (plain Mongolian) */}
          <div className="mt-16 lg:mt-24">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
              {[
                {
                  n: '01',
                  title: 'Машинаа сонгох',
                  desc: 'Манай вэб дээрх машинуудаас өөрт таалагдсаныг нь сонгоно.',
                },
                {
                  n: '02',
                  title: 'Биечлэн шалгана',
                  desc: 'Худалдан авахаас өмнө машиныг газар дээр нь шалгаж зургаар үзүүлнэ.',
                },
                {
                  n: '03',
                  title: 'Монгол руу тээвэрлэнэ',
                  desc: 'Контейнер эсвэл усан замаар найдвартай хүргэнэ.',
                },
                {
                  n: '04',
                  title: 'Гар дээр тань хүрнэ',
                  desc: 'Гааль, бичиг баримт, шилжүүлгийн ажлыг бид бүрэн хариуцна.',
                },
              ].map((step) => (
                <div key={step.n} className="bg-[#1a0608]/85 px-5 py-7 hover:bg-[#260a0c] transition group">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-red-300 font-bold text-[18px] tracking-wider">{step.n}</span>
                    <span className="h-px flex-1 bg-red-400/25" />
                  </div>
                  <h3 className="text-white text-[17px] font-bold group-hover:text-red-200 transition">
                    {step.title}
                  </h3>
                  <p className="text-red-50/60 text-[13.5px] mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRAND TABS + MODELS + FEATURED ===== */}
      <section className="bg-white">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
          <h2 className="text-[24px] md:text-[28px] font-bold text-dark mb-5">
            Брэнд, загвараар хайх
          </h2>

          {/* Brand grid with models inserted below active row */}
          <div className="mb-3">
            <div ref={brandGridRef} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
              {BRANDS.map((brand, i) => {
                const mobileVisible = showAllBrands || i < 12
                const isLastInRow = i + 1 === BRANDS.length || Math.floor((i + 1) / gridCols) !== Math.floor(i / gridCols)
                const isActiveRow = activeBrand && Math.floor(i / gridCols) === activeRowIdx
                return (
                  <Fragment key={brand}>
                    <button
                      onClick={() => handleBrandClick(brand)}
                      className={`px-2 py-2 text-[15px] font-medium rounded-lg border transition-all text-center truncate ${!mobileVisible ? 'hidden sm:block' : ''} ${
                        activeBrand === brand
                          ? 'bg-dark text-white border-dark'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {brand}
                    </button>
                    {/* Models grid: same columns as brands, right below active row */}
                    {activeBrand && models.length > 0 && isActiveRow && isLastInRow && (
                      <div
                        className="col-span-full bg-gray-100 rounded-xl p-3"
                        style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`, gap: '0.375rem' }}
                      >
                        <Link
                          to={`/cars?brand=${encodeURIComponent(activeBrand)}`}
                          className="text-[13px] py-1 rounded-md text-center truncate transition-all bg-dark text-white font-semibold"
                        >
                          Бүгд
                        </Link>
                        {models.map((model) => (
                          <button
                            key={model}
                            onClick={() => handleModelClick(activeBrand, model)}
                            className="text-[13px] py-1 rounded-md text-center truncate transition-all text-gray-600 hover:bg-gray-200"
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
            {/* Show all brands button - mobile only */}
            {!showAllBrands && BRANDS.length > 12 && (
              <button
                onClick={() => setShowAllBrands(true)}
                className="sm:hidden w-full mt-2 py-2 text-[14px] font-medium text-primary border border-primary rounded-lg hover:bg-primary/5 transition"
              >
                Бүх brand харах ({BRANDS.length - 12}+)
              </button>
            )}
            {showAllBrands && (
              <button
                onClick={() => setShowAllBrands(false)}
                className="sm:hidden w-full mt-2 py-2 text-[14px] font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Хураах
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Онцлох машинууд (2x2) - 4 өөр brand */}
            <div className="lg:col-span-7">
              <h2 className="text-[18px] font-bold text-dark mb-3">Онцлох машинууд</h2>
              <div className="grid grid-cols-2 gap-4">
                {allCarsLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <div className="aspect-[4/3] skeleton rounded-lg mb-3" />
                        <div className="h-4 skeleton w-3/4 mb-2" />
                        <div className="h-5 skeleton w-1/2" />
                      </div>
                    ))
                  : featuredBrandCars.map((car) => (
                      <CompactCarCard key={car.id} car={car} rates={rates} />
                    ))}
              </div>
              <Link
                to="/cars"
                className="inline-flex items-center gap-1 mt-4 text-[18px] font-semibold text-dark hover:text-primary transition"
              >
                Бүх машин харах →
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
