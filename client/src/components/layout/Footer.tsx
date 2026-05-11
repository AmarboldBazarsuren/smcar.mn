import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#1a0608] text-gray-300 border-t border-red-900/30">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand + Description + CTAs */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo2.png" alt="Somang Trading" className="h-12" />
              <span className="text-[20px] font-bold tracking-tight text-white">
                Somang Trading
              </span>
            </Link>
            <p className="text-[15px] text-red-50/65 leading-relaxed mb-6">
              БНСУ-аас Монгол руу автомашин экспортлох албан ёсны худалдааны компани.
              Сонголтоос хүргэлт хүртэлх бүх алхамд бид хариуцлагатай.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-[15px] font-semibold px-5 py-2.5 rounded-full transition"
              >
                Машин үзэх
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 border border-white/25 hover:border-white/50 text-white text-[15px] font-medium px-5 py-2.5 rounded-full transition"
              >
                Бидний тухай
              </Link>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61560313482250" target="_blank" rel="noopener noreferrer"
                aria-label="Facebook"
                className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-[#1877F2] transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61560313482250" target="_blank" rel="noopener noreferrer"
                aria-label="Instagram"
                className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-gradient-to-br hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>

          {/* Хуудаснууд */}
          <div className="md:col-span-2 md:pl-4">
            <h4 className="text-[16px] font-bold text-white mb-5">Хуудаснууд</h4>
            <ul className="space-y-3 text-[15px]">
              <li><Link to="/" className="text-red-50/65 hover:text-white transition">Нүүр</Link></li>
              <li><Link to="/cars" className="text-red-50/65 hover:text-white transition">Машинууд</Link></li>
              <li><Link to="/about" className="text-red-50/65 hover:text-white transition">Бидний тухай</Link></li>
            </ul>
          </div>

          {/* Үйлчилгээ */}
          <div className="md:col-span-3">
            <h4 className="text-[16px] font-bold text-white mb-5">Үйлчилгээ</h4>
            <ul className="space-y-3 text-[15px] text-red-50/65">
              <li>Машин захиалга</li>
              <li>Бодит шалгалт</li>
              <li>Экспортын бичиг баримт</li>
              <li>Контейнер / Ro-Ro тээвэр</li>
              <li>Гааль, шилжүүлгийн зөвлөгөө</li>
            </ul>
          </div>

          {/* Холбоо барих */}
          <div className="md:col-span-3">
            <h4 className="text-[16px] font-bold text-white mb-5">Холбоо барих</h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <span className="text-red-50/55 text-[13px] block">Солонгос утас</span>
                <a href="tel:+821056576492" className="text-white hover:text-red-300 transition block">
                  +82 10-5657-6492
                </a>
                <a href="tel:+821023396492" className="text-white hover:text-red-300 transition block">
                  +82 10-2339-6492
                </a>
              </li>
              <li>
                <span className="text-red-50/55 text-[13px] block">Монгол утас</span>
                <a href="tel:+97672105633" className="text-white hover:text-red-300 transition">
                  +976 7210-5633
                </a>
              </li>
              <li className="text-red-50/55 text-[13px] pt-1">
                Ажиллах цаг: Дав–Ням 09:00–20:00
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[13px] text-red-50/50">
            &copy; {new Date().getFullYear()} Somang Trading. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-[13px] text-red-50/50">
            Итгэлтэй сонголт · найдвартай экспорт
          </p>
        </div>
      </div>
    </footer>
  )
}
