import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="SMCar.mn" className="h-12" />
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Солонгосоос шууд автомашин захиалах Монголын платформ
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3">Цэс</h4>
            <ul className="space-y-2">
              {[{ to: '/', label: 'Нүүр' }, { to: '/cars', label: 'Бүх машин' }].map((l) => (
                <li key={l.to}><Link to={l.to} className="text-[13px] text-gray-500 hover:text-dark transition">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3">Брэнд</h4>
            <ul className="space-y-2">
              {['Toyota', 'BMW', 'Hyundai', 'Kia', 'Mercedes'].map((b) => (
                <li key={b}><Link to={`/cars?brand=${b}`} className="text-[13px] text-gray-500 hover:text-dark transition">{b}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3">Холбоо барих</h4>
            <ul className="space-y-2 text-[13px] text-gray-500">
              <li>+976 7722-0707</li>
              <li>info@smcar.mn</li>
              <li>Улаанбаатар, Монгол</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
          <p className="text-[11px] text-gray-400">&copy; {new Date().getFullYear()} SMCar.mn</p>
        </div>
      </div>
    </footer>
  )
}
