'use client'
import { useState, useEffect } from 'react'
import { Building2, FileSearch, Users2, Trash2, AlertCircle, PlusCircle } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { canWriteScreen, canDeleteScreen } from '../../../lib/auth'
import AiAssistant from '../../../components/AiAssistant'

type BusinessJob = {
  id: number
  company: string
  position: string
  duration: string
  deadline: string
  type: string
}

export default function BusinessPage() {
  const [jobListings, setJobListings] = useState<BusinessJob[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [canWrite, setCanWrite] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  
  const [newCompany, setNewCompany] = useState('')
  const [newPosition, setNewPosition] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = async () => {
    setError('')
    try {
      const d = await apiFetch('/business_jobs')
      setJobListings(d.business_jobs || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İlanlar yüklenirken hata oluştu')
    }
  }

  useEffect(() => {
    setCanWrite(canWriteScreen('business'))
    setCanDelete(canDeleteScreen('business'))
    load()
  }, [])

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCompany || !newPosition) return
    setError('')
    setLoading(true)
    try {
      await apiFetch('/business_jobs', {
        method: 'POST',
        body: JSON.stringify({ company: newCompany, position: newPosition }),
      })
      setNewCompany('')
      setNewPosition('')
      setIsAdding(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İlan eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return
    setError('')
    setDeletingId(id)
    try {
      await apiFetch(`/business_jobs/${id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme hatası oluştu')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">İşletme Panosu</h1>
          <p className="text-gray-500">Süpervizör matrisinden atanan ekranlar burada görünür.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition hover:bg-indigo-700"
          >
            <PlusCircle size={20} />
            {isAdding ? 'İptal' : 'Yeni İlan'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAddJob} className="mb-10 bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <input
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="Firma Adı"
              className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <input
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="Pozisyon (örn: Stajyer)"
              className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition">
            {loading ? 'Ekleniyor...' : 'İlan Oluştur'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { label: 'Aktif İlan', value: jobListings.length.toString(), icon: FileSearch },
          { label: 'Kayıtlı Firma', value: '12', icon: Building2 },
          { label: 'Başvuran', value: '47', icon: Users2 },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition">
              <Icon size={24} className="text-indigo-500 mb-4" />
              <p className="text-3xl font-extrabold">{stat.value}</p>
              <p className="text-sm text-gray-500 font-bold">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-5">
        {jobListings.map((job) => (
          <div key={job.id} className="relative bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition">
            {canDelete && (
              <button 
                onClick={() => handleDelete(job.id)}
                disabled={deletingId === job.id}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                title="İlanı Sil"
              >
                <Trash2 size={20} />
              </button>
            )}
            <span className="text-xs font-bold uppercase text-indigo-600">{job.type}</span>
            <h3 className="text-2xl font-extrabold mt-2 pr-12">{job.position}</h3>
            <p className="text-sm text-gray-500">{job.company} — Son: {job.deadline} ({job.duration})</p>
          </div>
        ))}
        {jobListings.length === 0 && !error && (
          <div className="p-10 text-center text-gray-500 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            Henüz bir ilan bulunmuyor.
          </div>
        )}
      </div>

      <AiAssistant placeholder="İşletme paneli / staj ilanları hakkında sorun..." />
    </div>
  )
}
