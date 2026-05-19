'use client'
import { useEffect, useRef } from 'react'

type GrapesEditorProps = {
  components: unknown[]
}

export default function GrapesEditor({ components }: GrapesEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<{ destroy: () => void } | null>(null)

  useEffect(() => {
    if (!containerRef.current || !components?.length) return

    let destroyed = false

    const init = async () => {
      if (!document.getElementById('grapesjs-css')) {
        const link = document.createElement('link')
        link.id = 'grapesjs-css'
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/grapesjs/dist/css/grapes.min.css'
        document.head.appendChild(link)
      }

      const grapesjs = (await import('grapesjs')).default

      if (destroyed || !containerRef.current) return

      if (editorRef.current) {
        editorRef.current.destroy()
      }

      const editor = grapesjs.init({
        container: containerRef.current,
        height: '500px',
        width: 'auto',
        storageManager: false,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.setComponents(components as any)
      editorRef.current = editor
    }

    init()

    return () => {
      destroyed = true
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [components])

  return (
    <div className="w-full border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div ref={containerRef} />
    </div>
  )
}
