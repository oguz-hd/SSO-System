'use client'
import { useState, useEffect } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { apiFetch } from '../lib/api'

type Props = { docId?: string; placeholder?: string }

type AiStatus = {
  llm_enabled: boolean
  provider: string
  model: string | null
}

type RagResponse = {
  answer: string
  source?: string
  model?: string | null
  tokens_used?: number
}

export default function AiAssistant({ docId = 'default', placeholder = 'YZ asistanına sorun...' }: Props) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [meta, setMeta] = useState<RagResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<AiStatus | null>(null)

  useEffect(() => {
    fetch('/api/ai/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ llm_enabled: false, provider: 'simulation', model: null }))
  }, [])

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    setMeta(null)
    try {
      const data = await apiFetch('/ai/rag/query', {
        method: 'POST',
        body: JSON.stringify({ doc_id: docId, question }),
      })
      setAnswer(data.answer)
      setMeta(data)
    } catch (e: unknown) {
      setAnswer(e instanceof Error ? e.message : 'yanıt alınamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-extrabold text-indigo-800 uppercase tracking-widest flex items-center gap-2">
          <Bot size={18} /> AI / RAG Asistan
        </h3>
        {status && (
          <span
            className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              status.llm_enabled
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            {status.llm_enabled && <Sparkles size={12} />}
            {status.llm_enabled ? `OpenAI · ${status.model}` : 'Simülasyon (API key yok)'}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl border border-indigo-200 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          onClick={ask}
          disabled={loading}
          className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
          {loading ? '...' : 'sor'}
        </button>
      </div>

      {answer && (
        <div className="bg-white/80 p-4 rounded-xl border border-indigo-100">
          {meta?.source && (
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-gray-400">
              kaynak: {meta.source}
              {meta.model ? ` · ${meta.model}` : ''}
              {meta.tokens_used ? ` · ${meta.tokens_used} token` : ''}
            </p>
          )}
          <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{answer}</p>
        </div>
      )}

      {!status?.llm_enabled && (
        <p className="text-xs text-amber-700 mt-3 font-medium">
          Gerçek LLM için proje kökünde <code className="bg-white px-1 rounded">.env</code> dosyasına{' '}
          <code className="bg-white px-1 rounded">OPENAI_API_KEY=sk-...</code> ekleyip container&apos;ları yeniden başlatın.
        </p>
      )}
    </div>
  )
}
