'use client'
import { useState, useEffect } from 'react'
import { Megaphone, Calendar, User, PlusCircle, Trash2, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { canWriteScreen, canDeleteScreen } from '../../../lib/auth'
import AiAssistant from '../../../components/AiAssistant'

type Announcement = {
  id: number
  title: string
  content: string
  author: string
  date: string
  priority: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [canWrite, setCanWrite] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setError('')
    try {
      const d = await apiFetch('/announcements')
      setAnnouncements(d.announcements || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duyurular yüklenirken hata oluştu')
    }
  }

  useEffect(() => {
    setCanWrite(canWriteScreen('announcements'))
    setCanDelete(canDeleteScreen('announcements'))
    load()
  }, [])

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newContent) return
    setError('')
    setLoading(true)
    try {
      await apiFetch('/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, content: newContent }),
      })
      setNewTitle('')
      setNewContent('')
      setIsAdding(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duyuru eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return
    setError('')
    setDeletingId(id)
    try {
      await apiFetch(`/announcements/${id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme hatası oluştu')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Duyuru Panosu</h1>
          <p className="text-gray-500 mt-3 font-medium text-lg">RabbitMQ üzerinden senkronize duyurular.</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition hover:bg-indigo-700"
          >
            <PlusCircle size={20} />
            {isAdding ? 'İptal' : 'Yeni Duyuru'}
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
        <form onSubmit={handleAddAnnouncement} className="mb-10 bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 space-y-4 shadow-sm">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Başlık"
            className="w-full px-5 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="İçerik"
            rows={4}
            className="w-full px-5 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
          <button type="submit" disabled={loading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50 transition">
            {loading ? 'Yayınlanıyor...' : 'Yayınla'}
          </button>
        </form>
      )}

      <div className="space-y-6">
        {announcements.map((item) => (
          <div key={item.id} className="relative bg-white/60 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition">
            {canDelete && (
              <button 
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                title="Duyuruyu Sil"
              >
                <Trash2 size={20} />
              </button>
            )}
            <h3 className="text-2xl font-extrabold text-gray-900 mb-3 pr-12">{item.title}</h3>
            <p className="text-gray-600 mb-6">{item.content}</p>
            <div className="flex gap-8 text-sm text-gray-500 font-bold">
              <span className="flex items-center gap-2"><User size={14} /> {item.author}</span>
              <span className="flex items-center gap-2"><Calendar size={14} /> {item.date}</span>
            </div>
          </div>
        ))}
        {announcements.length === 0 && !error && (
          <div className="p-10 text-center text-gray-500 font-medium bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            Henüz bir duyuru bulunmuyor.
          </div>
        )}
      </div>

      <AiAssistant placeholder="Duyurular hakkında RAG sorusu sorun..." />
    </div>
  )
}
