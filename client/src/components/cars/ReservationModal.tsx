interface Props {
  carId: string
  carTitle?: string
  onClose: () => void
}

const FB_PAGE = 'https://www.facebook.com/profile.php?id=61560313482250'

export default function ReservationModal({ carId, carTitle, onClose }: Props) {
  const carUrl = `${window.location.origin}/cars/${carId}`
  const message = `Сайн байна уу! Дараах машинд сонирхож байна:\n${carTitle || ''}\n${carUrl}`
  const encodedMessage = encodeURIComponent(message)

  // Messenger link
  const messengerUrl = `https://m.me/61560313482250?text=${encodedMessage}`
  // Facebook link with message
  const fbUrl = FB_PAGE

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-xl w-full max-w-sm shadow-2xl fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-dark">Захиалга өгөх</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-dark transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-[13px] text-gray-600 mb-4">
            Доорх сувгуудаар бидэнтэй холбогдоно уу. Машины мэдээлэл автоматаар илгээгдэнэ.
          </p>

          {/* Messenger */}
          <a
            href={messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.434 5.503 3.678 7.2V22l3.378-1.852c.9.25 1.855.384 2.944.384 5.523 0 10-4.145 10-9.243S17.523 2 12 2zm.994 12.468-2.547-2.72-4.97 2.72 5.47-5.808 2.61 2.72 4.907-2.72-5.47 5.808z"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-dark group-hover:text-blue-600 transition">Messenger</p>
              <p className="text-[11px] text-gray-400">Facebook Messenger-ээр бичих</p>
            </div>
          </a>

          {/* Facebook */}
          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-dark group-hover:text-blue-600 transition">Facebook</p>
              <p className="text-[11px] text-gray-400">Facebook хуудас руу очих</p>
            </div>
          </a>

          {/* Phone */}
          <a
            href="tel:+97677220707"
            className="flex items-center gap-3 w-full p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition group"
          >
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-dark group-hover:text-gray-700 transition">+976 7722-0707</p>
              <p className="text-[11px] text-gray-400">Утсаар холбогдох</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
