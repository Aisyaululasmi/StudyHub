import { Suspense } from 'react'
import SearchBar from '@/components/post/SearchBar'
import FilterBar from '@/components/post/FilterBar'
import PostCard from '@/components/post/PostCard'
import FeedSkeleton from '@/components/loading/FeedSkeleton'
import PostCardSkeleton from '@/components/loading/PostCardSkeleton'
import { createClient } from '@/lib/supabase'
import type { PostWithAuthor } from '@/lib/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getPosts(searchParams: { [key: string]: string | string[] | undefined }) {
  const supabase = await createClient()

  const jurusan = typeof searchParams.jurusan === 'string' ? searchParams.jurusan : null
  const mataKuliah = typeof searchParams.mata_kuliah === 'string' ? searchParams.mata_kuliah : null
  const type = typeof searchParams.type === 'string' ? searchParams.type : null
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'newest'
  const search = typeof searchParams.q === 'string' ? searchParams.q : null
  const limit = parseInt(typeof searchParams.limit === 'string' ? searchParams.limit : '20')
  const offset = parseInt(typeof searchParams.offset === 'string' ? searchParams.offset : '0')

  let query = supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        name,
        avatar_url,
        jurusan
      )
    `)

  // Apply filters
  if (jurusan) {
    query = query.eq('jurusan', jurusan)
  }

  if (mataKuliah) {
    query = query.eq('mata_kuliah', mataKuliah)
  }

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  // Full-text search
  if (search) {
    query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
      type: 'websearch',
      config: 'indonesian',
    })
  }

  // Sorting
  switch (sort) {
    case 'most_upvotes':
      query = query.order('upvotes', { ascending: false })
      break
    case 'most_comments':
      query = query.order('created_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  query = query.range(offset, offset + limit - 1)

  const { data: posts, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return { posts: [], count: 0 }
  }

  // Get vote counts for each post
  const postIds = posts?.map((p) => p.id) || []
  const { data: votes } = await supabase
    .from('votes')
    .select('post_id, value')
    .in('post_id', postIds)

  // Get comment counts
  const { data: commentCounts } = await supabase
    .from('comments')
    .select('post_id')
    .in('post_id', postIds)

  // Get current user's votes and bookmarks
  const { data: { user } } = await supabase.auth.getUser()

  let userVotes: Map<string, boolean> = new Map()
  let userBookmarks: Map<string, boolean> = new Map()

  if (user) {
    const { data: userVotesData } = await supabase
      .from('votes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    const { data: userBookmarksData } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    userVotesData?.forEach((v) => userVotes.set(v.post_id, true))
    userBookmarksData?.forEach((b) => userBookmarks.set(b.post_id, true))
  }

  // Calculate counts
  const voteCounts = new Map<string, number>()
  votes?.forEach((v) => {
    voteCounts.set(v.post_id, (voteCounts.get(v.post_id) || 0) + v.value)
  })

  const commentCountMap = new Map<string, number>()
  commentCounts?.forEach((c) => {
    commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1)
  })

  // Add counts to posts
  const postsWithCounts = posts?.map((post) => ({
    ...post,
    vote_count: voteCounts.get(post.id) || 0,
    comment_count: commentCountMap.get(post.id) || 0,
    initialVoted: userVotes.get(post.id) || false,
    initialBookmarked: userBookmarks.get(post.id) || false,
  })) || []

  return { posts: postsWithCounts, count: postsWithCounts.length }
}

export default function FeedPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed</h1>
        <p className="text-gray-600">Temukan dan bagikan materi kuliah terbaik</p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Memuat...</div>}>
        <FeedContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function FeedContent({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const { posts, count } = await getPosts(searchParams)

  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q : null

  return (
    <>
      <SearchBar />
      <FilterBar resultCount={count} />

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            {searchQuery ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tidak ada hasil untuk "{searchQuery}"
                </h3>
                <p className="text-gray-600 mb-6">
                  Coba kata kunci lain atau periksa ejaan penulisan
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Belum ada materi
                </h3>
                <p className="text-gray-600 mb-6">
                  Jadilah yang pertama berbagi materi kuliah!
                </p>
              </>
            )}
            <a
              href="/submit"
              className="inline-flex items-center px-6 py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              Bagikan Materi
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                profiles={post.profiles}
                vote_count={post.vote_count}
                comment_count={post.comment_count}
                initialVoted={post.initialVoted}
                initialBookmarked={post.initialBookmarked}
              />
            ))}
          </div>

          {posts.length >= 20 && (
            <div className="flex justify-center">
              <LoadMoreButton currentOffset={posts.length} />
            </div>
          )}
        </>
      )}
    </>
  )
}

function LoadMoreButton({ currentOffset }: { currentOffset: number }) {
  return (
    <button
      onClick={() => {
        const url = new URL(window.location.href)
        url.searchParams.set('offset', currentOffset.toString())
        window.location.href = url.toString()
      }}
      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
    >
      Muat lebih banyak
    </button>
  )
}
