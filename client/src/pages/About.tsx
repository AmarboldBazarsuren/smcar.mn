import { Link } from 'react-router-dom'

export default function About() {
  return (
    <main className="bg-white">
      {/* Hero strip */}
      <section className="relative bg-[#1a0608] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 75% 50%, rgba(220,40,40,0.4) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <p className="text-[12px] uppercase tracking-[0.3em] text-red-300 font-semibold mb-3">
            Бидний тухай
          </p>
          <h1 className="text-[36px] md:text-[52px] font-extrabold leading-tight max-w-3xl">
            Somang Trading
          </h1>
          <p className="mt-4 text-[18px] text-red-50/80 max-w-2xl">
            БНСУ-аас Монгол руу автомашин экспортлох албан ёсны худалдаа,
            экспортын компани.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-[1100px] mx-auto px-4 lg:px-8 py-14 lg:py-20">
        <div className="prose prose-lg max-w-none">
          <p className="text-[17px] text-gray-700 leading-relaxed">
            <strong className="text-gray-900">Somang Trading</strong> нь БНСУ-аас Монгол руу
            автомашин экспортлох чиглэлээр ажилладаг албан ёсны худалдаа,
            экспортын компани юм.
          </p>
          <p className="text-[17px] text-gray-700 leading-relaxed mt-5">
            Бид Солонгосын найдвартай дуудлага худалдаа, дилерийн сувгуудаас
            автомашин сонгон, худалдан авалт, шалгалт, бичиг баримт, гааль,
            тээвэрлэлтийн бүх процессыг мэргэжлийн түвшинд зохион байгуулдаг.
          </p>
          <p className="text-[17px] text-gray-700 leading-relaxed mt-5">
            Манай зорилго бол харилцагч бүрт <strong className="text-gray-900">үнэн зөв мэдээлэл</strong>,
            <strong className="text-gray-900"> ил тод үнэ</strong>, <strong className="text-gray-900">найдвартай үйлчилгээ</strong> хүргэх явдал юм.
          </p>
        </div>

        {/* Services grid */}
        <div className="mt-14">
          <h2 className="text-[26px] font-bold text-gray-900 mb-6">Манай үйлчилгээ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🚗', title: 'Солонгос автомашин захиалга', desc: 'Encar, KJ-cars, бусад дилер, дуудлагаас захиалга авна.' },
              { icon: '🔍', title: 'Машины бодит шалгалт', desc: 'Худалдан авахаас өмнө газар дээр нь шалгаж зурагтай мэдээлэл өгнө.' },
              { icon: '📄', title: 'Экспортын бичиг баримт', desc: 'Гэрээ, гаалийн бүх бичиг баримтыг бид бэлдэнэ.' },
              { icon: '🚢', title: 'Контейнер болон Ro-Ro тээвэр', desc: 'Аюулгүй, найдвартай тээврийн сонголтоор Монгол хүртэл хүргэнэ.' },
              { icon: '🤝', title: 'Монгол харилцагчдад зөвлөгөө', desc: 'Сонголт, үнэ, хугацааны талаар хэдийд ч асууж зөвлөгөө авна.' },
            ].map((s) => (
              <div key={s.title} className="bg-gray-50 hover:bg-red-50/40 border border-gray-200 hover:border-red-200 rounded-2xl p-5 transition">
                <div className="text-[28px] mb-2">{s.icon}</div>
                <h3 className="text-[18px] font-bold text-gray-900">{s.title}</h3>
                <p className="text-[14.5px] text-gray-600 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Promise box */}
        <div className="mt-14 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 lg:p-10 text-white">
          <p className="text-[15px] uppercase tracking-[0.2em] text-red-200 font-semibold mb-2">
            Бидний амлалт
          </p>
          <h3 className="text-[26px] md:text-[32px] font-extrabold leading-tight max-w-2xl">
            Итгэлтэй сонголт, найдвартай экспорт.
          </h3>
          <p className="mt-3 text-[16px] text-red-50/90 max-w-2xl leading-relaxed">
            Solongoсын зах зээлээс эх үндэстэйгээр сонгож, шалгаад, аюулгүй хүргэнэ.
            Захиалга хүлээж авахаас эхлээд автомашин танд хүрэх хүртэлх бүх алхамд
            бид хариуцлагатай.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="tel:+821056576492" className="block bg-white border border-gray-200 hover:border-red-300 hover:shadow-md rounded-2xl p-5 transition">
            <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-1">Солонгос утас</p>
            <p className="text-[20px] font-bold text-gray-900">+82 10-5657-6492</p>
          </a>
          <a href="tel:+821023396492" className="block bg-white border border-gray-200 hover:border-red-300 hover:shadow-md rounded-2xl p-5 transition">
            <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-1">Солонгос утас</p>
            <p className="text-[20px] font-bold text-gray-900">+82 10-2339-6492</p>
          </a>
          <a href="tel:+97672105633" className="block bg-white border border-gray-200 hover:border-red-300 hover:shadow-md rounded-2xl p-5 transition">
            <p className="text-[12px] uppercase tracking-wider text-gray-500 mb-1">Монгол утас</p>
            <p className="text-[20px] font-bold text-gray-900">+976 7210-5633</p>
          </a>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-full transition"
          >
            Машинууд үзэх →
          </Link>
        </div>
      </section>
    </main>
  )
}
