import { useQuery } from '@tanstack/react-query'
import { fetchCarStats, fetchExchangeRate } from '../../lib/api'
import { Link } from 'react-router-dom'
import { formatNumber } from '../../lib/utils'

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ['carStats'], queryFn: fetchCarStats })
  const { data: rates } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  const cards = [
    {
      label: 'Нийт машин',
      value: stats?.total ? formatNumber(stats.total) : '...',
      color: 'from-blue-500 to-blue-700',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" /><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" /><path d="M5 17H3v-4l2-5h9l4 5h1a2 2 0 0 1 2 2v2h-2" /><path d="M9 17h6" /></svg>,
    },
    {
      label: 'KRW → MNT',
      value: rates?.wonToMnt ?? '...',
      color: 'from-emerald-500 to-emerald-700',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    },
    {
      label: 'EUR → MNT',
      value: rates?.euroToMnt ? formatNumber(rates.euroToMnt) : '...',
      color: 'from-amber-500 to-amber-700',
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" /></svg>,
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Ерөнхий тойм</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {cards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white/70">{card.label}</span>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">{card.icon}</div>
            </div>
            <p className="text-3xl font-extrabold">{card.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Хурдан үйлдлүүд</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { to: '/smcaradmin/cars', label: 'Машин удирдах', desc: 'Жагсаалт, хайлт' },
          { to: '/smcaradmin/banners', label: 'Баннер нэмэх', desc: 'Зураг оруулах' },
          { to: '/smcaradmin/exchange-rate', label: 'Ханш өөрчлөх', desc: 'KRW, EUR → MNT' },
          { to: '/smcaradmin/settings', label: 'Тохиргоо', desc: 'Сайтын мэдээлэл' },
          { to: '/smcaradmin/fees', label: 'Татвар/Шимтгэл', desc: 'Зардлын тохиргоо' },
          { to: '/smcaradmin/featured', label: 'Онцлох зар', desc: 'Нүүр хуудасны зар' },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{action.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
