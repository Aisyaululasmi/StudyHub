'use client'

import { useState, useEffect, use } from 'react'
import { notFound, useRouter } from 'next/navigation'
import { ExternalLink, FileText, Share2, Hash, MessageSquare, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UpvoteButton from '@/components/post/UpvoteButton'
import BookmarkButton from '@/components/post/BookmarkButton'
import CommentList from '@/components/comment/CommentList'
import CommentForm from '@/components/comment/CommentForm'
import EditPostModal from '@/components/post/EditPostModal'
import DeletePostModal from '@/components/post/DeletePostModal'
import { timeAgo } from '@/lib/time'
import { toast } from 'sonner'
import { createBrowserClient } from '@/lib/supabaseClient'
import { cn } from '@/lib/utils'

interface PostDetailPageProps {
  params: Promise<{ id: string }>
}

interface Post {
  id: string
  user_id: string
  title: string
  description: string | null
  type: 'link' | 'file' | 'text'
  url: string | null
  file_url: string | null
  file_name: string | null
  mata_kuliah: string
  jurusan: string
  tags: string[] | null
  vote_count: number
  comment_count: number
  user_voted: boolean
  user_bookmarked: boolean
  created_at: string
  profiles: {
    id: string
    name: string
    avatar_url: string | null
    jurusan: string | null
    bio: string | null
  } | null
}

export default function PostDetailPageClient({ params }: PostDetailPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${id}`)

        if (!res.ok) {
          if (res.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch post')
        }

        const data = await res.json()
        setPost(data.data)
        setCommentCount(data.data.comment_count)
      } catch (error) {
        toast.error('Gagal memuat post')
        router.push('/feed')
      } finally {
        setLoading(false)
      }
    }

    const getUser = async () => {
      try {
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        setCurrentUser(session?.user || null)
      } catch {
        setCurrentUser(null)
      }
    }

    fetchPost()
    getUser()
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link berhasil disalin!')
    } catch {
      toast.error('Gagal menyalin link')
    }
  }

  const isOwner = currentUser?.id === post?.user_id

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                  {post.mata_kuliah}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  {post.jurusan}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditModal(true)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

            {/* Description */}
            {post.description && (
              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{post.description}</p>
              </div>
            )}

            {/* Content based on type */}
            {post.type === 'link' && post.url && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#2563EB] hover:underline font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  {post.url}
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Klik link di atas untuk membuka sumber materi
                </p>
              </div>
            )}

            {post.type === 'file' && post.file_url && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{post.file_name || 'Dokumen'}</span>
                </div>
                <a
                  href={post.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download / Lihat File
                </a>
              </div>
            )}

            {post.type === 'text' && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{post.description || ''}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-medium text-lg">
                {post.profiles?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {post.profiles?.name || 'Anonymous'}
                </p>
                <p className="text-sm text-gray-500">
                  {post.profiles?.jurusan || ''} · {timeAgo(post.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 100) + 10} views</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Komentar ({commentCount})
            </h2>

            <CommentForm postId={post.id} onCommentAdded={() => {
              setCommentCount((prev) => prev + 1)
            }} />

            <div className="mt-6">
              <CommentList
                postId={post.id}
                currentUserId={currentUser?.id}
                onCommentCountChange={setCommentCount}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="space-y-2">
              {/* Upvote Button */}
              <UpvoteButton
                postId={post.id}
                initialVoteCount={post.vote_count}
                initialVoted={post.user_voted}
                showLabel
              />

              {/* Comment count */}
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="flex-1 text-left">{commentCount} Komentar</span>
              </Button>

              {/* Bookmark Button */}
              <BookmarkButton
                postId={post.id}
                initialBookmarked={post.user_bookmarked}
                showLabel
              />
            </div>
          </div>

          {/* Author Card */}
          {post.profiles && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Tentang Penulis</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1d4ed8] flex items-center justify-center text-white font-medium text-lg">
                {post.profiles?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{post.profiles?.name || 'Anonymous'}</p>
                <p className="text-sm text-gray-500">{post.profiles?.jurusan || ''}</p>
              </div>
              </div>
              {post.profiles.bio && (
                <p className="text-sm text-gray-600">{post.profiles.bio}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => router.push(`/profile/${post.profiles?.id || ''}`)}
              >
                Lihat Profil
              </Button>
            </div>
          )}

          {/* Related Posts */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Materi Terkait
            </h3>
            <p className="text-sm text-gray-500">
              Fitur rekomendasi akan segera hadir!
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditPostModal
          post={post}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeletePostModal
          postId={post.id}
          postTitle={post.title}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
