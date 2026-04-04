import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import CarList from './pages/CarList'
import CarDetail from './pages/CarDetail'
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
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
