'use client'
import { useState, useEffect } from 'react'
import { Paintbrush, FileCode2, Zap, LayoutTemplate, AlertCircle, Save, CheckCircle2 } from 'lucide-react'
import { apiUpload, apiFetch } from '../../../lib/api'
import GrapesEditor from '../../../components/GrapesEditor'
import AiAssistant from '../../../components/AiAssistant'

export default function DesignLabPage() {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [output, setOutput] = useState<{ data?: unknown[], type?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  type SavedDesign = { id: number; name: string; author: string; created_at: string; components: any[] }
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>([])
  
  const loadDesigns = async () => {
    try {
      const data = await apiFetch('/designs')
      setSavedDesigns(data.designs || [])
    } catch (e) {
      console.error('Tasarımlar yüklenemedi', e)
    }
  }

  useEffect(() => {
    loadDesigns()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    setOutput(null)
    setSuccessMsg('')
    if (e.target.files?.[0]) {
      const selected = e.target.files[0]
      const ext = selected.name.split('.').pop()?.toLowerCase()
      if (ext !== 'docx') {
        setError('Tasarım laboratuvarı için .docx yükleyin')
        setFile(null)
      } else {
        setFile(selected)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setSuccessMsg('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const data = await apiUpload('/ai/upload', formData)
      if (data.type === 'grapesjs_bileşenleri') {
        setOutput({ data: data.data, type: data.type })
      } else {
        setOutput(data)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yükleme hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDesign = async () => {
    if (!output?.data) return
    setSaving(true)
    setError('')
    try {
      await apiFetch('/designs', {
        method: 'POST',
        body: JSON.stringify({ name: file?.name || 'Tasarım', components: output.data })
      })
      setSuccessMsg('Tasarım başarıyla kaydedildi!')
      loadDesigns()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kaydetme hatası')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Tasarım Laboratuvarı</h1>
      <p className="text-gray-500 mb-10">Word → GrapesJS HTML Düzenleyici</p>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <div className="xl:col-span-1 bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 shadow-sm">
          <input type="file" id="design-upload" className="hidden" accept=".docx" onChange={handleFileChange} />
          <label htmlFor="design-upload" className="cursor-pointer block border-2 border-dashed border-indigo-200 rounded-2xl p-6 text-center">
            <Paintbrush className="mx-auto text-indigo-400 mb-2" />
            <span className="text-sm font-bold">.docx Seçin</span>
          </label>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 font-bold text-xs">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full mt-4 py-3 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap size={18} />
            {loading ? 'Dönüştürülüyor...' : "HTML'e Çevir"}
          </button>
        </div>

        {/* Önceki Tasarımlarım Bölümü */}
        <div className="xl:col-span-1 bg-white/60 backdrop-blur-2xl p-6 rounded-3xl border border-white/50 flex flex-col shadow-sm">
          <h3 className="font-extrabold text-gray-900 mb-4 flex items-center gap-2">
            <LayoutTemplate size={20} className="text-indigo-500" />
            Önceki Tasarımlarım
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 max-h-[400px] pr-2">
            {savedDesigns.length === 0 ? (
              <p className="text-sm text-gray-400 font-bold text-center mt-4">Kayıtlı tasarım yok.</p>
            ) : (
              savedDesigns.map(design => (
                <div key={design.id} className="p-4 rounded-xl border hover:border-indigo-300 hover:shadow-sm bg-gray-50/50 transition cursor-pointer group" onClick={() => {
                  setOutput({ data: design.components, type: 'grapesjs_bileşenleri' })
                  setSuccessMsg(`${design.name} yüklendi.`)
                }}>
                  <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-700">{design.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Oluşturan: {design.author}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{design.created_at}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-3">
          {!output?.data ? (
            <div className="h-[500px] flex flex-col items-center justify-center bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/50 shadow-sm">
              <LayoutTemplate size={64} className="text-gray-300 mb-4" />
              <p className="text-gray-400 font-bold">GrapesJS Stüdyo Bekliyor</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold flex items-center gap-2">
                  <FileCode2 className="text-indigo-500" /> GrapesJS Görsel Editör
                </h3>
                {output.type === 'grapesjs_bileşenleri' && (
                  <button 
                    onClick={handleSaveDesign} 
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Tasarımı Kaydet'}
                  </button>
                )}
              </div>
              <GrapesEditor components={output.data as object[]} />
            </div>
          )}
        </div>
      </div>

      <AiAssistant placeholder="Tasarım veya DOCX dönüşümü hakkında sorun..." />
    </div>
  )
}
