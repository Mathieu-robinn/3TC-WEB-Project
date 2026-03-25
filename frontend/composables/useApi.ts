// Centralized API utility for the 24h INSA frontend
// All calls go through this composable which automatically injects the JWT Bearer token

const API_BASE_FALLBACK = 'http://localhost:8000'

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = (config.public?.apiBase as string | undefined) || API_BASE_FALLBACK

  const getHeaders = (): Record<string, string> => {
    const token = useCookie('auth_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token.value) headers['Authorization'] = `Bearer ${token.value}`
    return headers
  }

  const get = <T = any>(path: string): Promise<T> =>
    $fetch<T>(`${apiBase}${path}`, { headers: getHeaders() })

  const post = <T = any>(path: string, body: any): Promise<T> =>
    $fetch<T>(`${apiBase}${path}`, { method: 'POST', headers: getHeaders(), body })

  const put = <T = any>(path: string, body: any): Promise<T> =>
    $fetch<T>(`${apiBase}${path}`, { method: 'PUT', headers: getHeaders(), body })

  const patch = <T = any>(path: string, body: any): Promise<T> =>
    $fetch<T>(`${apiBase}${path}`, { method: 'PATCH', headers: getHeaders(), body })

  const del = <T = any>(path: string): Promise<T> =>
    $fetch<T>(`${apiBase}${path}`, { method: 'DELETE', headers: getHeaders() })

  return { get, post, put, patch, del }
}
