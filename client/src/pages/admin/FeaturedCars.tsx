import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchFeaturedCars, setFeaturedCar, removeFeaturedCar, fetchCarFull, getImageUrl } from '../../lib/api'

export default function FeaturedCarsPage() {
  const queryClient = useQueryClient()
  const { data: featured } = useQuery({ queryKey: ['featuredCars'], queryFn: fetchFeaturedCars })

  const [heroId, setHeroId] = useState('')
  const [middleId, setMiddleId] = useState('')
  const [saved, setSaved] = useState('')

  const heroFeatured = featured?.find((f) => f.position === 'hero')
  const middleFeatured = featured?.find((f) => f.position === 'middle')

  // Preview queries
  const { data: heroCar } = useQuery({
    queryKey: ['car', heroFeatured?.carId],
    queryFn: () => fetchCarFull(heroFeatured!.carId),
    enabled: !!heroFeatured?.carId,
  })
  const { data: middleCar } = useQuery({
    queryKey: ['car', middleFeatured?.carId],
    queryFn: () => fetchCarFull(middleFeatured!.carId),
    enabled: !!middleFeatured?.carId,
  })

  const heroMutation = useMutation({
    mutationFn: (carId: string) => setFeaturedCar(carId, 'hero'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredCars'] })
      setSaved('hero')
      setHeroId('')
      setTimeout(() => setSaved(''), 3000)
    },
  })

  const middleMutation = useMutation({
    mutationFn: (carId: string) => setFeaturedCar(carId, 'middle'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featuredCars'] })
      setSaved('middle')
      setMiddleId('')
      setTimeout(() => setSaved(''), 3000)
    },
  })

  const removeMutation = useMutation({
    mutationFn: (position: string) => removeFeaturedCar(position),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['featuredCars'] }),
  })

  const inputClass = "flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Онцлох зар</h1>
        <p className="text-lg text-gray-500 mt-1">Нүүр хуудасны онцлох машинуудыг тохируулах</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Hero featured */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Hero онцлох зар</h2>
          <p className="text-base text-gray-500 mb-4">Нүүр хуудасны дээд хэсэгт гарах машин</p>

          {heroCar && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <img src={getImageUrl(heroCar.image)} alt="" className="w-16 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold truncate">{heroCar.title}</p>
                <p className="text-base text-gray-500">ID: {heroFeatured?.carId}</p>
              </div>
              <button
                onClick={() => removeMutation.mutate('hero')}
                className="text-base text-red-500 hover:text-red-700 font-medium"
              >
                Устгах
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (heroId.trim()) heroMutation.mutate(heroId.trim())
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Машины ID оруулах (жишээ: 41760027)"
              value={heroId}
              onChange={(e) => setHeroId(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={heroMutation.isPending || !heroId.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-lg font-semibold disabled:opacity-50 transition"
            >
              Хадгалах
            </button>
          </form>
          {saved === 'hero' && <p className="text-lg text-green-500 font-medium mt-2">Амжилттай!</p>}
        </div>

        {/* Middle featured */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Голын онцлох зар</h2>
          <p className="text-base text-gray-500 mb-4">Сүүлд нэмэгдсэн болон Mercedes хоорондох зар</p>

          {middleCar && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
              <img src={getImageUrl(middleCar.image)} alt="" className="w-16 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold truncate">{middleCar.title}</p>
                <p className="text-base text-gray-500">ID: {middleFeatured?.carId}</p>
              </div>
              <button
                onClick={() => removeMutation.mutate('middle')}
                className="text-base text-red-500 hover:text-red-700 font-medium"
              >
                Устгах
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (middleId.trim()) middleMutation.mutate(middleId.trim())
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Машины ID оруулах (жишээ: 41760027)"
              value={middleId}
              onChange={(e) => setMiddleId(e.target.value)}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={middleMutation.isPending || !middleId.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-lg font-semibold disabled:opacity-50 transition"
            >
              Хадгалах
            </button>
          </form>
          {saved === 'middle' && <p className="text-lg text-green-500 font-medium mt-2">Амжилттай!</p>}
        </div>
      </div>
    </div>
  )
}
