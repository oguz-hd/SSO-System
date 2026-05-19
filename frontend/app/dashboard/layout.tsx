'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { getSession, clearSession, Session } from '../../lib/auth'
import { SCREEN_ROUTES, PATH_TO_SCREEN } from '../../lib/screens'
import { refreshMe } from '../../lib/api'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const s = getSession()
    if (!s) {
      router.replace('/')
      return
    }
    setSession(s)
    refreshMe().then(setSession).catch(() => {})

    const screen = PATH_TO_SCREEN[pathname]
    if (screen && !s.permissions?.some((p) => p.screen === screen && p.can_read)) {
      const first = s.permissions?.[0]
      if (first && SCREEN_ROUTES[first.screen]) {
        router.replace(SCREEN_ROUTES[first.screen].href)
      }
    }
  }, [pathname, router])

  if (!session) return null

  const navigation = (session.permissions || [])
    .filter((p) => p.can_read && SCREEN_ROUTES[p.screen])
    .map((p) => ({
      ...SCREEN_ROUTES[p.screen],
      screen: p.screen,
    }))

  const profile = {
    name: session.username,
    title: session.role_label,
    letter: session.role_label?.[0] || 'U',
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-[20%] right-[-5%] w-96 h-96 bg-cyan-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      
      <aside className="w-72 bg-white/70 backdrop-blur-3xl border-r border-white shadow-[8px_0_32px_rgba(0,0,0,0.03)] flex flex-col z-20 transition-all">
        <div className="h-24 flex items-center px-8 border-b border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200/50 hover:scale-105 transition-transform cursor-pointer">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-purple-800 leading-none mb-1">SSO Portal</h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-bold">Dinamik Yetki</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Atanan Modüller</p>
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.screen}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold text-sm relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50/50 text-indigo-700 shadow-sm border border-indigo-100/50'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"></div>
                )}
                <Icon size={20} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-gray-100/50 bg-gradient-to-t from-gray-50/50 to-transparent">
          <div className="bg-white/80 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
              {profile.letter}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">{profile.name}</p>
              <p className="text-xs text-indigo-500 font-bold">{profile.title}</p>
            </div>
          </div>
          <Link
            href="/"
            onClick={() => clearSession()}
            className="mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl w-full transition-colors"
          >
            <LogOut size={18} />
            Sistemden Çıkış
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="relative z-10 w-full min-h-full p-8 lg:p-12">{children}</div>
      </main>
    </div>
  )
}
