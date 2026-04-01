export type JwtPayload = {
  sub?: number
  email?: string
  role?: string
  exp?: number
  iat?: number
}

function decodeBase64Url(segment: string): string {
  let base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  if (import.meta.server) {
    return Buffer.from(base64, 'base64').toString('utf8')
  }
  return atob(base64)
}

export function parseJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtPayload
  } catch {
    return null
  }
}

export function useJwtAuth() {
  const token = useCookie('auth_token')
  const payload = computed(() => parseJwtPayload(token.value ?? undefined))
  const roleFromToken = computed(() => payload.value?.role ?? null)
  const isAdmin = computed(() => roleFromToken.value === 'ADMIN' || roleFromToken.value === 'SUPER_ADMIN')
  const isSuperAdmin = computed(() => roleFromToken.value === 'SUPER_ADMIN')

  /** ID utilisateur (claim JWT `sub`), pour masquer la suppression de son propre compte côté UI. */
  const currentUserId = computed((): number | null => {
    const raw = payload.value?.sub
    if (raw === undefined || raw === null) return null
    const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  })

  return { token, payload, roleFromToken, isAdmin, isSuperAdmin, currentUserId }
}
