'use client'
import { useState, useEffect } from 'react'
import { apiFetch } from '../../../lib/api'
import { Save, CheckCircle, AlertCircle } from 'lucide-react'

type MatrixRow = {
  id?: number
  role_id: number
  role: string
  role_label: string
  screen: string
  screen_label: string
  read: boolean
  write: boolean
  canDelete: boolean
  allowed_extensions?: string[]
}

export default function SupervisorDashboard() {
  const [matrix, setMatrix] = useState<MatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    apiFetch('/permissions')
      .then((data) => setMatrix(data.matrix || []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Yetki matrisi yüklenirken hata oluştu'))
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = (index: number, field: 'read' | 'write' | 'canDelete') => {
    const newMatrix = [...matrix]
    newMatrix[index] = { ...newMatrix[index], [field]: !newMatrix[index][field] }
    setMatrix(newMatrix)
  }

  const [sourceRole, setSourceRole] = useState('')
  const [targetRole, setTargetRole] = useState('')

  const handleCopyPermissions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceRole || !targetRole) {
      setError('Lütfen her iki rolü de seçin')
      return
    }
    if (sourceRole === targetRole) {
      setError('Kaynak ve hedef roller aynı olamaz')
      return
    }
    if (!confirm('Tüm yetkileri kopyalamak istediğinize emin misiniz? Hedef rolün mevcut tüm yetkileri silinecektir!')) {
      return
    }
    
    setError('')
    try {
      await apiFetch('/permissions/copy', {
        method: 'POST',
        body: JSON.stringify({ source_role_id: parseInt(sourceRole), target_role_id: parseInt(targetRole) }),
      })
      alert('Yetkiler başarıyla kopyalandı!')
      // Matrisi yenile
      const data = await apiFetch('/permissions')
      setMatrix(data.matrix || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kopyalama hatası')
    }
  }

  const saveRow = async (index: number) => {
    const row = matrix[index]
    setSaving(index)
    setError('')
    try {
      await apiFetch('/permissions', {
        method: 'PUT',
        body: JSON.stringify({
          role_id: row.role_id,
          screen: row.screen,
          can_read: row.read,
          can_write: row.write,
          can_delete: row.canDelete,
          allowed_extensions: row.allowed_extensions,
        }),
      })
      setSaved(index)
      setTimeout(() => setSaved(null), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme hatası oluştu')
    } finally {
      setSaving(null)
    }
  }

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  if (loading) return <p className="text-gray-500 font-medium">Matris yükleniyor...</p>

  // Benzersiz rolleri listele
  const uniqueRoles = Array.from(new Set(matrix.map(r => r.role_id))).map(id => {
    const row = matrix.find(r => r.role_id === id)
    return { id, label: row?.role_label || row?.role || '' }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Süpervizör Matrisi</h1>
        <p className="text-gray-500 mt-2 font-medium">
          Rollere ekran atayın — değişiklikler PostgreSQL ve RabbitMQ RPC ile kaydedilir.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl shadow-sm border border-white/50">
        <h3 className="font-extrabold text-xl mb-6">Tüm Yetkileri Kopyala</h3>
        <form onSubmit={handleCopyPermissions} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Kaynak Rol (Kopyalanacak)</label>
            <select
              value={sourceRole}
              onChange={(e) => setSourceRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            >
              <option value="">Seçiniz...</option>
              {uniqueRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Hedef Rol (Üzerine Yazılacak)</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            >
              <option value="">Seçiniz...</option>
              {uniqueRoles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
            Kopyala ve Üzerine Yaz
          </button>
        </form>
      </div>

      <div className="overflow-hidden bg-white/60 backdrop-blur-2xl rounded-3xl shadow border border-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-50/40">
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase">Rol</th>
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase">Ekran</th>
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase text-center">Okuma</th>
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase text-center">Yazma</th>
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase text-center">Silme</th>
              <th className="p-6 text-xs font-bold text-indigo-800 uppercase text-center">Kaydet</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={`${row.role_id}-${row.screen}`} className="hover:bg-white/80">
                <td className="p-6 border-b border-gray-100 font-bold">{row.role_label || row.role}</td>
                <td className="p-6 border-b border-gray-100">
                  <span className="px-4 py-1.5 bg-gray-100 rounded-xl text-sm font-bold">{row.screen_label || row.screen}</span>
                </td>
                <td className="p-6 border-b text-center">
                  <Switch checked={row.read} onChange={() => togglePermission(idx, 'read')} />
                </td>
                <td className="p-6 border-b text-center">
                  <Switch checked={row.write} onChange={() => togglePermission(idx, 'write')} />
                </td>
                <td className="p-6 border-b text-center">
                  <Switch checked={row.canDelete} onChange={() => togglePermission(idx, 'canDelete')} />
                </td>
                <td className="p-6 border-b text-center">
                  <button
                    onClick={() => saveRow(idx)}
                    disabled={saving === idx}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                  >
                    {saved === idx ? <CheckCircle size={16} /> : <Save size={16} />}
                    {saving === idx ? '...' : saved === idx ? 'Kaydedildi' : 'Kaydet'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
