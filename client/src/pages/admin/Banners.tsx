import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBanners, createBanner, deleteBanner, updateBanner } from '../../lib/api'
import type { Banner } from '../../types'

export default function Banners() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const { data: banners, isLoading } = useQuery({ queryKey: ['banners'], queryFn: fetchBanners })

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Баннер удирдах</h1>
          <p className="text-lg text-gray-500 mt-1">Сайтын баннер зургууд</p>
        </div>
        <button
          onClick={() => { setEditingBanner(null); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" /></svg>
          Баннер нэмэх
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {banners?.map((banner) => (
            <div key={banner._id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-5">
              <img src={banner.imageUrl} alt={banner.title} className="w-28 h-20 object-cover rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg">{banner.title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-base bg-gray-50 px-2.5 py-1 rounded-lg text-gray-500">{banner.position}</span>
                  <span className="text-base text-gray-500">#{banner.order}</span>
                  <span className={`text-base px-2.5 py-1 rounded-lg font-medium ${banner.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setEditingBanner(banner); setShowForm(true) }} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-300 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                </button>
                <button onClick={() => { if (confirm('Устгах уу?')) deleteMutation.mutate(banner._id) }} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
          {banners?.length === 0 && (
            <div className="text-center py-12 text-gray-500">Баннер байхгүй байна</div>
          )}
        </div>
      )}

      {showForm && <BannerForm banner={editingBanner} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function BannerForm({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(banner?.title ?? '')
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '')
  const [position, setPosition] = useState(banner?.position ?? 'home_top')
  const [order, setOrder] = useState(banner?.order ?? 0)
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData()
    formData.append('title', title)
    formData.append('linkUrl', linkUrl)
    formData.append('position', position)
    formData.append('order', String(order))
    if (file) formData.append('image', file)
    try {
      if (banner) { await updateBanner(banner._id, formData) } else { await createBanner(formData) }
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      onClose()
    } catch { alert('Алдаа гарлаа') } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold">{banner ? 'Баннер засах' : 'Баннер нэмэх'}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-900 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Гарчиг</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Зураг</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium file:text-lg hover:file:bg-blue-100" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Холбоос</label>
            <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Позиц</label>
              <select value={position} onChange={(e) => setPosition(e.target.value as Banner['position'])} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="home_top">Нүүр дээр</option>
                <option value="home_middle">Нүүр дунд</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Дараалал</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold transition disabled:opacity-50">
              {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 py-3 rounded-xl text-lg font-medium text-gray-600 hover:bg-gray-50 transition">
              Болих
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
