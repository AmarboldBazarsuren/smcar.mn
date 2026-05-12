// Машины мэдээлэл
export interface Car {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  currency: 'EUR' | 'KRW' | 'USD'
  mileage: number
  fuelType: string
  transmission: string
  location: string
  image: string
  images: string[]
  type: string
  body_type: string
  color: string
  encar_id: string
  original_price_krw?: number
  listing_url?: string
  vin?: string
  is_rent_succession?: boolean
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

// Шүүлтийн параметрүүд
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
  maxMileage?: number
  body_type?: string
  vehicleType?: string
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
