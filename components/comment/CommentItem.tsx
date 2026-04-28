'use client'

import { useState, useEffect } from 'react'
import { timeAgo } from '@/lib/time'
import { Trash2, User } from 'lucide-react'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface CommentItemProps {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  } | null
  currentUserId?: string
  onDelete?: (id: string) => void
}

export default function CommentItem({
  id,
  content,
  created_at,
  user_id,
  profiles,
  currentUserId,
  onDelete,
}: CommentItemProps) {
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  const handleDelete = async () => {
    if (!confirm('Hapus komentar ini?')) {
      return
    }

    if (loading) return

    setLoading(true)

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete comment')
      }

      toast.success('Komentar dihapus')
      onDelete?.(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus komentar')
    } finally {
      setLoading(false)
    }
  }

  const isOwner = currentUserId === user_id

  return (
    <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {profiles?.avatar_url ? (
          <img
            src={profiles.avatar_url}
            alt={profiles.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-medium">
            {profiles?.name.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {profiles?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {timeAgo(created_at)}
            </span>
          </div>

          {isOwner && isAuthenticated && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Hapus komentar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Comment Text */}
        <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
          {content}
        </p>
      </div>
    </div>
  )
}
