'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentFormProps {
  postId: string
  onCommentAdded?: () => void
}

export default function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/profile')
        if (res.ok) {
          const data = await res.json()
          setUser(data.data)
          setIsAuthenticated(true)
        }
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast.error('Komentar tidak boleh kosong')
      return
    }

    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(`/api/comments?postId=${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to post comment')
      }

      toast.success('Komentar berhasil ditambahkan')
      setContent('')
      onCommentAdded?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambahkan komentar')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-3">
          Login untuk berkomentar
        </p>
        <a
          href="/auth/login"
          className="inline-flex items-center px-4 py-2 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          Login Sekarang
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="comment" className="text-base font-medium">
          Tulis Komentar
        </Label>
        <textarea
          id="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bagikan pendapatmu tentang materi ini..."
          rows={4}
          maxLength={1000}
          disabled={loading}
          className={cn(
            'w-full px-4 py-3 text-sm border border-gray-300 rounded-lg',
            'focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-none'
          )}
        />
        <p className="mt-1 text-xs text-gray-500">
          {content.length}/1000 karakter
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-gray-600">
            {user?.name || 'User'}
          </span>
        </div>

        <Button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Kirim
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
