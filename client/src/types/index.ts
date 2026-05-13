// Машины мэдээлэл (Carapis 2026-05-13 schema-аас normalize-сэн)
export interface Car {
  id: string
  title: string
  brand: string
  model: string
  trim?: string
  generation?: string
  year: number
  price: number
  currency: 'EUR' | 'KRW' | 'USD'
  mileage: number
  fuelType: string
  transmission: string
  location: string
  region?: string
  source?: string
  image: string
  images: string[]
  thumbnails?: string[]
  photos?: { url: string; thumb_url: string; is_main: boolean; position: number; photo_type: string }[]
  type: string
  body_type: string
  color: string
  encar_id: string
  original_price_krw?: number
  listing_url?: string
  vin?: string
  description?: string
  displacement?: number
  vehicle_no?: string
  drive_type?: string
  seat_count?: number | null
  has_accident?: boolean
  has_recall?: boolean
  has_simple_repair?: boolean
  recall_fulfilled?: boolean
  inspection_passed?: boolean | null
  warranty_type?: string
  owner_count?: number | null
  dealer_type?: string
  is_undervalued?: boolean
  valuation_score?: number | null
  is_new_vehicle?: boolean
  is_verified?: boolean
  is_masked?: boolean
  advertisement_status?: string
  first_seen_at?: string | null
  last_seen_at?: string | null
  status_changed_at?: string | null
}

// Үнийн задаргаа
export interface PricingBreakdown {
  originalPrice: number
  diagnosticFee: number
  shippingFee: number
  kosovoTransportFee: number
  commissionFee: number
  extraFee: number
  discount: number
  totalPrice: number
}

// Баннер
export interface Banner {
  _id: string
  title: string
  imageUrl: string
  linkUrl: string
  position: 'home_top' | 'home_middle' | 'sidebar'
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

// Сайтын тохиргоо
export interface SiteSettings {
  _id: string
  siteName: string
  logoUrl: string
  phone: string
  email: string
  address: string
  socialLinks: {
    facebook: string
    instagram: string
  }
  updatedAt: string
}

// Ханш
export interface ExchangeRate {
  _id: string
  wonToMnt: number
  euroToMnt: number
  usdToMnt: number
  updatedBy: string
  updatedAt: string
}

// Захиалга
export interface Reservation {
  firstName: string
  lastName: string
  email: string
  phone: string
  car: { id: string }
  comment: string
}

// Шүүлтийн параметрүүд (Carapis docs 2026-05-13)
export interface CarFilters {
  brand?: string
  model?: string
  yearFrom?: number
  yearTo?: number
  priceFrom?: number
  priceTo?: number
  fuelType?: string
  transmission?: string
  color?: string
  minMileage?: number
  maxMileage?: number
  body_type?: string
  vehicleType?: string
  hasAccident?: boolean // false → зөвхөн осолгүй
  inspectionPassed?: boolean
  isNewVehicle?: boolean
  search?: string
  sortBy?: 'price' | 'year' | 'mileage' | 'scraped_at'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Auth
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Татвар/шимтгэл тохиргоо
export interface FeeSettings {
  _id: string
  serviceFee: number    // ₩
  transportFee: number  // ₩
  specialTax: number    // %
  customsVat: number    // %
  updatedBy: string
  updatedAt: string
}

// Онцлох зар
export interface FeaturedCar {
  _id: string
  carId: string
  position: 'hero' | 'middle'
  isActive: boolean
  updatedAt: string
}

// API хариу
export interface CarsResponse {
  cars: Car[]
  total: number
  page: number
  totalPages: number
}
