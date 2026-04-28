'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import MiniPostCard from '@/components/profile/MiniPostCard'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Post {
  id: string
  title: string
  description: string | null
  type: 'link' | 'file' | 'text'
  mata_kuliah: string
  jurusan: string
  upvotes: number
  created_at: string
}

interface Bookmark {
  id: string
  posts: Post | null
  created_at: string
}

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const initParams = async () => {
      const { id } = await params
      setUserId(id)
    }
    initParams()
  }, [params])

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${userId}`)

        if (!res.ok) {
          if (res.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch profile')
        }

        const data = await res.json()
        setProfile(data.data.profile)
        setPosts(data.data.posts || [])
        setBookmarks(data.data.bookmarks || [])
      } catch (error) {
        toast.error('Gagal memuat profil')
        router.push('/feed')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#2563EB]" />
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <ProfileHeader
        profile={profile}
        stats={profile.stats}
        isOwnProfile={profile.isOwnProfile}
      />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        postCount={profile.stats.totalPosts}
        bookmarkCount={bookmarks.length}
        showBookmarks={profile.isOwnProfile}
      />

      {/* Content */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Belum ada materi
              </h3>
              <p className="text-gray-600 mb-6">
                {profile.isOwnProfile
                  ? 'Jadilah yang pertama berbagi materi kuliah!'
                  : `${profile.name} belum mengupload materi apa pun.`}
              </p>
              {profile.isOwnProfile && (
                <a
                  href="/submit"
                  className="inline-flex items-center px-6 py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
                >
                  Upload Materi
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <MiniPostCard key={post.id} {...post} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'bookmarks' && (
        <>
          {bookmarks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🔖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Belum ada tersimpan
              </h3>
              <p className="text-gray-600">
                Simpan materi yang menarik dengan menekan tombol bookmark!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) =>
                bookmark.posts ? (
                  <MiniPostCard key={bookmark.id} {...bookmark.posts} />
                ) : null
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
