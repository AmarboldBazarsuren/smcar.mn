import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSettings, updateSettings } from '../../lib/api'

export default function Settings() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['settings'], queryFn: fetchSettings })

  const [form, setForm] = useState({ siteName: '', phone: '', email: '', address: '', facebook: '', instagram: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName || '', phone: settings.phone || '', email: settings.email || '',
        address: settings.address || '', facebook: settings.socialLinks?.facebook || '', instagram: settings.socialLinks?.instagram || '',
      })
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: () => updateSettings({
      siteName: form.siteName, phone: form.phone, email: form.email, address: form.address,
      socialLinks: { facebook: form.facebook, instagram: form.instagram },
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Сайтын тохиргоо</h1>
        <p className="text-lg text-gray-500 mt-1">Сайтын ерөнхий мэдээлэл</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-5">
          <div>
            <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-2">Сайтын нэр</label>
            <input type="text" value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-2">Утас</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-2">И-мэйл</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-base font-semibold text-gray-600 uppercase tracking-wider mb-2">Хаяг</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <p className="text-base font-semibold text-gray-600 uppercase tracking-wider mb-4">Сошиал холбоосууд</p>
            <div className="space-y-4">
              <div>
                <label className="block text-base text-gray-500 mb-1.5">Facebook</label>
                <input type="url" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} className={inputClass} placeholder="https://facebook.com/..." />
              </div>
              <div>
                <label className="block text-base text-gray-500 mb-1.5">Instagram</label>
                <input type="url" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="https://instagram.com/..." />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold transition shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {mutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            {saved && <span className="text-lg text-green-500 font-medium animate-fade-in-up">Амжилттай!</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
