import './globals.css'
import { Inter } from 'next/font/google'
import NotificationToast from '../components/NotificationToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Üniversite SSO Portal & Yönetim',
  description: 'Gelişmiş Mikroservis ve RabbitMQ tabanlı Yönetim Paneli',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-indigo-100 selection:text-indigo-900`}>
        {children}
        <NotificationToast />
      </body>
    </html>
  )
}
