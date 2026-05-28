import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchCarFull } from '../../lib/api'
import { carDetailPath, isCarUuid } from '../../lib/carRoutes'

/**
 * /cars/:uuid → /cars/detail/:encarListingId when Encar id is known.
 */
export default function CarDetailCanonicalRedirect({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const onLegacyPath = location.pathname.startsWith('/cars/') && !location.pathname.startsWith('/cars/detail/')

  const { data: car, isSuccess } = useQuery({
    queryKey: ['car', id],
    queryFn: () => fetchCarFull(id!),
    enabled: !!id && onLegacyPath && isCarUuid(id),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!onLegacyPath || !id || !isCarUuid(id) || !isSuccess || !car) return
    const target = carDetailPath(car)
    if (target !== location.pathname) {
      navigate(target, { replace: true })
    }
  }, [onLegacyPath, id, isSuccess, car, location.pathname, navigate])

  return <>{children}</>
}
