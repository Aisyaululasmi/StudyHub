import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const isAuthRoute = requestUrl.pathname.startsWith('/auth')
  const isProtectedRoute = requestUrl.pathname.startsWith('/submit') || requestUrl.pathname.startsWith('/profile')

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.delete(name)
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if trying to access protected route without session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect to feed if trying to access auth route with active session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
