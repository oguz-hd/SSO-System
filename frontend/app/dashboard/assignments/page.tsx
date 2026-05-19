'use client'
import { useState, useEffect } from 'react'
import { FileText, CheckCircle2, Clock, AlertCircle, PlusCircle, Trash2 } from 'lucide-react'
import { apiUpload, apiFetch } from '../../../lib/api'
import { getSession, canWriteScreen, canDeleteScreen } from '../../../lib/auth'
import AiAssistant from '../../../components/AiAssistant'

type Assignment = {
  id: number
  title: string
  course: string
  deadline: string
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [canWrite, setCanWrite] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  
  const [newTitle, setNewTitle] = useState('')
  const [newCourse, setNewCourse] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = async () => {
    try {
      const d = await apiFetch('/assignments')
      setAssignments(d.assignments || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödevler yüklenirken hata oluştu')
    }
  }

  useEffect(() => {
    setCanWrite(canWriteScreen('assignments'))
    setCanDelete(canDeleteScreen('assignments'))
    load()
  }, [])

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newCourse) return
    setError('')
    setLoading(true)
    try {
      await apiFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, course: newCourse }),
      })
      setNewTitle('')
      setNewCourse('')
      setIsAdding(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ödev eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu ödevi silmek istediğinize emin misiniz?')) return
    setError('')
    setDeletingId(id)
    try {
      await apiFetch(`/assignments/${id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme hatası oluştu')
    } finally {
      setDeletingId(null)
    }
  }

  const allowedExtensions = () => {
    const session = getSession()
    for (const p of session?.permissions || []) {
      if (p.screen === 'assignments' && p.allowed_extensions?.length) {
        return p.allowed_extensions
      }
    }
    return ['txt', 'docx', 'pdf']
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setResult(null)
    const selected = e.target.files?.[0]
    if (!selected) return
    const ext = selected.name.split('.').pop()?.toLowerCase() || ''
    const allowed = allowedExtensions()
    if (!allowed.includes(ext)) {
      setError(`İzinli uzantılar: ${allowed.join(', ')}`)
      setFile(null)
    } else {
      setFile(selected)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoadingUpload(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await apiUpload('/ai/upload', formData)
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası')
    } finally {
      setLoadingUpload(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Ödev & Materyal Merkezi</h1>
          <p className="text-gray-500">Rol bazlı dosya kısıtı: {allowedExtensions().join(', ')}</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition hover:bg-indigo-700"
          >
            <PlusCircle size={20} />
            {isAdding ? 'İptal' : 'Yeni Ödev'}
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
        <form onSubmit={handleAddAssignment} className="mb-10 bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ödev Başlığı"
              className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <input
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              placeholder="Ders Kodu (örn: CENG 401)"
              className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition">
            {loading ? 'Ekleniyor...' : 'Ödev Oluştur'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {assignments.map((item) => (
            <div key={item.id} className="relative p-6 rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/50 shadow-sm hover:shadow-md transition">
              {canDelete && (
                <button 
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                  title="Ödevi Sil"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <span className="text-xs font-bold text-indigo-600">{item.course}</span>
              <h3 className="font-extrabold mt-2 pr-8">{item.title}</h3>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <Clock size={14} /> Son: {item.deadline}
              </p>
            </div>
          ))}
          {assignments.length === 0 && !error && (
            <div className="p-8 text-center text-gray-500 text-sm font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              Henüz aktif bir ödev bulunmuyor.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 shadow-sm">
          <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="cursor-pointer block border-2 border-dashed rounded-2xl p-10 text-center hover:bg-gray-50 transition">
            <FileText className="mx-auto text-indigo-500 mb-3" size={32} />
            <span className="font-bold">Çözüm/Materyal Dosyası Seçin ({allowedExtensions().join(', ')})</span>
          </label>
          {file && (
            <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 overflow-hidden">
                <CheckCircle2 className="text-emerald-500 shrink-0" />
                <span className="font-bold text-sm truncate">{file.name}</span>
              </div>
              <button onClick={handleUpload} disabled={loadingUpload} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition disabled:opacity-50">
                {loadingUpload ? 'Analiz...' : 'Yükle'}
              </button>
            </div>
          )}
          {!!result && (
            <div className="mt-6 space-y-3">
              {(result as { data?: { llm_output?: string; source?: string; model?: string } }).data?.llm_output ? (
                <>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                      {(result as { data: { source: string } }).data.source === 'openai' ? 'OpenAI LLM' : (result as { data: { source: string } }).data.source}
                    </span>
                    {(result as { data: { model?: string } }).data.model && (
                      <span className="text-[10px] text-gray-500 font-bold">{(result as { data: { model: string } }).data.model}</span>
                    )}
                  </div>
                  <div className="bg-gray-900 text-emerald-400 p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                    {(result as { data: { llm_output: string } }).data.llm_output}
                  </div>
                </>
              ) : (
                <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl border border-emerald-200">
                  <h4 className="font-extrabold text-lg flex items-center gap-2 mb-2">
                    <CheckCircle2 size={24} /> Dosya Başarıyla İşlendi
                  </h4>
                  <p className="text-sm font-medium">
                    Yüklediğiniz materyal analiz edildi ve sisteme başarıyla entegre edildi. 
                    Tasarım laboratuvarı veya AI asistanı üzerinden içeriğine erişebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AiAssistant docId="assignments" />
    </div>
  )
}
