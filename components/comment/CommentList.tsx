'use client'

import { useState, useEffect } from 'react'
import CommentItem from './CommentItem'
import { Loader2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabaseClient'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
  } | null
}

interface CommentListProps {
  postId: string
  currentUserId?: string
  onCommentCountChange?: (count: number) => void
}

export default function CommentList({
  postId,
  currentUserId,
  onCommentCountChange,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/comments?postId=${postId}`)
        const data = await res.json()

        if (data.data) {
          setComments(data.data)
          onCommentCountChange?.(data.data.length)
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  // Setup realtime subscription for new comments
  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment
          // Fetch profile for new comment
          supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', newComment.user_id)
            .single()
            .then(({ data }) => {
              setComments((prev) => [
                ...prev,
                { ...newComment, profiles: data },
              ])
              onCommentCountChange?.(comments.length + 1)
            })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const deletedId = payload.old.id
          setComments((prev) => {
            const filtered = prev.filter((c) => c.id !== deletedId)
            onCommentCountChange?.(filtered.length)
            return filtered
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => {
      const filtered = prev.filter((c) => c.id !== commentId)
      onCommentCountChange?.(filtered.length)
      return filtered
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Belum ada komentar. Jadilah yang pertama berkomentar!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          {...comment}
          currentUserId={currentUserId}
          onDelete={handleDeleteComment}
        />
      ))}
    </div>
  )
}
