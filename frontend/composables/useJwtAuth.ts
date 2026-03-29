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
  const isAdmin = computed(() => roleFromToken.value === 'ADMIN')

  return { token, payload, roleFromToken, isAdmin }
}
