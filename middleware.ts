import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Public paths that don't require auth
  const publicPaths = ['/login', '/api/auth', '/api/init-db']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  // Redirect authenticated users away from login
  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect unauthenticated users to login
  if (!session && !isPublic) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only route protection - server enforced
  const isAdminRoute =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  if (isAdminRoute && session?.user?.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
