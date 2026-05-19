import { LayoutDashboard, Users, Megaphone, FileText, Paintbrush, Briefcase, Users2, Activity } from 'lucide-react'

export const SCREEN_ROUTES: Record<string, { name: string; href: string; icon: typeof Megaphone }> = {
  supervisor_matrix: { name: 'Süpervizör Matrisi', href: '/dashboard/supervisor', icon: Users },
  system_logs: { name: 'Sistem Logları', href: '/dashboard/logs', icon: Activity },
  announcements: { name: 'Duyuru Panosu', href: '/dashboard/announcements', icon: Megaphone },
  assignments: { name: 'Ödev & Materyal Merkezi', href: '/dashboard/assignments', icon: FileText },
  design_lab: { name: 'Tasarım Laboratuvarı (AI)', href: '/dashboard/upload', icon: Paintbrush },
  business: { name: 'İşletme Panosu', href: '/dashboard/business', icon: Briefcase },
  student_list: { name: 'Öğrenci Listesi', href: '/dashboard/students', icon: Users2 },
}

export const PATH_TO_SCREEN: Record<string, string> = Object.fromEntries(
  Object.entries(SCREEN_ROUTES).map(([k, v]) => [v.href, k])
)

export function defaultLanding(roleName: string): string {
  const map: Record<string, string> = {
    supervisor: '/dashboard/supervisor',
    akademisyen: '/dashboard/announcements',
    ogrenci: '/dashboard/announcements',
    isletme: '/dashboard/business',
    okul: '/dashboard/students',
  }
  return map[roleName] || '/dashboard/announcements'
}
