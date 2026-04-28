'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookOpen, LogOut, User } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(profile)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = createBrowserClient()
      .auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          createBrowserClient()
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data }) => setUser(data))
        } else {
          setUser(null)
        }
        setLoading(false)
      })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/feed" className="flex items-center space-x-2">
            <BookOpen className="w-8 h-8 text-[#2563EB]" />
            <span className="text-2xl font-bold text-gray-900">StudyHub</span>
          </Link>

          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-10 w-20 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost">Feed</Button>
                </Link>
                <Link href="/submit">
                  <Button variant="ghost">Submit</Button>
                </Link>
                <Link href={`/profile/${user.id}`}>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.name}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
