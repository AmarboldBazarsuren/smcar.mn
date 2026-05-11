import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import About from './pages/About'
import CarList from './pages/CarList'
import CarDetailLegacy from './pages/CarDetail'
import CarDetailNew from './pages/CarDetail.new'
// VITE_USE_NEW_DETAIL=true   → New Encar-driven white detail page
// (default / unset)          → Legacy detail page
const CarDetail = import.meta.env.VITE_USE_NEW_DETAIL === 'true' ? CarDetailNew : CarDetailLegacy
import ManualCarDetail from './pages/ManualCarDetail'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import Cars from './pages/admin/Cars'
import Banners from './pages/admin/Banners'
import Settings from './pages/admin/Settings'
import ExchangeRatePage from './pages/admin/ExchangeRate'
import FeeSettingsPage from './pages/admin/FeeSettings'
import FeaturedCarsPage from './pages/admin/FeaturedCars'
import ManualCarsPage from './pages/admin/ManualCars'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
import './App.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 1 цаг шинэхэн (background-д сэргээнэ)
      gcTime: 24 * 60 * 60 * 1000, // 24 цаг санах ойд хадгална
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Үндсэн сайт */}
          <Route
            path="/"
            element={
              <>
                <Header />
                <Home />
                <Footer />
              </>
            }
          />
          <Route
            path="/cars"
            element={
              <>
                <Header />
                <CarList />
                <Footer />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <Header />
                <About />
                <Footer />
              </>
            }
          />
          <Route
            path="/cars/:id"
            element={
              <>
                <Header />
                <CarDetail />
                <Footer />
              </>
            }
          />

          <Route
            path="/manual-cars/:id"
            element={
              <>
                <Header />
                <ManualCarDetail />
                <Footer />
              </>
            }
          />

          {/* Админ панел */}
          <Route path="/smcaradmin" element={<AdminLogin />} />
          <Route path="/smcaradmin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cars" element={<Cars />} />
            <Route path="banners" element={<Banners />} />
            <Route path="settings" element={<Settings />} />
            <Route path="exchange-rate" element={<ExchangeRatePage />} />
            <Route path="fees" element={<FeeSettingsPage />} />
            <Route path="featured" element={<FeaturedCarsPage />} />
            <Route path="manual-cars" element={<ManualCarsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
