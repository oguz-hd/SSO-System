export type Permission = {
  screen: string
  label?: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
  allowed_extensions?: string[]
}

export type Session = {
  token: string
  user_id: number
  username: string
  role_name: string
  role_label: string
  permissions: Permission[]
}

const TOKEN_KEY = 'authToken'
const SESSION_KEY = 'userSession'

export function saveSession(session: Session) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  localStorage.setItem('userRole', session.role_name)
  document.cookie = `authToken=${session.token}; path=/; max-age=86400; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('userRole')
  document.cookie = 'authToken=; path=/; max-age=0'
}

export function hasScreen(screen: string): boolean {
  const s = getSession()
  return s?.permissions?.some((p) => p.screen === screen && p.can_read) ?? false
}

export function canWriteScreen(screen: string): boolean {
  const s = getSession()
  return s?.permissions?.some((p) => p.screen === screen && p.can_write) ?? false
}

export function canDeleteScreen(screen: string): boolean {
  const s = getSession()
  return s?.permissions?.some((p) => p.screen === screen && p.can_delete) ?? false
}
