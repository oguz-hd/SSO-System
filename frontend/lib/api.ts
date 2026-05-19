import { getToken, saveSession, clearSession, Session } from './auth'

function parseError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'istek başarısız'
  const d = data as { detail?: string | { msg: string }[] }
  if (typeof d.detail === 'string') return d.detail
  if (Array.isArray(d.detail)) return d.detail.map((x) => x.msg).join(', ')
  return 'istek başarısız'
}

export async function apiFetch(path: string, options: RequestInit = {}, opts?: { noAuthRedirect?: boolean }) {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }
  const res = await fetch(`/api${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !opts?.noAuthRedirect) {
    clearSession()
    if (typeof window !== 'undefined') window.location.href = '/'
    throw new Error('oturum süresi doldu')
  }
  if (!res.ok) throw new Error(parseError(data))
  return data
}

export async function login(username: string, password: string): Promise<Session> {
  const data = await apiFetch(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) },
    { noAuthRedirect: true }
  )
  const session: Session = {
    token: data.token,
    user_id: data.user_id,
    username: data.username,
    role_name: data.role_name,
    role_label: data.role_label,
    permissions: data.permissions,
  }
  saveSession(session)
  return session
}

export async function refreshMe(): Promise<Session> {
  const data = await apiFetch('/auth/me')
  const session: Session = {
    token: data.token,
    user_id: data.user_id,
    username: data.username,
    role_name: data.role_name,
    role_label: data.role_label,
    permissions: data.permissions,
  }
  saveSession(session)
  return session
}

export function apiUpload(path: string, formData: FormData) {
  const token = getToken()
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(parseError(data))
    return data
  })
}
