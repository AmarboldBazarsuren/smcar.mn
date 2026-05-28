/** Encar listing id (e.g. 41699097) — Carapis `listing_id` */
const ENCAR_LISTING_RE = /^\d{6,}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isEncarListingId(id: string | undefined | null): boolean {
  return !!id && ENCAR_LISTING_RE.test(String(id))
}

export function isCarUuid(id: string | undefined | null): boolean {
  return !!id && UUID_RE.test(String(id))
}

/** Public id for URLs — prefer Encar listing number when available */
export function carDetailPublicId(car: { encar_id?: string; id: string }): string {
  const encar = car.encar_id ? String(car.encar_id) : ''
  if (isEncarListingId(encar)) return encar
  return car.id
}

/** Canonical detail path: /cars/detail/41699097 */
export function carDetailPath(car: { encar_id?: string; id: string }): string {
  return `/cars/detail/${carDetailPublicId(car)}`
}

export function carDetailPathFromId(id: string): string {
  if (isEncarListingId(id)) return `/cars/detail/${id}`
  if (isCarUuid(id)) return `/cars/${id}`
  return `/cars/detail/${id}`
}
