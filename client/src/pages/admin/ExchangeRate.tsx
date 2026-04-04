import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchExchangeRate, updateExchangeRate } from '../../lib/api'

export default function ExchangeRatePage() {
  const queryClient = useQueryClient()
  const { data: rates, isLoading } = useQuery({ queryKey: ['exchangeRate'], queryFn: fetchExchangeRate })

  const [wonToMnt, setWonToMnt] = useState(0)
  const [euroToMnt, setEuroToMnt] = useState(0)
  const [usdToMnt, setUsdToMnt] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (rates) { setWonToMnt(rates.wonToMnt); setEuroToMnt(rates.euroToMnt); setUsdToMnt(rates.usdToMnt || 3450) }
  }, [rates])

  const mutation = useMutation({
    mutationFn: () => updateExchangeRate({ wonToMnt, euroToMnt, usdToMnt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRate'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  const inputClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Ханш тохиргоо</h1>
        <p className="text-sm text-gray-500 mt-1">KRW, EUR, USD → MNT ханшийн тохиргоо</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">1 KRW = MNT</label>
            <input type="number" step="0.01" value={wonToMnt} onChange={(e) => setWonToMnt(Number(e.target.value))} className={inputClass} />
            <p className="text-xs text-gray-500 mt-1.5">Жишээ: 2.8</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">1 EUR = MNT</label>
            <input type="number" step="1" value={euroToMnt} onChange={(e) => setEuroToMnt(Number(e.target.value))} className={inputClass} />
            <p className="text-xs text-gray-500 mt-1.5">Жишээ: 3800</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">1 USD = MNT</label>
            <input type="number" step="1" value={usdToMnt} onChange={(e) => setUsdToMnt(Number(e.target.value))} className={inputClass} />
            <p className="text-xs text-gray-500 mt-1.5">Гаалийн татвар тооцоолоход ашиглана. Жишээ: 3450</p>
          </div>

          {rates?.updatedAt && (
            <p className="text-xs text-gray-500">Сүүлд: {new Date(rates.updatedAt).toLocaleString('mn-MN')}</p>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {mutation.isPending ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            {saved && <span className="text-sm text-green-500 font-medium">Амжилттай!</span>}
          </div>
        </form>
      </div>
    </div>
  )
}
