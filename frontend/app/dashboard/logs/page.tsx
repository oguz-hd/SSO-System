'use client'
import { useEffect, useState } from 'react'
import { AlertCircle, Activity, Database, Clock } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import AiAssistant from '../../../components/AiAssistant'

type AuditLog = {
  id: number
  date: string
  operation: string
  table: string
  old_record?: any
  new_record?: any
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setError('')
    setLoading(true)
    apiFetch('/logs')
      .then((d) => setLogs(d.logs || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Loglar yüklenirken hata oluştu'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
        <Activity className="text-indigo-500" /> Sistem Denetim İzleri (Audit)
      </h1>
      <p className="text-gray-500 mb-10">Veritabanındaki (PostgreSQL) tablo düzeyindeki tüm CRUD değişimleri.</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white/60 backdrop-blur-2xl h-24 rounded-3xl border border-white/50 shadow-sm"></div>
          ))}
        </div>
      ) : logs.length === 0 && !error ? (
        <p className="text-gray-500 text-center py-10 font-medium">Kayıtlı sistem logu bulunmuyor.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                    log.operation === 'INSERT' ? 'bg-emerald-500' :
                    log.operation === 'UPDATE' ? 'bg-blue-500' :
                    'bg-red-500'
                  }`}>
                    {log.operation}
                  </span>
                  <span className="font-bold text-gray-700 flex items-center gap-2">
                    <Database size={16} /> {log.table}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Clock size={14} /> {log.date}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {log.old_record && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                    <p className="text-xs font-bold text-red-700 mb-2 uppercase">Eski Kayıt</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(log.old_record, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_record && (
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-700 mb-2 uppercase">Yeni Kayıt</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(log.new_record, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AiAssistant placeholder="Loglar hakkında soru sorun..." />
    </div>
  )
}
