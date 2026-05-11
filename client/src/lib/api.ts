import axios from 'axios'
import type {
  Car,
  CarsResponse,
  CarFilters,
  PricingBreakdown,
  Banner,
  SiteSettings,
  ExchangeRate,
  AuthTokens,
  Reservation,
  FeeSettings,
  FeaturedCar,
} from '../types'

// Бүх хүсэлт бидний backend-аар дамжина (CORS шийдвэр)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
})

// Cache-busting build version: Vite stamps this at build time so every
// fresh deploy invalidates the browser's HTTP cache automatically.
// Changing it forces a "Cache MISS" on every API URL without the user
// needing to hard-refresh.
const BUILD_VERSION = String(import.meta.env.VITE_BUILD_VERSION || Date.now())

// Admin token interceptor + cache-buster version param
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Append ?v=BUILD_VERSION to /cars endpoints so the URL changes with
  // each deploy. Skip endpoints where stable URLs matter (e.g. uploads).
  const url = String(config.url || '')
  if (url.startsWith('/cars')) {
    config.params = { ...(config.params || {}), v: BUILD_VERSION }
  }
  return config
})

// ============ МАШИН (backend proxy-аар) ============

// Машин жагсаалт авах
export async function fetchCars(filters: CarFilters = {}): Promise<CarsResponse> {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
    )
    const { data } = await api.get('/cars', { params })
    return { cars: data?.cars || [], total: data?.total || 0, page: data?.page || 1, totalPages: data?.totalPages || 1 }
  } catch {
    return { cars: [], total: 0, page: 1, totalPages: 1 }
  }
}

// Нэг машин авах
export async function fetchCar(id: string): Promise<Car> {
  const { data } = await api.get(`/cars/${id}`)
  return data
}

// Машины бүрэн мэдээлэл авах
export async function fetchCarFull(id: string): Promise<Car> {
  const { data } = await api.get(`/cars/${id}/full`)
  return data
}

// Статистик авах
export async function fetchCarStats(): Promise<{ total: number }> {
  const { data } = await api.get('/cars/stats')
  return data
}

// Үнийн задаргаа авах
export async function fetchPricingBreakdown(
  originalPrice: number,
  bodyType: string,
  isKrw: boolean
): Promise<PricingBreakdown> {
  const { data } = await api.post('/cars/pricing-breakdown', {
    originalPrice,
    bodyType,
    isKrw,
  })
  return data
}

// Захиалга илгээх
export async function submitReservation(reservation: Reservation): Promise<void> {
  await api.post('/reservations', reservation)
}

// ============ БАННЕР (бидний backend) ============

export async function fetchBanners(): Promise<Banner[]> {
  try {
    const { data } = await api.get('/banners')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function createBanner(formData: FormData): Promise<Banner> {
  const { data } = await api.post('/banners', formData)
  return data
}

export async function updateBanner(id: string, formData: FormData): Promise<Banner> {
  const { data } = await api.put(`/banners/${id}`, formData)
  return data
}

export async function deleteBanner(id: string): Promise<void> {
  await api.delete(`/banners/${id}`)
}

// ============ ТОХИРГОО (бидний backend) ============

export async function fetchSettings(): Promise<SiteSettings> {
  const { data } = await api.get('/settings')
  return data
}

export async function updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const { data } = await api.put('/settings', settings)
  return data
}

// ============ ХАНШ (бидний backend) ============

export async function fetchExchangeRate(): Promise<ExchangeRate> {
  const { data } = await api.get('/exchange-rate')
  return data
}

export async function updateExchangeRate(
  rates: Pick<ExchangeRate, 'wonToMnt' | 'euroToMnt' | 'usdToMnt'>
): Promise<ExchangeRate> {
  const { data } = await api.put('/exchange-rate', rates)
  return data
}

// ============ НЭВТРЭЛТ ============

export async function adminLogin(username: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const { data } = await api.post('/auth/refresh', { refreshToken: token })
  return data
}

export async function verifyToken(): Promise<boolean> {
  try {
    await api.get('/auth/verify')
    return true
  } catch {
    return false
  }
}

// ============ ТАТВАР/ШИМТГЭЛ ============

export async function fetchFeeSettings(): Promise<FeeSettings> {
  const { data } = await api.get('/fees')
  return data
}

export async function updateFeeSettings(fees: Partial<FeeSettings>): Promise<FeeSettings> {
  const { data } = await api.put('/fees', fees)
  return data
}

// ============ ОНЦЛОХ ЗАР ============

export async function fetchFeaturedCars(): Promise<FeaturedCar[]> {
  try {
    const { data } = await api.get('/featured-car')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function setFeaturedCar(carId: string, position: string): Promise<FeaturedCar> {
  const { data } = await api.put('/featured-car', { carId, position })
  return data
}

export async function removeFeaturedCar(position: string): Promise<void> {
  await api.delete(`/featured-car/${position}`)
}

// ============ ГАРААР ОРУУЛСАН МАШИН ============

export async function fetchManualCars(): Promise<any[]> {
  try {
    const { data } = await api.get('/manual-cars')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function createManualCar(formData: FormData): Promise<any> {
  const { data } = await api.post('/manual-cars', formData)
  return data
}

export async function updateManualCar(id: string, formData: FormData): Promise<any> {
  const { data } = await api.put(`/manual-cars/${id}`, formData)
  return data
}

export async function deleteManualCar(id: string): Promise<void> {
  await api.delete(`/manual-cars/${id}`)
}

export async function fetchStorageInfo(): Promise<{ fileCount: number; totalSizeMB: string }> {
  const { data } = await api.get('/manual-cars/storage')
  return data
}

// ============ ЗУРАГ PROXY ============

const BASE = import.meta.env.VITE_API_URL || ''

export function getImageUrl(url: string): string {
  if (!url) return ''
  // Local uploads (manual cars)
  if (url.startsWith('/uploads')) return `${BASE}${url}`
  // Our own opaque photo proxy URLs (/api/p/<b64>.jpg) — prefix base only.
  if (url.startsWith('/api/p/')) return `${BASE}${url}`
  // Already absolute (legacy apicars URLs) — route through CORS proxy.
  if (url.startsWith('http')) {
    return `${BASE}/api/image-proxy?url=${encodeURIComponent(url)}`
  }
  return url
}
