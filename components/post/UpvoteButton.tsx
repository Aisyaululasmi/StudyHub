'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface UpvoteButtonProps {
  postId: string
  initialVoteCount: number
  initialVoted?: boolean
  showLabel?: boolean
  variant?: 'default' | 'compact'
}

export default function UpvoteButton({
  postId,
  initialVoteCount,
  initialVoted = false,
  showLabel = false,
  variant = 'default',
}: UpvoteButtonProps) {
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [voted, setVoted] = useState(initialVoted)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication on mount
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

  // Setup realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient()

    // Subscribe to votes changes for this post
    const channel = supabase
      .channel(`votes:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'votes',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          // Update vote count based on the change
          if (payload.eventType === 'INSERT') {
            const newVote = payload.new as { value: number }
            setVoteCount((prev) => prev + newVote.value)
          } else if (payload.eventType === 'DELETE') {
            const oldVote = payload.old as { value: number }
            setVoteCount((prev) => prev - oldVote.value)
          } else if (payload.eventType === 'UPDATE') {
            const oldVote = payload.old as { value: number }
            const newVote = payload.new as { value: number }
            setVoteCount((prev) => prev + newVote.value - oldVote.value)
          }
        }
      )
      .subscribe()

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  // Sync vote status from auth state changes
  useEffect(() => {
    const supabase = createBrowserClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setIsAuthenticated(true)

          // Fetch user's current vote status
          const { data: userVote } = await supabase
            .from('votes')
            .select('value')
            .eq('user_id', session.user.id)
            .eq('post_id', postId)
            .single()

          setVoted(!!userVote)
        } else {
          setIsAuthenticated(false)
          setVoted(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [postId])

  const handleVote = async () => {
    if (!isAuthenticated) {
      toast.error('Login dulu untuk upvote', {
        description: 'Silakan login atau daftar untuk memberikan upvote',
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
    const previousVoteCount = voteCount
    const previousVoted = voted

    setVoteCount((prev) => voted ? prev - 1 : prev + 1)
    setVoted(!voted)
    setLoading(true)

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      })

      if (!res.ok) {
        const data = await res.json()

        // Revert optimistic update on error
        setVoteCount(previousVoteCount)
        setVoted(previousVoted)

        throw new Error(data.error || 'Vote failed')
      }

      const data = await res.json()

      // Update with server response
      setVoteCount(data.data.vote_count)
      setVoted(data.data.voted)

      toast.success(data.data.voted ? 'Upvoted!' : 'Upvote dihapus')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memberikan upvote')
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = variant === 'compact'
    ? 'px-2 py-1 text-sm'
    : 'px-3 py-1.5 text-sm'

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleVote}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 transition-all',
        voted && 'bg-green-50 text-green-700 hover:bg-green-100',
        loading && 'opacity-50 cursor-not-allowed',
        sizeClasses
      )}
      title={voted ? 'Hapus upvote' : 'Berikan upvote'}
    >
      <ArrowUp
        className={cn(
          'w-4 h-4 transition-transform',
          voted && 'fill-current',
          loading && 'animate-pulse'
        )}
      />
      <span className={cn('font-medium', variant === 'compact' && 'text-xs')}>
        {voteCount}
      </span>
      {showLabel && <span className="hidden sm:inline">{voted ? ' Upvoted' : ' Upvote'}</span>}
    </Button>
  )
}
