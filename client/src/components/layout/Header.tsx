import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchExchangeRate } from '../../lib/api'
import { formatNumber } from '../../lib/utils'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  // Home page-ийн hero дээр header ил тод эхэлдэг
  const isHome = location.pathname === '/'
  const transparent = isHome && !scrolled

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const isActive = (path: string, query?: string) => {
    if (query) {
      return location.pathname === path && searchParams.toString() === query
    }
    return location.pathname === path && searchParams.toString() === ''
  }

  // Hero дээр улаан-руу нийлсэн gradient, scroll хийхэд цайвар
  const headerBg = transparent
    ? 'bg-gradient-to-b from-[#1a0608] via-[#1a0608]/85 to-transparent border-transparent'
    : 'bg-white border-gray-200 shadow-sm'
  const navText = transparent
    ? 'text-white drop-shadow-md hover:text-red-200'
    : 'text-gray-700 hover:text-red-600'
  const navActive = transparent ? 'border-red-300 text-white' : 'border-red-500 text-red-600'

  const navLinks = [
    { to: '/', label: 'Нүүр' },
    { to: '/cars', label: 'Бүх машин' },
    { to: '/cars?vehicleType=special', label: 'Тусгай ангилал' },
    { to: '/about', label: 'Бидний тухай' },
  ]

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${headerBg}`}>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo2.png" alt="Somang Trading" className="h-14" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const active = link.to.includes('?')
                ? isActive(link.to.split('?')[0], link.to.split('?')[1])
                : isActive(link.to)
              return (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  className={`text-[17px] font-medium py-[20px] border-b-2 transition-colors ${
                    active ? navActive : `border-transparent ${navText}`
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Exchange rates */}
            {rates && (
              <div
                className={`hidden sm:flex items-center gap-2.5 text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
                  transparent
                    ? 'text-white/90 bg-white/10 border-white/20 backdrop-blur-sm'
                    : 'text-gray-500 bg-gray-50 border-gray-200'
                }`}
              >
                <span className="font-medium">1₩ = {rates.wonToMnt}₮</span>
                <span className={transparent ? 'text-white/40' : 'text-gray-300'}>|</span>
                <span className="font-medium">1$ = {formatNumber(rates.usdToMnt)}₮</span>
              </div>
            )}

            <Link
              to="/cars"
              className={`hidden sm:flex items-center gap-1.5 text-[16px] font-semibold transition ${
                transparent ? 'text-white hover:text-red-200' : 'text-dark hover:text-primary'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Хайх
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`md:hidden p-1.5 ${transparent ? 'text-white' : 'text-gray-600'}`}
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          {rates && (
            <div className="px-4 pt-3 flex items-center gap-3 text-[14px] text-gray-500">
              <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-full">1₩ = {rates.wonToMnt}₮</span>
              <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-full">1$ = {formatNumber(rates.usdToMnt)}₮</span>
            </div>
          )}
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to + link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-[18px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
