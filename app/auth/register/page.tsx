'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { BookOpen, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [jurusan, setJurusan] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserClient()

      // Create auth user
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            jurusan,
          },
        },
      })

      if (authError) {
        toast.error(authError.message || 'Registration failed')
        return
      }

      if (user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name,
            jurusan: jurusan || null,
          })

        if (profileError) {
          toast.error('Failed to create profile')
          return
        }

        toast.success('Registration successful')
        router.push('/feed')
        router.refresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/feed" className="flex items-center justify-center space-x-2">
            <BookOpen className="w-10 h-10 text-[#2563EB]" />
            <span className="text-3xl font-bold text-gray-900">StudyHub</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-[#2563EB] hover:text-[#1d4ed8]">
              Sign in here
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="jurusan">Major (Jurusan)</Label>
              <Input
                id="jurusan"
                name="jurusan"
                type="text"
                placeholder="Computer Science"
                value={jurusan}
                onChange={(e) => setJurusan(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
