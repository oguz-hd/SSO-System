'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, Users2 } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import AiAssistant from '../../../components/AiAssistant'

type Student = {
  id: number
  full_name?: string
  username?: string
  student_no?: string
  email?: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setError('')
    setLoading(true)
    apiFetch('/students')
      .then((d) => setStudents(d.students || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Öğrenciler yüklenirken bir hata oluştu'))
      .finally(() => setLoading(false))
  }, [])


  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
        <Users2 className="text-indigo-500" /> Öğrenci Listesi
      </h1>
      <p className="text-gray-500 mb-10">Süpervizör tarafından atanan ekran — okul ve işletme grupları için.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white/60 backdrop-blur-2xl h-20 rounded-3xl border border-white/50 shadow-sm"></div>
          ))}
        </div>
      ) : students.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-10 font-medium">Öğrenci listesi boş veya görüntüleme yetkiniz yok.</p>
      ) : (
        <div className="space-y-4">
          {students.map((s) => (
            <div key={s.id} className="bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 shadow-sm flex justify-between hover:shadow-md transition-shadow">
              <div>
                <p className="font-extrabold text-gray-900">{s.full_name || s.username}</p>
                <p className="text-sm text-gray-500">{s.email}</p>
              </div>
              {s.student_no && (
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full flex items-center">
                  {s.student_no}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <AiAssistant placeholder="Öğrenci listesi hakkında soru sorun..." />
    </div>
  )
}
