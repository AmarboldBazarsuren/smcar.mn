import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFeeSettings, updateFeeSettings } from '../../lib/api'

export default function FeeSettingsPage() {
  const queryClient = useQueryClient()
  const { data: fees, isLoading } = useQuery({ queryKey: ['feeSettings'], queryFn: fetchFeeSettings })

  const [form, setForm] = useState({ serviceFee: 700000, transportFee: 2500000, specialTax: 5, customsVat: 13 })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (fees) {
      setForm({
        serviceFee: fees.serviceFee,
        transportFee: fees.transportFee,
        specialTax: fees.specialTax,
        customsVat: fees.customsVat,
      })
    }
  }, [fees])

  const mutation = useMutation({
    mutationFn: () => updateFeeSettings(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feeSettings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Татвар / Шимтгэл тохиргоо</h1>
        <p className="text-sm text-gray-500 mt-1">Машины үнэ дээр нэмэгдэх татвар, шимтгэлийн тохиргоо</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Үйлчилгээний шимтгэл (₩)
            </label>
            <input
              type="number"
              value={form.serviceFee}
              onChange={(e) => setForm({ ...form, serviceFee: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1.5">Жишээ: 700,000₩</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Тээврийн зардал (₩)
            </label>
            <input
              type="number"
              value={form.transportFee}
              onChange={(e) => setForm({ ...form, transportFee: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1.5">Солонгосоос Монгол хүртэлх тээврийн зардал</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Онцгой албан татвар (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.specialTax}
              onChange={(e) => setForm({ ...form, specialTax: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1.5">Жишээ: 5%</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Гаалийн татвар / НӨАТ (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.customsVat}
              onChange={(e) => setForm({ ...form, customsVat: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1.5">Жишээ: 13%</p>
          </div>

          {fees?.updatedAt && (
            <p className="text-xs text-gray-500">
              Сүүлд: {new Date(fees.updatedAt).toLocaleString('mn-MN')}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {mutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            {saved && <span className="text-sm text-green-500 font-medium animate-fade-in-up">Амжилттай!</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
