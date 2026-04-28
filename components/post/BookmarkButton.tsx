'use client'

import { useState, useEffect } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  postId: string
  initialBookmarked?: boolean
  showLabel?: boolean
  variant?: 'default' | 'compact'
}

export default function BookmarkButton({
  postId,
  initialBookmarked = false,
  showLabel = false,
  variant = 'default',
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/profile')
        setIsAuthenticated(res.ok)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      toast.error('Login dulu untuk bookmark', {
        description: 'Silakan login atau daftar untuk menyimpan post',
        action: {
          label: 'Login',
          onClick: () => {
            window.location.href = '/auth/login'
          },
        },
      })
      return
    }

    if (loading) return

    // Optimistic update
    const previousBookmarked = bookmarked
    setBookmarked(!bookmarked)
    setLoading(true)

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST',
      })

      if (!res.ok) {
        const data = await res.json()

        // Revert optimistic update on error
        setBookmarked(previousBookmarked)

        throw new Error(data.error || 'Bookmark failed')
      }

      toast.success(bookmarked ? 'Bookmark dihapus' : 'Ditambahkan ke bookmark')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memberikan bookmark')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = variant === 'compact'
    ? 'p-1'
    : 'px-3 py-1.5'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBookmark}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 transition-all',
        bookmarked && 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
        loading && 'opacity-50 cursor-not-allowed',
        sizeClasses
      )}
      title={bookmarked ? 'Hapus bookmark' : 'Simpan ke bookmark'}
    >
      <Bookmark
        className={cn(
          'w-4 h-4 transition-all',
          bookmarked && 'fill-current',
          loading && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="hidden sm:inline text-sm font-medium">
          {bookmarked ? ' Tersimpan' : ' Simpan'}
        </span>
      )}
    </Button>
  )
}
