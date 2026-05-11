import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-700">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Left: Logo + Description + CTAs */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/logo2.png" alt="Somang Trading" className="h-12" />
              <span className="text-[20px] font-bold tracking-tight text-gray-900">
                Somang Trading
              </span>
            </Link>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
              БНСУ-аас Монгол руу автомашин экспортлох албан ёсны худалдааны компани.
              Сонголт, шалгалт, бичиг баримт, тээвэр, гааль — бүхнийг мэргэжлийн түвшинд.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/cars"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-[15px] font-semibold px-5 py-2.5 rounded-full transition"
              >
                Машин үзэх
              </Link>
              <a
                href="tel:+97672105633"
                className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-800 text-[15px] font-medium px-5 py-2.5 rounded-full transition"
              >
                7210-5633
              </a>
            </div>
          </div>

          {/* Middle: Useful links */}
          <div className="md:col-span-4 md:pl-6">
            <h4 className="text-[16px] font-bold text-gray-900 mb-5">
              Хэрэгтэй холбоосууд
            </h4>
            <ul className="space-y-3 text-[15px]">
              <li>
                <Link to="/" className="text-gray-600 hover:text-primary transition">
                  Нүүр хуудас
                </Link>
              </li>
              <li>
                <Link to="/cars" className="text-gray-600 hover:text-primary transition">
                  Машинууд үзэх
                </Link>
              </li>
              <li>
                <Link to="/cars?vehicleType=special" className="text-gray-600 hover:text-primary transition">
                  Тусгай ангилал
                </Link>
              </li>
              <li>
                <Link to="/cars?sortBy=scraped_at&sortOrder=desc" className="text-gray-600 hover:text-primary transition">
                  Сүүлд нэмэгдсэн
                </Link>
              </li>
              <li>
                <a href="tel:+97672105633" className="text-gray-600 hover:text-primary transition">
                  Холбоо барих
                </a>
              </li>
            </ul>
          </div>

          {/* Right: Contact */}
          <div className="md:col-span-4">
            <h4 className="text-[16px] font-bold text-gray-900 mb-5">
              Бидэнтэй холбоо барих
            </h4>
            <ul className="space-y-3 text-[15px] text-gray-600">
              <li>
                <span className="text-gray-500">Солонгос утас: </span>
                <a href="tel:+821056576492" className="text-gray-800 hover:text-primary transition">
                  +82 10-5657-6492
                </a>
              </li>
              <li>
                <span className="text-gray-500">Солонгос утас: </span>
                <a href="tel:+821023396492" className="text-gray-800 hover:text-primary transition">
                  +82 10-2339-6492
                </a>
              </li>
              <li>
                <span className="text-gray-500">Монгол утас: </span>
                <a href="tel:+97672105633" className="text-gray-800 hover:text-primary transition">
                  +976 7210-5633
                </a>
              </li>
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="#"
                aria-label="Facebook"
                className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-[#1877F2] transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 group-hover:text-white transition">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="group inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gradient-to-br hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 group-hover:text-white transition">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[13px] text-gray-500">
            &copy; {new Date().getFullYear()} Somang Trading. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <p className="text-[13px] text-gray-500">
            БНСУ-аас Монгол руу автомашин экспортлох үйлчилгээ
          </p>
        </div>
      </div>
    </footer>
  )
}
