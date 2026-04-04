import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCars, fetchExchangeRate, getImageUrl } from '../../lib/api'
import { toMnt } from '../../lib/utils'

export default function Cars() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['adminCars', search, page],
    queryFn: () => fetchCars({ brand: search || undefined, page, limit: 20, sortBy: 'scraped_at', sortOrder: 'desc' }),
  })

  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Машинууд</h1>
          <p className="text-sm text-gray-500 mt-1">apicars.info-аас татсан машинууд</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Брэндээр хайх..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4">Зураг</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4">Нэр</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 hidden md:table-cell">Брэнд</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 hidden md:table-cell">Он</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider p-4">Үнэ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="p-4"><div className="w-16 h-12 skeleton rounded-lg" /></td>
                  <td className="p-4"><div className="h-4 skeleton w-48" /></td>
                  <td className="p-4 hidden md:table-cell"><div className="h-4 skeleton w-20" /></td>
                  <td className="p-4 hidden md:table-cell"><div className="h-4 skeleton w-12" /></td>
                  <td className="p-4"><div className="h-4 skeleton w-28 ml-auto" /></td>
                </tr>
              ))
            ) : (
              data?.cars.map((car) => (
                <tr key={car.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <img src={getImageUrl(car.image)} alt="" className="w-16 h-12 object-cover rounded-lg" />
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{car.title}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-xs font-medium bg-gray-50 px-2.5 py-1 rounded-lg text-gray-600">{car.brand}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-gray-600">{car.year}</td>
                  <td className="p-4 text-right">
                    <p className="text-sm font-bold text-blue-600">
                      {rates ? toMnt(car.price, car.currency, rates) : `${car.price} ${car.currency}`}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm disabled:opacity-40 hover:border-blue-300 transition">Өмнөх</button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm disabled:opacity-40 hover:border-blue-300 transition">Дараах</button>
        </div>
      )}
    </div>
  )
}
