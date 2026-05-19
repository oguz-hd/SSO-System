import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login']

const SCREEN_PATHS: Record<string, string> = {
  '/dashboard/supervisor': 'supervisor_matrix',
  '/dashboard/announcements': 'announcements',
  '/dashboard/assignments': 'assignments',
  '/dashboard/upload': 'design_lab',
  '/dashboard/business': 'business',
  '/dashboard/students': 'student_list',
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
