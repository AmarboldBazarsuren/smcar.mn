import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 text-gray-300">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Бидний тухай */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo2.png" alt="Somang Trading" className="h-12" />
              <span className="text-[20px] font-bold text-white">Somang Trading</span>
            </div>
            <p className="text-[15px] text-gray-400 leading-relaxed mb-3">
              <span className="text-white font-semibold">Somang Trading</span> нь БНСУ-аас Монгол руу автомашин экспортлох
              чиглэлээр ажилладаг албан ёсны худалдаа, экспортын компани юм.
            </p>
            <p className="text-[15px] text-gray-400 leading-relaxed mb-3">
              Бид Солонгосын найдвартай дуудлага худалдаа, дилерийн сувгуудаас автомашин сонгон,
              худалдан авалт, шалгалт, бичиг баримт, гааль, тээвэрлэлтийн бүх процессыг
              мэргэжлийн түвшинд зохион байгуулдаг.
            </p>
            <p className="text-[15px] text-gray-400 leading-relaxed">
              Манай зорилго бол харилцагч бүрт үнэн зөв мэдээлэл, ил тод үнэ,
              найдвартай үйлчилгээ хүргэх явдал юм.
            </p>
            <p className="mt-4 text-[15px] font-semibold text-white">
              Somang Trading — Итгэлтэй сонголт, найдвартай экспорт.
            </p>
          </div>

          {/* Манай үйлчилгээ */}
          <div className="md:col-span-3">
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              Манай үйлчилгээ
            </h4>
            <ul className="space-y-2.5 text-[15px] text-gray-400">
              <li className="flex items-start gap-2">
                <span>🚗</span><span>Солонгос автомашин захиалга</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🔍</span><span>Машины бодит шалгалт, мэдээлэл</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📄</span><span>Экспортын бичиг баримт</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🚢</span><span>Контейнер болон Ro-Ro тээвэр</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🤝</span><span>Монгол харилцагчдад зориулсан зөвлөгөө</span>
              </li>
            </ul>
          </div>

          {/* Холбоо барих */}
          <div className="md:col-span-4">
            <h4 className="text-[14px] font-bold text-white uppercase tracking-wider mb-4">
              Холбоо барих
            </h4>
            <div className="space-y-3 text-[15px]">
              <div>
                <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Солонгос утас</p>
                <a href="tel:+821056576492" className="block text-gray-300 hover:text-white transition">
                  +82 10-5657-6492
                </a>
                <a href="tel:+821023396492" className="block text-gray-300 hover:text-white transition">
                  +82 10-2339-6492
                </a>
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase tracking-wide mb-1">Монгол утас</p>
                <a href="tel:+97672105633" className="block text-gray-300 hover:text-white transition">
                  +976 7210-5633
                </a>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-pink-500 flex items-center justify-center transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[13px] text-gray-500">
            &copy; {new Date().getFullYear()} Somang Trading. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <div className="flex items-center gap-4 text-[13px]">
            <Link to="/" className="text-gray-500 hover:text-white transition">Нүүр</Link>
            <Link to="/cars" className="text-gray-500 hover:text-white transition">Машинууд</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
