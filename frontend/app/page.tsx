'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '../lib/api'
import { defaultLanding } from '../lib/screens'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await login(username, password)
      router.push(defaultLanding(session.role_name))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="relative z-10 p-12 text-center text-white backdrop-blur-sm bg-white/10 rounded-3xl border border-white/20 shadow-2xl mx-10">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">SSO Portal</h1>
          <p className="text-lg text-indigo-100 font-light tracking-wide">
            Üniversite Bilgi Yönetim ve Yapay Zeka Analiz Platformu
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 sm:px-20 lg:px-32 bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900">Hoş Geldiniz</h2>
            <p className="text-gray-500 mt-2">PostgreSQL Üzerinden Kimlik Doğrulama</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="Kullanıcı adınızı girin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>

          <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-3">Test Kimlik Bilgileri</h4>
            <ul className="text-sm text-indigo-700 space-y-2 font-medium">
              <li className="flex justify-between"><span>Süpervizör:</span> <span className="font-mono bg-white px-2 py-1 rounded">admin / 1234</span></li>
              <li className="flex justify-between"><span>Akademisyen (Öğretmen):</span> <span className="font-mono bg-white px-2 py-1 rounded">ogretmen / 1234</span></li>
              <li className="flex justify-between"><span>Öğrenci:</span> <span className="font-mono bg-white px-2 py-1 rounded">ogrenci / 1234</span></li>
              <li className="flex justify-between"><span>İşletme:</span> <span className="font-mono bg-white px-2 py-1 rounded">isletme / 1234</span></li>
              <li className="flex justify-between"><span>Okul:</span> <span className="font-mono bg-white px-2 py-1 rounded">okul / 1234</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
