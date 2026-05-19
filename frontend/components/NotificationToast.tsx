'use client'
import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

type Notification = {
  id: string
  message: string
  type: string
}

export default function NotificationToast() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // WS Adresini Belirle
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    // Backend portu (8000)
    const wsUrl = `${protocol}//${host}:8000/ws/notifications`
    
    let ws: WebSocket
    
    const connect = () => {
      ws = new WebSocket(wsUrl)
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.message) {
            const newNotif = {
              id: Math.random().toString(36).substring(7),
              message: data.message,
              type: data.type || 'INFO'
            }
            setNotifications(prev => [...prev, newNotif])
            
            // 5 saniye sonra gizle
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== newNotif.id))
            }, 5000)
          }
        } catch (e) {
          console.error('WS message error', e)
        }
      }

      ws.onclose = () => {
        // 3sn sonra tekrar dene
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (ws) ws.close()
    }
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {notifications.map(notif => (
        <div key={notif.id} className="bg-indigo-600 text-white px-5 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bell size={20} className="text-white" />
          </div>
          <p className="font-bold pr-4">{notif.message}</p>
          <button 
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
            className="text-indigo-200 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
