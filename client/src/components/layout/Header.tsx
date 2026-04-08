import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchExchangeRate } from '../../lib/api'
import { formatNumber } from '../../lib/utils'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  const isActive = (path: string, query?: string) => {
    if (query) {
      return location.pathname === path && searchParams.toString() === query
    }
    return location.pathname === path && searchParams.toString() === ''
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SMCar.mn" className="h-14" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={`text-[20px] font-medium py-[18px] border-b-2 transition-colors ${
                isActive('/') ? 'border-primary text-dark' : 'border-transparent text-gray-500 hover:text-dark'
              }`}
            >
              Нүүр
            </Link>
            <Link
              to="/cars"
              className={`text-[20px] font-medium py-[18px] border-b-2 transition-colors ${
                isActive('/cars') ? 'border-primary text-dark' : 'border-transparent text-gray-500 hover:text-dark'
              }`}
            >
              Бүх машин
            </Link>
            <Link
              to="/cars?body_type=Bus"
              className={`text-[20px] font-medium py-[18px] border-b-2 transition-colors ${
                isActive('/cars', 'body_type=Bus') ? 'border-primary text-dark' : 'border-transparent text-gray-500 hover:text-dark'
              }`}
            >
              Автобус
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Exchange rates */}
            {rates && (
              <div className="hidden sm:flex items-center gap-2.5 text-[13px] text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <span className="font-medium">1₩ = {rates.wonToMnt}₮</span>
                <span className="text-gray-300">|</span>
                <span className="font-medium">1$ = {formatNumber(rates.usdToMnt)}₮</span>
              </div>
            )}

            <Link
              to="/cars"
              className="hidden sm:flex items-center gap-1.5 text-[18px] font-semibold text-dark hover:text-primary transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Хайх
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 text-gray-600"
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
          {/* Mobile exchange rates */}
          {rates && (
            <div className="px-4 pt-3 flex items-center gap-3 text-[14px] text-gray-500">
              <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-full">1₩ = {rates.wonToMnt}₮</span>
              <span className="font-medium bg-gray-50 px-2.5 py-1 rounded-full">1$ = {formatNumber(rates.usdToMnt)}₮</span>
            </div>
          )}
          <nav className="px-4 py-3 space-y-1">
            {[
              { to: '/', label: 'Нүүр' },
              { to: '/cars', label: 'Бүх машин' },
              { to: '/cars?body_type=Bus', label: 'Автобус' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-[20px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
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
