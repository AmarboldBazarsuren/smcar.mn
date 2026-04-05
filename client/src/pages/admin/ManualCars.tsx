import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchManualCars, createManualCar, updateManualCar, deleteManualCar, fetchStorageInfo } from '../../lib/api'
import { formatNumber } from '../../lib/utils'

interface CarForm {
  title: string; brand: string; model: string; year: number
  price: string; mileage: string; fuelType: string; transmission: string
  cc: string; color: string; body_type: string; description: string
}

const emptyForm: CarForm = {
  title: '', brand: '', model: '', year: new Date().getFullYear(),
  price: '', mileage: '', fuelType: 'Gasoline', transmission: 'Auto',
  cc: '', color: '', body_type: '', description: '',
}

export default function ManualCarsPage() {
  const queryClient = useQueryClient()
  const { data: cars } = useQuery({ queryKey: ['manualCars'], queryFn: fetchManualCars })
  const { data: storage } = useQuery({ queryKey: ['storage'], queryFn: fetchStorageInfo })
  const [editingCar, setEditingCar] = useState<any>(null) // null=хаалттай, 'new'=шинэ, object=засах
  const [showForm, setShowForm] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['manualCars'] })
    queryClient.invalidateQueries({ queryKey: ['storage'] })
  }

  const deleteMut = useMutation({ mutationFn: deleteManualCar, onSuccess: invalidate })

  const openNew = () => { setEditingCar(null); setShowForm(true) }
  const openEdit = (car: any) => { setEditingCar(car); setShowForm(true) }
  const closeForm = () => { setEditingCar(null); setShowForm(false) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Машин нэмэх</h1>
          <p className="text-lg text-gray-500 mt-1">Монголд байгаа машины зар оруулах</p>
        </div>
        <div className="flex items-center gap-4">
          {storage && (
            <div className="text-right text-base text-gray-500">
              <p>{storage.fileCount} зураг</p>
              <p className="font-semibold">{storage.totalSizeMB} MB</p>
            </div>
          )}
          <button onClick={showForm ? closeForm : openNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-lg font-semibold transition">
            {showForm ? 'Хаах' : '+ Машин нэмэх'}
          </button>
        </div>
      </div>

      {showForm && (
        <CarFormComponent
          car={editingCar}
          onSuccess={() => { closeForm(); invalidate() }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {cars?.map((car: any) => (
          <div key={car._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {car.images?.[0] ? (
              <img src={car.images[0]} alt="" className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              </div>
            )}
            <div className="p-4">
              <p className="font-semibold text-lg truncate">{car.title}</p>
              <p className="text-base text-gray-500 mt-1">{car.brand} · {car.year}</p>
              <p className="text-lg font-bold text-blue-600 mt-1">{formatNumber(car.price)}₮</p>
              <div className="flex items-center gap-3 mt-3">
                <button onClick={() => openEdit(car)} className="text-base text-blue-600 hover:text-blue-800 font-medium">Засах</button>
                <button onClick={() => { if (confirm('Устгах уу?')) deleteMut.mutate(car._id) }} className="text-base text-red-500 hover:text-red-700 font-medium">Устгах</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CarFormComponent({ car, onSuccess }: { car: any; onSuccess: () => void }) {
  const isEdit = !!car
  const [form, setForm] = useState<CarForm>(
    isEdit
      ? { title: car.title, brand: car.brand, model: car.model || '', year: car.year, price: String(car.price), mileage: String(car.mileage || ''), fuelType: car.fuelType || 'Gasoline', transmission: car.transmission || 'Auto', cc: String(car.cc || ''), color: car.color || '', body_type: car.body_type || '', description: car.description || '' }
      : { ...emptyForm }
  )
  const [existingImages, setExistingImages] = useState<string[]>(isEdit ? car.images || [] : [])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewFiles((prev) => [...prev, ...files])
    const previews = files.map((f) => URL.createObjectURL(f))
    setNewPreviews((prev) => [...prev, ...previews])
  }

  const removeExisting = (img: string) => {
    setExistingImages((prev) => prev.filter((i) => i !== img))
  }

  const removeNew = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx])
    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== undefined) fd.append(k, String(v)) })
      for (const f of newFiles) fd.append('images', f)
      if (isEdit) {
        fd.append('keepImages', JSON.stringify(existingImages))
        await updateManualCar(car._id, fd)
      } else {
        await createManualCar(fd)
      }
      onSuccess()
    } catch {
      alert('Алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
  const allImages = [...existingImages.map((src) => ({ type: 'existing' as const, src })), ...newPreviews.map((src, i) => ({ type: 'new' as const, src, idx: i }))]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{isEdit ? 'Зар засах' : 'Шинэ зар нэмэх'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Гарчиг *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="2024 BMW X5 M Sport" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Брэнд *</label>
            <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} placeholder="BMW" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Загвар</label>
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} placeholder="X5" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Он *</label>
            <input type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Үнэ (₮) *</label>
            <input type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="65000000" />
            <p className="text-[14px] text-gray-400 mt-0.5">Монгол төгрөгөөр оруулна</p>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Гүйлт (км)</label>
            <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} className={inputClass} placeholder="50000" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">CC</label>
            <input type="number" value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })} className={inputClass} placeholder="2000" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Түлш</label>
            <select value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })} className={inputClass}>
              <option value="Gasoline">Бензин</option><option value="Diesel">Дизель</option><option value="Electric">Цахилгаан</option><option value="Hybrid">Хайбрид</option><option value="LPG">Газ</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Хурдны хайрцаг</label>
            <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={inputClass}>
              <option value="Auto">Автомат</option><option value="Manual">Механик</option>
            </select>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Өнгө</label>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className={inputClass} placeholder="Black" />
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 mb-1">Төрөл</label>
            <input value={form.body_type} onChange={(e) => setForm({ ...form, body_type: e.target.value })} className={inputClass} placeholder="SUV" />
          </div>
        </div>
        <div>
          <label className="block text-base font-semibold text-gray-600 mb-1">Тайлбар</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} rows={3} />
        </div>

        {/* Image upload area */}
        <div>
          <label className="block text-base font-semibold text-gray-600 mb-2">Зурагнууд</label>

          {/* Preview grid */}
          {allImages.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              {allImages.map((img, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => img.type === 'existing' ? removeExisting(img.src) : removeNew(img.idx!)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[14px] opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span className="text-base text-gray-500 mt-2">Зураг сонгох (10 хүртэл)</span>
            <span className="text-[14px] text-gray-400">JPG, PNG, WebP</span>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold disabled:opacity-50 transition">
            {loading ? 'Хадгалж байна...' : isEdit ? 'Өөрчлөлт хадгалах' : 'Хадгалах'}
          </button>
        </div>
      </form>
    </div>
  )
}
